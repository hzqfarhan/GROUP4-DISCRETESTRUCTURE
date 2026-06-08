import type { OptimizationMode, RoadType, Route, TripStats } from "./types";
import { getBeta } from "./weight";

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0 Minutes";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} Minute${m === 1 ? "" : "s"}`;
  if (m === 0) return `${h} Hour${h === 1 ? "" : "s"}`;
  return `${h} Hour${h === 1 ? "" : "s"} ${m} Minute${m === 1 ? "" : "s"}`;
}

export function computeTripStats(
  route: Route,
  mode: OptimizationMode,
  roadTypes: RoadType[],
): TripStats {
  return {
    distanceKm: route.totalDistanceKm,
    timeMin: route.totalTimeMin,
    tollRM: route.totalTollRM,
    formattedTime: formatDuration(route.totalTimeMin),
    roadTypes,
    beta: getBeta(mode),
    mode,
  };
}
