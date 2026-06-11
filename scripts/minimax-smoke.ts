// scripts/minimax-smoke.ts — end-to-end test of the AI path
// Hits /api/plan with several different origin/destination pairs (no
// pairId) so the request must go to the Ollama/MiniMax cloud model to
// generate a graph, then Dijkstra ranks the routes. Prints everything
// so we can verify the AI is actually being used.

const PORT = process.env.SMOKE_PORT ?? "3939";
const BASE = `http://localhost:${PORT}`;

const PAIRS: Array<{ origin: string; destination: string; mode: "time" | "budget" }> = [
  { origin: "Kuala Lumpur", destination: "George Town, Penang", mode: "time" },
  { origin: "Kuala Lumpur", destination: "George Town, Penang", mode: "budget" },
  { origin: "Johor Bahru", destination: "Cameron Highlands", mode: "time" },
  { origin: "Ipoh", destination: "Kuantan", mode: "time" },
  { origin: "Shah Alam", destination: "Kota Bharu", mode: "budget" },
];

interface PlanResp {
  source: "hardcoded" | "ai";
  stats: { beta: number; mode: string; distanceKm: number; timeMin: number; tollRM: number };
  graph: { junctions: { id: string; name: string }[]; edges: { id: string; from: string; to: string; tollRM: number; roadType: string }[] };
  routes: Array<{ totalWeight: number; totalDistanceKm: number; totalTimeMin: number; totalTollRM: number; path: string[]; edgeIds: string[] }>;
  recommended: { totalWeight: number; totalDistanceKm: number; totalTimeMin: number; totalTollRM: number; path: string[] };
  realRoads: Array<{ distanceKm: number; durationMin: number } | null>;
}

async function hit(pair: { origin: string; destination: string; mode: "time" | "budget" }): Promise<PlanResp | { error: string }> {
  const t0 = Date.now();
  // 10 min — MiniMax cloud graph generation can be slow on the first call.
  const ac = new AbortController();
  const killTimer = setTimeout(() => ac.abort(), 10 * 60_000);
  try {
    const res = await fetch(`${BASE}/api/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pair),
      signal: ac.signal,
    });
    const dt = Date.now() - t0;
    if (!res.ok) {
      return { error: `${res.status} ${(await res.text()).slice(0, 200)}` };
    }
    const data = (await res.json()) as PlanResp;
    console.log(`\n=== ${pair.origin} -> ${pair.destination} | ${pair.mode.toUpperCase()} (β=${pair.mode === "time" ? 0.5 : 2.5}) [${dt}ms] ===`);
    console.log(`source=${data.source}  junctions=${data.graph.junctions.length}  edges=${data.graph.edges.length}  routes=${data.routes.length}`);
    console.log(`junctions: ${data.graph.junctions.map((j) => j.name).join(" | ")}`);
    const roadTypes = new Set(data.graph.edges.map((e) => e.roadType));
    const tollEdges = data.graph.edges.filter((e) => e.tollRM > 0);
    console.log(`road-types: ${[...roadTypes].join(", ")}  toll-edges: ${tollEdges.length}  total toll if all = RM${tollEdges.reduce((s, e) => s + e.tollRM, 0).toFixed(2)}`);
    for (let i = 0; i < data.routes.length; i++) {
      const r = data.routes[i]!;
      const rr = data.realRoads[i];
      const realS = rr ? `real=${rr.distanceKm}km/${rr.durationMin}m` : "real=—";
      console.log(`  #${i + 1}  W=${r.totalWeight.toFixed(2)}  ${r.totalDistanceKm}km  ${r.totalTimeMin}m  RM${r.totalTollRM}  ${realS}  ${r.path.join(" -> ")}`);
    }
    return data;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `network/timeout: ${msg}` };
  } finally {
    clearTimeout(killTimer);
  }
}

async function main() {
  let aiCount = 0;
  let okCount = 0;
  for (const p of PAIRS) {
    const r = await hit(p);
    if ("error" in r) {
      console.log(`FAILED: ${r.error}`);
      continue;
    }
    okCount++;
    if (r.source === "ai") aiCount++;
  }
  console.log(`\n--- summary: ${okCount}/${PAIRS.length} OK, ${aiCount} served by AI ---`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

export {};
