"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { WeightedGraph } from "@/lib/graph/types";
import { fetchOsrmRoute, type OsrmRoute } from "@/lib/routing/osrm";

interface RealMapProps {
  graph: WeightedGraph;
  selectedPath: string[] | null;
  alternativePaths: { path: string[]; rank: number }[];
  originLabel?: string;
  destinationLabel?: string;
  maptilerKey?: string;
}

function junctionAt(graph: WeightedGraph, id: string) {
  return graph.junctions.find((j) => j.id === id);
}

const originIcon = L.divIcon({
  className: "iep-marker iep-marker-origin",
  html: `<div class="dot"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});
const destIcon = L.divIcon({
  className: "iep-marker iep-marker-dest",
  html: `<div class="ping"></div><div class="mid"></div><div class="core"></div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});
const midIcon = L.divIcon({
  className: "iep-marker iep-marker-mid",
  html: `<div class="dot"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});
const altMidIcon = L.divIcon({
  className: "iep-marker iep-marker-alt",
  html: `<div class="dot"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

function FitBounds({ coords }: { coords: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.setView([coords[0]!.lat, coords[0]!.lng], 13);
      return;
    }
    const bounds = L.latLngBounds(
      coords.map((c) => [c.lat, c.lng] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [coords, map]);
  return null;
}

function decodeCacheKey(path: { lat: number; lng: number }[]) {
  return path.map((c) => `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`).join("|");
}

function useOsrmGeometry(
  pathCoords: { lat: number; lng: number }[],
): { geometry: [number, number][] | null; failed: boolean } {
  const [geometry, setGeometry] = useState<[number, number][] | null>(null);
  const [failed, setFailed] = useState(false);
  const cacheRef = useRef<Map<string, [number, number][] | "FAILED">>(
    new Map(),
  );

  useEffect(() => {
    if (pathCoords.length >= 2) {
      const key = decodeCacheKey(pathCoords);
      const cached = cacheRef.current.get(key);
      if (cached && cached !== "FAILED") {
        setGeometry(cached);
        setFailed(false);
        return;
      }
      if (cached === "FAILED") {
        setGeometry(null);
        setFailed(true);
        return;
      }
      let cancelled = false;
      fetchOsrmRoute(pathCoords).then((r: OsrmRoute | null) => {
        if (cancelled) return;
        if (r) {
          const geo = r.geometry.map(
            (c) => [c.lat, c.lng] as [number, number],
          );
          cacheRef.current.set(key, geo);
          setGeometry(geo);
          setFailed(false);
        } else {
          cacheRef.current.set(key, "FAILED");
          setGeometry(null);
          setFailed(true);
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [pathCoords]);

  return { geometry, failed };
}

function pathToCoords(graph: WeightedGraph, path: string[] | null) {
  if (!path) return [];
  return path
    .map((id) => junctionAt(graph, id))
    .filter((j): j is NonNullable<typeof j> => Boolean(j && j.lat && j.lng))
    .map((j) => ({ lat: j.lat as number, lng: j.lng as number }));
}

function AlternativePolyline({
  graph,
  path,
}: {
  graph: WeightedGraph;
  path: string[];
}) {
  const coords = useMemo(() => pathToCoords(graph, path), [graph, path]);
  const { geometry } = useOsrmGeometry(coords);
  const points = geometry ?? coords.map((c) => [c.lat, c.lng] as [number, number]);
  if (points.length < 2) return null;
  return (
    <>
      <Polyline
        positions={points}
        pathOptions={{
          color: "#9ca3af",
          weight: 6,
          opacity: 0.35,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      <Polyline
        positions={points}
        pathOptions={{
          color: "#ffffff",
          weight: 2,
          opacity: 0.55,
          dashArray: "6 8",
          lineCap: "round",
        }}
      />
    </>
  );
}

function SelectedPolyline({
  graph,
  path,
}: {
  graph: WeightedGraph;
  path: string[];
}) {
  const coords = useMemo(() => pathToCoords(graph, path), [graph, path]);
  const { geometry } = useOsrmGeometry(coords);
  const points = geometry ?? coords.map((c) => [c.lat, c.lng] as [number, number]);
  if (points.length < 2) return null;
  return (
    <>
      <Polyline
        positions={points}
        pathOptions={{
          color: "#6b3cff",
          weight: 7,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      <Polyline
        positions={points}
        pathOptions={{
          color: "#5ab8ff",
          weight: 3,
          opacity: 0.85,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
    </>
  );
}

export function RealMap({
  graph,
  selectedPath,
  alternativePaths,
  originLabel = "Origin",
  destinationLabel = "Destination",
  maptilerKey,
}: RealMapProps) {
  const selectedCoords = useMemo(
    () => pathToCoords(graph, selectedPath),
    [graph, selectedPath],
  );
  const allJunctionCoords = useMemo(
    () =>
      graph.junctions
        .filter((j) => j.lat != null && j.lng != null)
        .map((j) => ({ lat: j.lat as number, lng: j.lng as number })),
    [graph],
  );
  const selectedSet = useMemo(
    () => new Set(selectedPath ?? []),
    [selectedPath],
  );

  const initialCenter = selectedCoords[0] ??
    allJunctionCoords[0] ?? { lat: 2.2, lng: 102.5 };

  const allVisibleCoords = useMemo(() => {
    if (selectedCoords.length > 0) return selectedCoords;
    return allJunctionCoords;
  }, [selectedCoords, allJunctionCoords]);

  const originId = selectedPath?.[0];
  const destId = selectedPath?.[selectedPath.length - 1];

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={9}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
        style={{ background: "#e9ecf5" }}
      >
        {maptilerKey ? (
          <TileLayer
            attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${maptilerKey}`}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        {/* Alternative (greyed) routes first so selected sits on top */}
        {alternativePaths.map(({ path, rank }) => (
          <AlternativePolyline
            key={`alt-${rank}-${path.join(">")}`}
            graph={graph}
            path={path}
          />
        ))}

        {selectedPath && (
          <SelectedPolyline graph={graph} path={selectedPath} />
        )}

        {graph.junctions.map((j) => {
          if (j.lat == null || j.lng == null) return null;
          const isOrigin = j.id === originId && selectedPath;
          const isDest = j.id === destId && selectedPath;
          const onSelected = selectedSet.has(j.id);
          return (
            <Marker
              key={j.id}
              position={[j.lat, j.lng]}
              icon={
                isDest
                  ? destIcon
                  : isOrigin
                    ? originIcon
                    : onSelected
                      ? midIcon
                      : altMidIcon
              }
            >
              <Popup>
                <div style={{ fontWeight: 600 }}>{j.name}</div>
              </Popup>
            </Marker>
          );
        })}

        <FitBounds coords={allVisibleCoords} />
      </MapContainer>

      <style jsx global>{`
        .iep-marker {
          background: transparent;
          border: 0;
        }
        .iep-marker .dot {
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: #ffffff;
          border: 3px solid #6b3cff;
          box-shadow: 0 4px 12px rgba(82, 63, 160, 0.35);
        }
        .iep-marker-origin .dot {
          background: #ffffff;
          border-color: #6b3cff;
        }
        .iep-marker-mid .dot {
          width: 10px;
          height: 10px;
          background: #ffffff;
          border: 2px solid #8e66ff;
          box-shadow: 0 2px 6px rgba(82, 63, 160, 0.3);
        }
        .iep-marker-alt .dot {
          width: 8px;
          height: 8px;
          background: #ffffff;
          border: 1.5px solid #9ca3af;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
        }
        .iep-marker-dest {
          position: relative;
        }
        .iep-marker-dest .ping {
          position: absolute;
          inset: 0;
          margin: auto;
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: #6b3cff;
          opacity: 0.18;
          animation: ping-slow 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .iep-marker-dest .mid {
          position: absolute;
          inset: 0;
          margin: auto;
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: #6b3cff;
          opacity: 0.35;
        }
        .iep-marker-dest .core {
          position: absolute;
          inset: 0;
          margin: auto;
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #6b3cff;
          box-shadow: 0 0 0 2px #ffffff;
        }
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-control-attribution {
          font-size: 9px !important;
          background: rgba(255, 255, 255, 0.7) !important;
          backdrop-filter: blur(6px);
        }
      `}</style>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[400] flex flex-col gap-1.5">
        {selectedPath && (
          <div className="rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-medium text-ink-700 shadow-sm backdrop-blur">
            {originLabel} → {destinationLabel}
          </div>
        )}
        {alternativePaths.length > 0 && (
          <div className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-medium text-ink-500 shadow-sm backdrop-blur">
            <span className="mr-2 inline-block">
              <span className="mr-1 inline-block h-2 w-3 rounded-sm bg-primary-500 align-middle" />
              selected
            </span>
            <span className="inline-block">
              <span
                className="mr-1 inline-block h-2 w-3 rounded-sm align-middle"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, #9ca3af 0 4px, transparent 4px 8px)",
                }}
              />
              {alternativePaths.length} alternative
              {alternativePaths.length === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
