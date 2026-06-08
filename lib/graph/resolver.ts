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
  const n = name.trim().toLowerCase();
  for (const j of graph.junctions) {
    if (j.name.trim().toLowerCase() === n) return j.id;
  }
  for (const j of graph.junctions) {
    if (j.name.trim().toLowerCase().includes(n)) return j.id;
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
