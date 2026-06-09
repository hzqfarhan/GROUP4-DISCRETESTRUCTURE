// OSRM public demo server — returns real road-following polylines for a
// sequence of coordinates. Used only for *displaying* the chosen route
// (the math is still our local Dijkstra).
// Docs: http://projectosrm.org/docs/v5.24.0/api/#route-service

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

export interface OsrmManeuver {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  name: string; // road name (empty if unnamed)
  type: string; // turn, depart, arrive, merge, ...
  modifier?: string; // left, right, straight, ...
  location: { lat: number; lng: number };
}

export interface OsrmRoute {
  distanceMeters: number;
  durationSeconds: number;
  geometry: { lat: number; lng: number }[];
  maneuvers: OsrmManeuver[];
}

export async function fetchOsrmRoute(
  coords: { lat: number; lng: number }[],
): Promise<OsrmRoute | null> {
  if (coords.length < 2) return null;
  const path = coords
    .map((c) => `${c.lng.toFixed(6)},${c.lat.toFixed(6)}`)
    .join(";");
  const url = `${OSRM_BASE}/${path}?overview=full&geometries=geojson&steps=true&annotations=false`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      code?: string;
      routes?: Array<{
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
        legs?: Array<{
          steps?: Array<{
            maneuver?: {
              type?: string;
              modifier?: string;
              location?: [number, number];
            };
            name?: string;
            distance?: number;
            duration?: number            ;
            mode?: string;
          }>;
        }>;
      }>;
    };
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const r = data.routes[0];
    const maneuvers: OsrmManeuver[] = [];
    for (const leg of r.legs ?? []) {
      for (const step of leg.steps ?? []) {
        const m = step.maneuver;
        if (!m || !m.location) continue;
        const loc = m.location;
        maneuvers.push({
          instruction: humanizeManeuver(
            m.type ?? "continue",
            m.modifier,
            step.name ?? "",
            step.mode,
          ),
          distanceMeters: step.distance ?? 0,
          durationSeconds: step.duration ?? 0,
          name: step.name ?? "",
          type: m.type ?? "continue",
          modifier: m.modifier,
          location: { lat: loc[1], lng: loc[0] },
        });
      }
    }
    return {
      distanceMeters: r.distance,
      durationSeconds: r.duration,
      geometry: r.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      maneuvers,
    };
  } catch {
    return null;
  }
}

function humanizeManeuver(
  type: string,
  modifier: string | undefined,
  roadName: string,
  mode?: string,
): string {
  const road = roadName ? ` onto ${roadName}` : "";
  const m = modifier ?? "";
  switch (type) {
    case "turn":
      return `Turn ${m}${road}`.trim();
    case "new name":
      return `Continue${road}`.trim();
    case "depart":
      return `Depart${road}`.trim();
    case "arrive":
      return mode === "BICYCLE" ? "Arrive at destination" : "Arrive at destination";
    case "merge":
      return `Merge ${m}${road}`.trim();
    case "on ramp":
      return `Take the ramp ${m}${road}`.trim();
    case "off ramp":
      return `Take the exit ${m}${road}`.trim();
    case "fork":
      return `Keep ${m} at the fork${road}`.trim();
    case "merge":
      return `Merge ${m}${road}`.trim();
    case "roundabout":
    case "rotary":
      return `Take the roundabout${road}`.trim();
    case "continue":
      return `Continue straight${road}`.trim();
    case "notification":
      return `Continue${road}`.trim();
    case "lane":
    default:
      return `${type[0]!.toUpperCase()}${type.slice(1)}${road}`.trim();
  }
}
