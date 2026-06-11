// Photon geocoding API — free, OpenStreetMap-based, no API key required.
// Docs: https://photon.komoot.io/
const PHOTON_BASE = "https://photon.komoot.io/api";

export interface PhotonPlace {
  name: string;
  city?: string;
  state?: string;
  country?: string;
  lat: number;
  lng: number;
  type?: string;
  osmId?: number;
  osmType?: string;
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    type?: string;
    osm_id?: number;
    osm_type?: string;
  };
}

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PhotonPlace[]> {
  if (!query || query.trim().length < 2) return [];
  const url = `${PHOTON_BASE}/?q=${encodeURIComponent(query.trim())}&limit=6`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = (await res.json()) as { features?: PhotonFeature[] };
    return (data.features ?? [])
      .map((f): PhotonPlace | null => {
        if (!f.properties?.name || !f.geometry?.coordinates) return null;
        const [lng, lat] = f.geometry.coordinates;
        return {
          name: f.properties.name,
          city: f.properties.city,
          state: f.properties.state,
          country: f.properties.country,
          lat,
          lng,
          type: f.properties.type,
          osmId: f.properties.osm_id,
          osmType: f.properties.osm_type,
        };
      })
      .filter((p): p is PhotonPlace => p !== null);
  } catch {
    return [];
  }
}

export function formatPlaceLabel(p: PhotonPlace): string {
  const parts = [p.name];
  if (p.city) parts.push(p.city);
  if (p.state && p.state !== p.city) parts.push(p.state);
  return parts.join(", ");
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<PhotonPlace | null> {
  const url = `${PHOTON_BASE}/reverse?lon=${lng}&lat=${lat}&limit=1`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: PhotonFeature[] };
    const f = data.features?.[0];
    if (!f?.properties?.name || !f.geometry?.coordinates) return null;
    const [flng, flat] = f.geometry.coordinates;
    return {
      name: f.properties.name,
      city: f.properties.city,
      state: f.properties.state,
      country: f.properties.country,
      lat: flat,
      lng: flng,
      type: f.properties.type,
      osmId: f.properties.osm_id,
      osmType: f.properties.osm_type,
    };
  } catch {
    return null;
  }
}
