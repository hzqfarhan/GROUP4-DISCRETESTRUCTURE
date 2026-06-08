import type { WeightedGraph } from "./types";
import {
  UTHM_SENDAYAN_GRAPH,
  UTHM_SENDAYAN_PAIR,
} from "./uthm-sendayan";

export function isHardcodedPair(origin: string, destination: string): boolean {
  const o = origin.trim().toLowerCase();
  const d = destination.trim().toLowerCase();
  return (
    o === UTHM_SENDAYAN_PAIR.origin.toLowerCase() &&
    d === UTHM_SENDAYAN_PAIR.destination.toLowerCase()
  );
}

export function getHardcodedGraph(): WeightedGraph {
  return UTHM_SENDAYAN_GRAPH;
}
