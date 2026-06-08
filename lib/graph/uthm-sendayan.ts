import type { Edge, Junction, WeightedGraph } from "./types";

export const UTHM_SENDAYAN_PAIR = {
  origin: "UTHM Parit Raja",
  destination: "Masjid Sri Sendayan",
  originId: "N1_UTHM",
  destinationId: "N10_Masjid",
  originCoord: { lat: 1.8592, lng: 103.0819 },
  destinationCoord: { lat: 2.6248, lng: 101.8407 },
} as const;

// Real coordinates (Google Maps) for each junction, plus calibrated
// distance/time/toll data based on actual drive estimates.
const junctions: Junction[] = [
  { id: "N1_UTHM", name: "UTHM Parit Raja", lat: 1.8592, lng: 103.0819 },
  { id: "N2_AyerHitamTol", name: "Ayer Hitam Tol (PLUS)", lat: 1.9211, lng: 103.1811 },
  { id: "N3_YongPeng", name: "Yong Peng", lat: 2.0128, lng: 103.0631 },
  { id: "N4_Segamat", name: "Segamat", lat: 2.5144, lng: 102.8169 },
  { id: "N5_Gemas", name: "Gemas", lat: 2.5825, lng: 102.6144 },
  { id: "N6_Tampin", name: "Tampin", lat: 2.4706, lng: 102.2308 },
  { id: "N7_Rembau", name: "Rembau", lat: 2.5906, lng: 102.0953 },
  { id: "N8_Seremban", name: "Seremban", lat: 2.7258, lng: 101.9425 },
  { id: "N9_SerembanTol", name: "Seremban Tol (PLUS)", lat: 2.6850, lng: 101.9053 },
  { id: "N10_Masjid", name: "Masjid Sri Sendayan", lat: 2.6248, lng: 101.8407 },
];

// Edge data: distance is km along the actual road, time is minute estimate
// for typical daytime driving, tolls are RM (cash / Touch n Go).
const edges: Edge[] = [
  // E1 UTHM -> Ayer Hitam (PLUS entry, short hop on the highway)
  { id: "E1", from: "N1_UTHM", to: "N2_AyerHitamTol", distanceKm: 22, timeMin: 18, tollRM: 1.50, roadType: "highway", penaltyMin: 0 },
  // E2 Ayer Hitam -> Seremban Tol (long PLUS stretch, RM tolls summed)
  { id: "E2", from: "N2_AyerHitamTol", to: "N9_SerembanTol", distanceKm: 198, timeMin: 125, tollRM: 23.30, roadType: "highway", penaltyMin: 0 },
  // E3 Seremban Tol -> Masjid Sri Sendayan (local)
  { id: "E3", from: "N9_SerembanTol", to: "N10_Masjid", distanceKm: 14, timeMin: 22, tollRM: 0.0, roadType: "local", penaltyMin: 5 },

  // E4 UTHM -> Yong Peng (Federal Route 1)
  { id: "E4", from: "N1_UTHM", to: "N3_YongPeng", distanceKm: 28, timeMin: 32, tollRM: 0.0, roadType: "federal", penaltyMin: 6 },
  // E5 Yong Peng -> Segamat (Federal Route 1)
  { id: "E5", from: "N3_YongPeng", to: "N4_Segamat", distanceKm: 70, timeMin: 80, tollRM: 0.0, roadType: "federal", penaltyMin: 8 },
  // E6 Segamat -> Gemas (Federal Route 1)
  { id: "E6", from: "N4_Segamat", to: "N5_Gemas", distanceKm: 38, timeMin: 42, tollRM: 0.0, roadType: "federal", penaltyMin: 4 },
  // E7 Gemas -> Tampin (Federal Route 1)
  { id: "E7", from: "N5_Gemas", to: "N6_Tampin", distanceKm: 56, timeMin: 62, tollRM: 0.0, roadType: "federal", penaltyMin: 4 },
  // E8 Tampin -> Rembau (Federal Route 1)
  { id: "E8", from: "N6_Tampin", to: "N7_Rembau", distanceKm: 38, timeMin: 42, tollRM: 0.0, roadType: "federal", penaltyMin: 4 },
  // E9 Rembau -> Masjid Sri Sendayan (local)
  { id: "E9", from: "N7_Rembau", to: "N10_Masjid", distanceKm: 32, timeMin: 40, tollRM: 0.0, roadType: "local", penaltyMin: 5 },

  // E10 Tampin -> Seremban (AMJ alternative, mostly federal, single toll)
  { id: "E10", from: "N6_Tampin", to: "N8_Seremban", distanceKm: 42, timeMin: 48, tollRM: 0.0, roadType: "federal", penaltyMin: 5 },
  // E11 Seremban -> Seremban Tol (short connector)
  { id: "E11", from: "N8_Seremban", to: "N9_SerembanTol", distanceKm: 9, timeMin: 12, tollRM: 0.0, roadType: "local", penaltyMin: 2 },
];

export const UTHM_SENDAYAN_GRAPH: WeightedGraph = { junctions, edges };
