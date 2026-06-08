import type { Edge, OptimizationMode, Route, WeightedGraph } from "./types";
import { calculateWeight } from "./weight";

interface AdjEdge {
  edge: Edge;
  to: string;
}

function buildAdjacency(graph: WeightedGraph): Map<string, AdjEdge[]> {
  const adj = new Map<string, AdjEdge[]>();
  for (const j of graph.junctions) adj.set(j.id, []);
  for (const e of graph.edges) {
    adj.get(e.from)?.push({ edge: e, to: e.to });
    adj.get(e.to)?.push({ edge: e, to: e.from });
  }
  return adj;
}

function findEdgeBetween(
  graph: WeightedGraph,
  from: string,
  to: string,
): Edge | undefined {
  return graph.edges.find(
    (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
  );
}

function buildRouteFromPath(
  graph: WeightedGraph,
  path: string[],
  mode: OptimizationMode,
): Route {
  let totalWeight = 0;
  let totalDistanceKm = 0;
  let totalTimeMin = 0;
  let totalTollRM = 0;
  const edgeIds: string[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const e = findEdgeBetween(graph, path[i]!, path[i + 1]!);
    if (!e) continue;
    totalWeight += calculateWeight(e, mode);
    totalDistanceKm += e.distanceKm;
    totalTimeMin += e.timeMin + e.penaltyMin;
    totalTollRM += e.tollRM;
    edgeIds.push(e.id);
  }
  return {
    path,
    totalWeight: Number(totalWeight.toFixed(4)),
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    totalTimeMin: Math.round(totalTimeMin),
    totalTollRM: Number(totalTollRM.toFixed(2)),
    edgeIds,
  };
}

class MinHeap<T> {
  private data: { key: number; value: T }[] = [];
  push(key: number, value: T) {
    this.data.push({ key, value });
    this.bubbleUp(this.data.length - 1);
  }
  pop(): { key: number; value: T } | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0]!;
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }
  get size() {
    return this.data.length;
  }
  private bubbleUp(i: number) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[parent]!.key <= this.data[i]!.key) break;
      [this.data[parent], this.data[i]] = [this.data[i]!, this.data[parent]!];
      i = parent;
    }
  }
  private sinkDown(i: number) {
    const n = this.data.length;
    while (true) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let smallest = i;
      if (l < n && this.data[l]!.key < this.data[smallest]!.key) smallest = l;
      if (r < n && this.data[r]!.key < this.data[smallest]!.key) smallest = r;
      if (smallest === i) break;
      [this.data[smallest], this.data[i]] = [this.data[i]!, this.data[smallest]!];
      i = smallest;
    }
  }
}

export function dijkstra(
  graph: WeightedGraph,
  startId: string,
  endId: string,
  mode: OptimizationMode,
): Route | null {
  const adj = buildAdjacency(graph);
  if (!adj.has(startId) || !adj.has(endId)) return null;

  const dist = new Map<string, number>();
  const prev = new Map<string, { node: string; edge: Edge } | null>();
  for (const j of graph.junctions) {
    dist.set(j.id, Infinity);
    prev.set(j.id, null);
  }
  dist.set(startId, 0);

  const heap = new MinHeap<string>();
  heap.push(0, startId);
  const visited = new Set<string>();

  while (heap.size > 0) {
    const top = heap.pop()!;
    const u = top.value;
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === endId) break;
    if (top.key > (dist.get(u) ?? Infinity)) continue;

    for (const { edge, to } of adj.get(u) ?? []) {
      if (visited.has(to)) continue;
      const w = calculateWeight(edge, mode);
      const newDist = (dist.get(u) ?? Infinity) + w;
      if (newDist < (dist.get(to) ?? Infinity)) {
        dist.set(to, newDist);
        prev.set(to, { node: u, edge });
        heap.push(newDist, to);
      }
    }
  }

  if ((dist.get(endId) ?? Infinity) === Infinity) return null;

  const path: string[] = [];
  const edgeIds: string[] = [];
  let cur: string | null = endId;
  while (cur) {
    path.unshift(cur);
    const p = prev.get(cur);
    if (p) {
      edgeIds.unshift(p.edge.id);
      cur = p.node;
    } else {
      cur = null;
    }
  }

  return buildRouteFromPath(graph, path, mode);
}

export function findAllRoutes(
  graph: WeightedGraph,
  startId: string,
  endId: string,
  mode: OptimizationMode,
  limit = 5,
): Route[] {
  const adj = buildAdjacency(graph);
  if (!adj.has(startId) || !adj.has(endId)) return [];

  const seen = new Set<string>();
  const results: Route[] = [];
  const MAX_DEPTH = 8;

  function dfs(node: string, path: string[], visited: Set<string>) {
    if (path.length > MAX_DEPTH + 1) return;
    if (node === endId) {
      const key = path.join(">");
      if (!seen.has(key)) {
        seen.add(key);
        results.push(buildRouteFromPath(graph, path, mode));
      }
      return;
    }
    for (const { to } of adj.get(node) ?? []) {
      if (visited.has(to)) continue;
      const next = new Set(visited);
      next.add(to);
      dfs(to, [...path, to], next);
    }
  }

  dfs(startId, [startId], new Set([startId]));

  results.sort((a, b) => a.totalWeight - b.totalWeight);
  return results.slice(0, limit);
}
