import type {
  OptimizationMode,
  RoadType,
  Route,
  WeightedGraph,
} from "@/lib/graph/types";

export function resolveJunctionId(
  graph: WeightedGraph,
  name: string,
): string | null {
  const n = name.trim().toLowerCase().replace(/[,\s]+/g, " ").trim();
  // 1. Exact (case-insensitive, comma-normalised) match
  for (const j of graph.junctions) {
    const jn = j.name.trim().toLowerCase().replace(/[,\s]+/g, " ").trim();
    if (jn === n) return j.id;
  }
  // 2. Substring either way (e.g. user types "George Town" and AI wrote "George Town, Penang")
  for (const j of graph.junctions) {
    const jn = j.name.trim().toLowerCase().replace(/[,\s]+/g, " ").trim();
    if (jn.includes(n) || n.includes(jn)) return j.id;
  }
  // 3. Word-prefix match (helps when AI changes "Kuala Lumpur" -> "KL" etc.)
  const nFirst = n.split(" ")[0]!;
  for (const j of graph.junctions) {
    const jn = j.name.trim().toLowerCase().replace(/[,\s]+/g, " ").trim();
    if (jn.startsWith(nFirst) || n.startsWith(jn.split(" ")[0]!)) return j.id;
  }
  return null;
}

export function roadTypesForRoute(
  graph: WeightedGraph,
  route: Route,
): RoadType[] {
  const out: RoadType[] = [];
  for (const eid of route.edgeIds) {
    const e = graph.edges.find((x) => x.id === eid);
    if (e) out.push(e.roadType);
  }
  return out;
}

export type Mode = OptimizationMode;
