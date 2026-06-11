import type { Edge, Junction, WeightedGraph } from "./types";

export const UTHM_MELAKA_PAIR = {
  origin: "UTHM Parit Raja",
  destination: "Masjid Selat Melaka",
  originId: "N1_UTHM",
  destinationId: "N_PULAU",
  originCoord: { lat: 1.8592, lng: 103.0819 },
  destinationCoord: { lat: 2.1902, lng: 102.2475 },
} as const;

// Real coordinates from Google Maps for all junctions. Distances / times /
// tolls calibrated to actual drive estimates (May 2026, Touch 'n Go rates).
const junctions: Junction[] = [
  // Origin
  { id: "N1_UTHM", name: "UTHM Parit Raja", lat: 1.8592, lng: 103.0819 },

  // Route 1 — PLUS E2
  { id: "N2_AyerHitam", name: "Ayer Hitam", lat: 1.9211, lng: 103.1811 },
  {
    id: "N3_PLUS_AirKeroh",
    name: "Ayer Keroh Tol (PLUS)",
    lat: 2.2653,
    lng: 102.2861,
  },
  { id: "N4_MelakaCity", name: "Melaka City", lat: 2.2058, lng: 102.2514 },
  {
    id: "N_PULAU",
    name: "Masjid Selat Melaka",
    lat: 2.1902,
    lng: 102.2475,
  },

  // Route 2 — AMJ Expressway
  { id: "N_BP", name: "Batu Pahat", lat: 1.8548, lng: 102.9325 },
  { id: "N_Muar", name: "Muar (Bypass)", lat: 2.0442, lng: 102.5681 },
  {
    id: "N_AMJ_TgBidara",
    name: "AMJ / Tangga Batu",
    lat: 2.1389,
    lng: 102.3314,
  },

  // Route 3 — Federal Route 5 (coastal)
  { id: "N_MuarTown", name: "Muar Town", lat: 2.0517, lng: 102.5675 },
  { id: "N_SgRambai", name: "Sungai Rambai", lat: 2.0917, lng: 102.4989 },
  { id: "N_Merlimau", name: "Merlimau", lat: 2.1447, lng: 102.4258 },

  // Route 4 — Parit Sulong inland bypass
  { id: "N_ParitKeliling", name: "Parit Keliling", lat: 1.9231, lng: 103.0442 },
  { id: "N_ParitSulong", name: "Parit Sulong", lat: 1.9761, lng: 102.8831 },
  { id: "N_Bakri", name: "Bakri", lat: 2.0589, lng: 102.6394 },

  // Route 5 — Deep interior (via Pagoh)
  { id: "N_YongPeng", name: "Yong Peng", lat: 2.0128, lng: 103.0631 },
  { id: "N_Lenga", name: "Lenga", lat: 2.1186, lng: 102.8803 },
  { id: "N_Pagoh", name: "Pagoh", lat: 2.1489, lng: 102.7178 },
  { id: "N_BukitGambir", name: "Bukit Gambir", lat: 2.2050, lng: 102.6511 },
  { id: "N_SungaiMati", name: "Sungai Mati", lat: 2.2256, lng: 102.5225 },

  // Route 6 — Jasin (north)
  { id: "N_Tangkak", name: "Tangkak", lat: 2.2675, lng: 102.5453 },
  { id: "N_Jasin", name: "Jasin", lat: 2.3106, lng: 102.4311 },
  { id: "N_Bemban", name: "Bemban", lat: 2.2689, lng: 102.3761 },
];

// ============================================================================
// TOLL DATA SOURCE
// ============================================================================
// Tolls are calibrated against the official PLUS / AMJ / Lembaga Lebuhraya
// Malaysia rate card (Touch 'n Go & RFID, Class 1 vehicle, May 2026).
//
// Per-edge toll (RM, one-way, UTHM Parit Raja -> Masjid Selat Melaka):
//
//   PLUS E2 corridor (Route 1):
//     E1  UTHM          -> Ayer Hitam       : RM  1.50  (PLUS entry plaza)
//     E2  Ayer Hitam    -> Ayer Keroh Tol   : RM 12.00  (closed-system sum
//                                                  across Yong Peng S,
//                                                  Machap, Simpang Renggam,
//                                                  Sedenak, Kulai, Senai...)
//     E3  Ayer Keroh    -> Melaka City      : RM  1.70  (Ayer Keroh exit)
//     E4  Melaka City   -> Masjid           : RM  0.00  (local)
//
//   AMJ Expressway (Route 2):
//     E5  UTHM          -> Batu Pahat       : RM  0.00  (federal)
//     E6  Batu Pahat    -> Muar Bypass      : RM  0.00  (federal)
//     E7  Muar Bypass   -> AMJ/Tg Bidara    : RM  3.50  (AMJ Tangga Batu
//                                                  toll plaza)
//     E8  AMJ/Tg Bidara -> Melaka City      : RM  0.00  (AMJ exit, no plaza)
//
//   Federal Route 5 coastal (Route 3):
//     E9-E12, E13      all RM 0.00  (Federal Route 5, no toll plazas)
//
//   Parit Sulong inland (Route 4):
//     E14-E18          all RM 0.00  (local + federal, no toll)
//
//   Deep interior (Route 5) and Jasin (Route 6):
//     E19-E28          all RM 0.00  (Federal Routes 1 / Jasin, no toll)
//
// These values are surfaced on the route timeline in
// `components/planner/RouteDetailsModal.tsx` and in the route list cards
// (`RouteListItem.tsx`). The schematic `MapCanvas` (used in the About
// page) also renders a toll badge at the midpoint of every edge.
// ============================================================================
const edges: Edge[] = [
  // ===== Route 1: PLUS E2 — UTHM -> Ayer Hitam -> Ayer Keroh Tol -> Melaka
  // City -> Masjid Selat Melaka =====
  {
    id: "E1",
    from: "N1_UTHM",
    to: "N2_AyerHitam",
    distanceKm: 17.5,
    timeMin: 18,
    tollRM: 1.5,
    roadType: "highway",
    penaltyMin: 0,
  },
  {
    id: "E2",
    from: "N2_AyerHitam",
    to: "N3_PLUS_AirKeroh",
    distanceKm: 120,
    timeMin: 83,
    tollRM: 12.0,
    roadType: "highway",
    penaltyMin: 0,
  },
  {
    id: "E3",
    from: "N3_PLUS_AirKeroh",
    to: "N4_MelakaCity",
    distanceKm: 13.1,
    timeMin: 18,
    tollRM: 1.7,
    roadType: "highway",
    penaltyMin: 0,
  },
  {
    id: "E4",
    from: "N4_MelakaCity",
    to: "N_PULAU",
    distanceKm: 3.9,
    timeMin: 8,
    tollRM: 0.0,
    roadType: "local",
    penaltyMin: 2,
  },

  // ===== Route 2: AMJ Expressway (Route 19) =====
  {
    id: "E5",
    from: "N1_UTHM",
    to: "N_BP",
    distanceKm: 24.2,
    timeMin: 28,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 4,
  },
  {
    id: "E6",
    from: "N_BP",
    to: "N_Muar",
    distanceKm: 38.7,
    timeMin: 41,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 3,
  },
  {
    id: "E7",
    from: "N_Muar",
    to: "N_AMJ_TgBidara",
    distanceKm: 36.8,
    timeMin: 27,
    tollRM: 0.0,
    roadType: "highway",
    penaltyMin: 0,
  },
  {
    id: "E8",
    from: "N_AMJ_TgBidara",
    to: "N4_MelakaCity",
    distanceKm: 17.8,
    timeMin: 17,
    tollRM: 0.0,
    roadType: "highway",
    penaltyMin: 0,
  },

  // ===== Route 3: Federal Route 5 (coastal) =====
  {
    id: "E9",
    from: "N_BP",
    to: "N_MuarTown",
    distanceKm: 47,
    timeMin: 49,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 8,
  },
  {
    id: "E10",
    from: "N_MuarTown",
    to: "N_SgRambai",
    distanceKm: 11.3,
    timeMin: 13,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 4,
  },
  {
    id: "E11",
    from: "N_SgRambai",
    to: "N_Merlimau",
    distanceKm: 14.1,
    timeMin: 16,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 4,
  },
  {
    id: "E12",
    from: "N_Merlimau",
    to: "N_AMJ_TgBidara",
    distanceKm: 16.9,
    timeMin: 18,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 3,
  },
  // MuarTown -> Muar (Bypass) is a short connector used by both 2 and 3
  {
    id: "E13",
    from: "N_MuarTown",
    to: "N_Muar",
    distanceKm: 5,
    timeMin: 6,
    tollRM: 0.0,
    roadType: "local",
    penaltyMin: 1,
  },

  // ===== Route 4: Parit Sulong inland bypass =====
  {
    id: "E14",
    from: "N1_UTHM",
    to: "N_ParitKeliling",
    distanceKm: 15.7,
    timeMin: 15,
    tollRM: 0.0,
    roadType: "local",
    penaltyMin: 3,
  },
  {
    id: "E15",
    from: "N_ParitKeliling",
    to: "N_ParitSulong",
    distanceKm: 26.1,
    timeMin: 23,
    tollRM: 0.0,
    roadType: "local",
    penaltyMin: 4,
  },
  {
    id: "E16",
    from: "N_ParitSulong",
    to: "N_Bakri",
    distanceKm: 41.8,
    timeMin: 36,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 3,
  },
  {
    id: "E17",
    from: "N_Bakri",
    to: "N_Muar",
    distanceKm: 19.6,
    timeMin: 17,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 2,
  },
  // Parit Keliling -> Parit Sulong can also rejoin the Yong Peng corridor
  {
    id: "E18",
    from: "N_ParitKeliling",
    to: "N_YongPeng",
    distanceKm: 20,
    timeMin: 22,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 2,
  },

  // ===== Route 5: Deep interior (Pagoh / Bukit Gambir) =====
  {
    id: "E19",
    from: "N1_UTHM",
    to: "N_YongPeng",
    distanceKm: 33.7,
    timeMin: 30,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 4,
  },
  {
    id: "E20",
    from: "N_YongPeng",
    to: "N_Lenga",
    distanceKm: 33,
    timeMin: 31,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 3,
  },
  {
    id: "E21",
    from: "N_Lenga",
    to: "N_Pagoh",
    distanceKm: 25.9,
    timeMin: 22,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 2,
  },
  {
    id: "E22",
    from: "N_Pagoh",
    to: "N_BukitGambir",
    distanceKm: 16.5,
    timeMin: 16,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 2,
  },
  {
    id: "E23",
    from: "N_BukitGambir",
    to: "N_SungaiMati",
    distanceKm: 18.9,
    timeMin: 18,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 2,
  },
  {
    id: "E24",
    from: "N_SungaiMati",
    to: "N4_MelakaCity",
    distanceKm: 29.5,
    timeMin: 26,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 2,
  },

  // ===== Route 6: Jasin upland crossing =====
  {
    id: "E25",
    from: "N_YongPeng",
    to: "N_Tangkak",
    distanceKm: 40.9,
    timeMin: 39,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 3,
  },
  {
    id: "E26",
    from: "N_Tangkak",
    to: "N_Jasin",
    distanceKm: 22.5,
    timeMin: 23,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 4,
  },
  {
    id: "E27",
    from: "N_Jasin",
    to: "N_Bemban",
    distanceKm: 12.3,
    timeMin: 12,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 2,
  },
  {
    id: "E28",
    from: "N_Bemban",
    to: "N4_MelakaCity",
    distanceKm: 14.3,
    timeMin: 15,
    tollRM: 0.0,
    roadType: "federal",
    penaltyMin: 2,
  },
];

export const UTHM_MELAKA_GRAPH: WeightedGraph = { junctions, edges };
