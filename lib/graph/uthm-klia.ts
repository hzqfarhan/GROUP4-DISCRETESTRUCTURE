import type { Edge, Junction, WeightedGraph } from "./types";

export const UTHM_KLIA_PAIR = {
  origin: "UTHM Parit Raja",
  destination: "KLIA",
  originId: "N1_UTHM",
  destinationId: "N_KLIA",
  originCoord: { lat: 1.8592, lng: 103.0819 },
  destinationCoord: { lat: 2.7456, lng: 101.7073 },
} as const;

const junctions: Junction[] = [
  // Origin
  { id: "N1_UTHM", name: "UTHM Parit Raja", lat: 1.8592, lng: 103.0819 },

  // Route 1 — PLUS Highway
  { id: "N2_AyerHitam", name: "Ayer Hitam", lat: 1.9211, lng: 103.1811 },
  { id: "N_NilaiToll", name: "Nilai Toll Plaza", lat: 2.8105, lng: 101.7891 },
  { id: "N_KLIA", name: "KLIA", lat: 2.7456, lng: 101.7073 },

  // Route 2 — Coastal (Batu Pahat -> Muar -> Melaka -> Port Dickson)
  { id: "N_BP", name: "Batu Pahat", lat: 1.8548, lng: 102.9325 },
  { id: "N_Muar", name: "Muar", lat: 2.0442, lng: 102.5681 },
  { id: "N4_MelakaCity", name: "Melaka City", lat: 2.2058, lng: 102.2514 },
  { id: "N_PD", name: "Port Dickson", lat: 2.5228, lng: 101.7958 },

  // Route 3 — Inland (Yong Peng -> Segamat -> Gemas -> Seremban)
  { id: "N_YongPeng", name: "Yong Peng", lat: 2.0128, lng: 103.0631 },
  { id: "N_Segamat", name: "Segamat", lat: 2.5117, lng: 102.8239 },
  { id: "N_Gemas", name: "Gemas", lat: 2.5841, lng: 102.6105 },
  { id: "N_Seremban", name: "Seremban", lat: 2.7318, lng: 101.9366 },
];

const edges: Edge[] = [
  // ===== Route 1: PLUS Highway =====
  {
    id: "K1",
    from: "N1_UTHM",
    to: "N2_AyerHitam",
    distanceKm: 17.5,
    timeMin: 18,
    tollRM: 1.5,
    roadType: "highway",
    penaltyMin: 0,
  },
  {
    id: "K2",
    from: "N2_AyerHitam",
    to: "N_NilaiToll",
    distanceKm: 185.0,
    timeMin: 110,
    tollRM: 24.50, // Approx Ayer Hitam -> Nilai
    roadType: "highway",
    penaltyMin: 0,
  },
  {
    id: "K3",
    from: "N_NilaiToll",
    to: "N_KLIA",
    distanceKm: 22.0,
    timeMin: 20,
    tollRM: 0.0,
    roadType: "local",
    penaltyMin: 3,
  },

  // ===== Route 2: Coastal Federal Route =====
  {
    id: "K4",
    from: "N1_UTHM",
    to: "N_BP",
    distanceKm: 24.2,
    timeMin: 28,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 4,
  },
  {
    id: "K5",
    from: "N_BP",
    to: "N_Muar",
    distanceKm: 55.0,
    timeMin: 60,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 6,
  },
  {
    id: "K6",
    from: "N_Muar",
    to: "N4_MelakaCity",
    distanceKm: 45.0,
    timeMin: 55,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 5,
  },
  {
    id: "K7",
    from: "N4_MelakaCity",
    to: "N_PD",
    distanceKm: 75.0,
    timeMin: 90,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 5,
  },
  {
    id: "K8",
    from: "N_PD",
    to: "N_KLIA",
    distanceKm: 45.0,
    timeMin: 50,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 4,
  },

  // ===== Route 3: Inland Bypass =====
  {
    id: "K9",
    from: "N1_UTHM",
    to: "N_YongPeng",
    distanceKm: 33.7,
    timeMin: 30,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 3,
  },
  {
    id: "K10",
    from: "N_YongPeng",
    to: "N_Segamat",
    distanceKm: 70.0,
    timeMin: 75,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 6,
  },
  {
    id: "K11",
    from: "N_Segamat",
    to: "N_Gemas",
    distanceKm: 30.0,
    timeMin: 35,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 3,
  },
  {
    id: "K12",
    from: "N_Gemas",
    to: "N_Seremban",
    distanceKm: 95.0,
    timeMin: 100,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 8,
  },
  {
    id: "K13",
    from: "N_Seremban",
    to: "N_KLIA",
    distanceKm: 55.0,
    timeMin: 50,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 4,
  },
];

export const UTHM_KLIA_GRAPH: WeightedGraph = { junctions, edges };
