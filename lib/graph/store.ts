import type { WeightedGraph } from "./types";
import { HARDCODED_PAIRS, resolveHardcodedPair } from "./registry";

export function isHardcodedPair(origin: string, destination: string): boolean {
  return resolveHardcodedPair(origin, destination) !== null;
}

export function getHardcodedGraph(): WeightedGraph {
  const fallback = HARDCODED_PAIRS[0];
  if (!fallback) throw new Error("No hardcoded pairs registered");
  return fallback.graph;
}

export { resolveHardcodedPair, HARDCODED_PAIRS };
