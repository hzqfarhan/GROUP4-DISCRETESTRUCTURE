import { z } from "zod";
import type { WeightedGraph } from "../graph/types";

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
the undirected weighted graph of plausible road junctions and edges between them in Malaysia (Peninsular
Malaysia unless context suggests otherwise).

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

async function callOnce(
  origin: string,
  destination: string,
  model: string,
  baseUrl: string,
  apiKey: string,
  strict = false,
): Promise<unknown> {
  const userText = strict
    ? `Origin: ${origin}\nDestination: ${destination}\nReturn ONLY the JSON object. No markdown, no commentary. Start with { and end with }.`
    : `Origin: ${origin}\nDestination: ${destination}`;

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userText },
      ],
      temperature: 0.2,
      stream: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Ollama Cloud request failed (${res.status}): ${body.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new Error("Empty response from Ollama Cloud");
  }
  return extractJson(content);
}

export async function fetchDynamicGraph(
  origin: string,
  destination: string,
  apiKey: string,
  model: string,
  baseUrl: string,
): Promise<WeightedGraph> {
  let firstErr: unknown = null;
  try {
    const parsed = await callOnce(origin, destination, model, baseUrl, apiKey);
    const graph = GraphSchema.parse(parsed);
    return validateConnectivity(graph);
  } catch (err) {
    firstErr = err;
  }
  try {
    const parsed = await callOnce(
      origin,
      destination,
      model,
      baseUrl,
      apiKey,
      true,
    );
    const graph = GraphSchema.parse(parsed);
    return validateConnectivity(graph);
  } catch (secondErr) {
    void firstErr;
    const message =
      secondErr instanceof Error
        ? secondErr.message
        : "Unknown parse failure";
    throw new Error(
      `Could not parse route data from the AI service. ${message}`,
    );
  }
}

function validateConnectivity(graph: WeightedGraph): WeightedGraph {
  if (graph.junctions.length === 0) return graph;
  const adj = new Map<string, Set<string>>();
  for (const j of graph.junctions) adj.set(j.id, new Set());
  for (const e of graph.edges) {
    adj.get(e.from)?.add(e.to);
    adj.get(e.to)?.add(e.from);
  }
  const start = graph.junctions[0]!.id;
  const seen = new Set<string>([start]);
  const stack = [start];
  while (stack.length) {
    const u = stack.pop()!;
    for (const v of adj.get(u) ?? []) {
      if (!seen.has(v)) {
        seen.add(v);
        stack.push(v);
      }
    }
  }
  const orphans = graph.junctions.filter((j) => !seen.has(j.id));
  if (orphans.length === 0) return graph;
  const keepIds = new Set(seen);
  return {
    junctions: graph.junctions.filter((j) => keepIds.has(j.id)),
    edges: graph.edges.filter((e) => keepIds.has(e.from) && keepIds.has(e.to)),
  };
}
