export type OptimizationMode = "time" | "budget";

export type RoadType = "highway" | "federal" | "local";

export interface Junction {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  distanceKm: number;
  timeMin: number;
  tollRM: number;
  roadType: RoadType;
  penaltyMin: number;
}

export interface WeightedGraph {
  junctions: Junction[];
  edges: Edge[];
}

export interface Route {
  path: string[];
  totalWeight: number;
  totalDistanceKm: number;
  totalTimeMin: number;
  totalTollRM: number;
  edgeIds: string[];
}

export interface TripStats {
  distanceKm: number;
  timeMin: number;
  tollRM: number;
  formattedTime: string;
  roadTypes: RoadType[];
  beta: number;
  mode: OptimizationMode;
}

export interface RealRoadGeometry {
  distanceKm: number;
  durationMin: number;
  geometry: { lat: number; lng: number }[];
}

export interface PlanResponse {
  graph: WeightedGraph;
  routes: Route[];
  recommended: Route;
  stats: TripStats;
  source: "hardcoded" | "ai";
  realRoad: RealRoadGeometry | null;
  realRoads: (RealRoadGeometry | null)[];
}
