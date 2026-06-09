import type { WeightedGraph } from "./types";
import { UTHM_SENDAYAN_GRAPH, UTHM_SENDAYAN_PAIR } from "./uthm-sendayan";
import { UTHM_MELAKA_GRAPH, UTHM_MELAKA_PAIR } from "./uthm-melaka";

export interface HardcodedPair {
  id: "sendayan" | "melaka";
  origin: string;
  destination: string;
  originId: string;
  destinationId: string;
  originCoord: { lat: number; lng: number };
  destinationCoord: { lat: number; lng: number };
  graph: WeightedGraph;
  tagline: string;
}

export const HARDCODED_PAIRS: HardcodedPair[] = [
  {
    id: "sendayan",
    origin: UTHM_SENDAYAN_PAIR.origin,
    destination: UTHM_SENDAYAN_PAIR.destination,
    originId: UTHM_SENDAYAN_PAIR.originId,
    destinationId: UTHM_SENDAYAN_PAIR.destinationId,
    originCoord: UTHM_SENDAYAN_PAIR.originCoord,
    destinationCoord: UTHM_SENDAYAN_PAIR.destinationCoord,
    graph: UTHM_SENDAYAN_GRAPH,
    tagline: "UTHM → Masjid Sri Sendayan (highway + federal)",
  },
  {
    id: "melaka",
    origin: UTHM_MELAKA_PAIR.origin,
    destination: UTHM_MELAKA_PAIR.destination,
    originId: UTHM_MELAKA_PAIR.originId,
    destinationId: UTHM_MELAKA_PAIR.destinationId,
    originCoord: UTHM_MELAKA_PAIR.originCoord,
    destinationCoord: UTHM_MELAKA_PAIR.destinationCoord,
    graph: UTHM_MELAKA_GRAPH,
    tagline: "UTHM → Masjid Selat Melaka (6 route families)",
  },
];

export function resolveHardcodedPair(
  origin: string,
  destination: string,
): HardcodedPair | null {
  const o = origin.trim().toLowerCase();
  const d = destination.trim().toLowerCase();
  for (const p of HARDCODED_PAIRS) {
    if (
      o === p.origin.toLowerCase() &&
      d === p.destination.toLowerCase()
    ) {
      return p;
    }
  }
  return null;
}
