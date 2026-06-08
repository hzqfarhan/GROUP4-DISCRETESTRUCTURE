// OSRM public demo server — returns real road-following polylines for a
// sequence of coordinates. Used only for *displaying* the chosen route
// (the math is still our local Dijkstra).
// Docs: http://project-osrm.org/docs/v5.24.0/api/#route-service

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

export interface OsrmRoute {
  distanceMeters: number;
  durationSeconds: number;
  geometry: { lat: number; lng: number }[];
}

export async function fetchOsrmRoute(
  coords: { lat: number; lng: number }[],
): Promise<OsrmRoute | null> {
  if (coords.length < 2) return null;
  const path = coords
    .map((c) => `${c.lng.toFixed(6)},${c.lat.toFixed(6)}`)
    .join(";");
  const url = `${OSRM_BASE}/${path}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      code?: string;
      routes?: Array<{
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
      }>;
    };
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const r = data.routes[0];
    return {
      distanceMeters: r.distance,
      durationSeconds: r.duration,
      geometry: r.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    };
  } catch {
    return null;
  }
}
