// scripts/compare-models.ts — call /api/plan with the same novel O/D pair
// against a few different Ollama models and compare latency + success
// + the number of routes the AI emits. Updates the server's
// OLLAMA_CLOUD_MODEL via per-request env swap is not possible, so we
// hit the upstream Ollama chat-completions endpoint directly through a
// tiny shim that runs the same GraphSchema as the API.

import { z } from "zod";

const KEY = "01f6be0a6caa4ab6b6d63ca5bd8936a1.W2minnWOLCsSR1mvNJYk6q_Z";
const BASE = "https://ollama.com/v1";
const ORIGIN = "Kuala Lumpur";
const DEST = "George Town, Penang";

const JunctionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
});
const EdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  distanceKm: z.number().positive(),
  timeMin: z.number().positive(),
  tollRM: z.number().min(0),
  roadType: z.enum(["highway", "federal", "local"]),
  penaltyMin: z.number().min(0),
});
const GraphSchema = z.object({
  junctions: z.array(JunctionSchema).min(2),
  edges: z.array(EdgeSchema).min(1),
});

const SYSTEM_PROMPT = `You are a routing-graph data generator. The user gives you an origin and a destination.
Respond with ONLY a single valid JSON object (no prose, no markdown fences, no commentary) describing
the undirected weighted graph of plausible road junctions and edges between them in Malaysia.

Schema:
{
  "junctions": [
    { "id": "N1_origin", "name": "Origin name", "lat": 1.85, "lng": 103.08 },
    ... 3 to 7 intermediate junctions ...
    { "id": "Nx_dest",   "name": "Destination name", "lat": 2.62, "lng": 101.84 }
  ],
  "edges": [
    {
      "id": "E1",
      "from": "N1_origin",
      "to": "N2_next",
      "distanceKm": 25,
      "timeMin": 20,
      "tollRM": 0.0,
      "roadType": "highway" | "federal" | "local",
      "penaltyMin": 0
    }
  ]
}

Rules:
- The first junction's name MUST be the origin; the last junction's name MUST be the destination.
- Provide 2-3 alternate route families (expressway vs federal vs local).
- lat/lng should be realistic for the region. Estimate if you must; rough values are fine.
- Use real place names for intermediate junctions.
- All edge ids unique. All junction ids unique. Every edge references existing junction ids.
- Return ONLY the JSON. Start your reply with { and end with }.`;

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in response");
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

interface ModelResult {
  model: string;
  ok: boolean;
  ms: number;
  junctions?: number;
  edges?: number;
  roadTypes?: string[];
  totalToll?: number;
  routes?: number;
  err?: string;
  sample?: string;
}

async function tryModel(model: string): Promise<ModelResult> {
  const ac = new AbortController();
  const kill = setTimeout(() => ac.abort(), 5 * 60_000);
  const t0 = Date.now();
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Origin: ${ORIGIN}\nDestination: ${DEST}\nReturn ONLY the JSON object. No markdown, no commentary. Start with { and end with }.` },
        ],
        temperature: 0.2,
        stream: false,
      }),
      signal: ac.signal,
    });
    const ms = Date.now() - t0;
    if (!res.ok) {
      const t = await res.text();
      return { model, ok: false, ms, err: `${res.status} ${t.slice(0, 160)}` };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      return { model, ok: false, ms, err: "empty content" };
    }
    let parsed: unknown;
    try {
      parsed = extractJson(content);
    } catch (e) {
      return {
        model,
        ok: false,
        ms,
        err: `json-parse: ${(e as Error).message}`,
        sample: content.slice(0, 240),
      };
    }
    let graph: z.infer<typeof GraphSchema>;
    try {
      graph = GraphSchema.parse(parsed);
    } catch (e) {
      return {
        model,
        ok: false,
        ms,
        err: `schema: ${(e as Error).message.slice(0, 200)}`,
        sample: content.slice(0, 240),
      };
    }
    const roadTypes = new Set(graph.edges.map((e) => e.roadType));
    const totalToll = graph.edges.reduce((s, e) => s + e.tollRM, 0);
    return {
      model,
      ok: true,
      ms,
      junctions: graph.junctions.length,
      edges: graph.edges.length,
      roadTypes: [...roadTypes],
      totalToll: Number(totalToll.toFixed(2)),
      routes: Math.max(0, graph.junctions.length - 2) * 2, // rough upper bound
    };
  } catch (e) {
    return {
      model,
      ok: false,
      ms: Date.now() - t0,
      err: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(kill);
  }
}

const MODELS = [
  "gpt-oss:20b",           // mid
  "rnj-1:8b",              // small
];

async function main() {
  console.log(`Origin: ${ORIGIN}`);
  console.log(`Dest:   ${DEST}\n`);
  console.log("model                              ok    ms        J    E   road-types                 toll");
  console.log("---------------------------------- ----  --------  ---  ---  -------------------------  ------");
  for (const m of MODELS) {
    const r = await tryModel(m);
    const ok = r.ok ? "yes" : "no ";
    const J = r.junctions ?? "-";
    const E = r.edges ?? "-";
    const RT = (r.roadTypes ?? []).join(",").padEnd(25);
    const T = r.totalToll != null ? `RM${r.totalToll.toFixed(2)}` : "-";
    console.log(`${m.padEnd(34)} ${ok}  ${String(r.ms).padStart(8)}  ${String(J).padStart(3)}  ${String(E).padStart(3)}  ${RT}  ${T}`);
    if (!r.ok) console.log(`   ↳ err: ${r.err}${r.sample ? "  | sample: " + r.sample : ""}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
