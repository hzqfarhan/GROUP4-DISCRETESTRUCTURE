import type { Edge, OptimizationMode } from "./types";

export function getBeta(mode: OptimizationMode): number {
  return mode === "time" ? 0.5 : 2.5;
}

export function calculateWeight(edge: Edge, mode: OptimizationMode): number {
  const beta = getBeta(mode);
  return edge.timeMin + edge.tollRM * beta + edge.penaltyMin;
}
