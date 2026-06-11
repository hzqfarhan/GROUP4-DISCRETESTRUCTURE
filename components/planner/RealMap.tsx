"use client";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { WeightedGraph } from "@/lib/graph/types";
import { fetchOsrmRoute, type OsrmRoute } from "@/lib/routing/osrm";
import { getBeta } from "@/lib/graph/weight";
import type { OptimizationMode } from "@/lib/graph/types";

export type MapLayer = "streets" | "satellite" | "topo" | "light";

export interface UserLocation {
  lat: number;
  lng: number;
  label?: string;
}

export interface RealMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  recenter: () => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

interface RealMapProps {
  graph: WeightedGraph;
  selectedPath: string[] | null;
  alternativePaths: { path: string[]; rank: number }[];
  originLabel?: string;
  destinationLabel?: string;
  maptilerKey?: string;
  layer?: MapLayer;
  pinkFilter?: boolean;
  userLocation?: UserLocation | null;
  onMapClick?: (loc: { lat: number; lng: number }) => void;
  onLocateRequest?: () => void;
  mode?: OptimizationMode;
  // Optional OSRM geometry for the currently selected route. When
  // present it is used to fit the map (more accurate than junction
  // coords, which are sparse waypoints).
  selectedRouteGeometry?: { lat: number; lng: number }[] | null;
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
const userIcon = L.divIcon({
  className: "iep-marker iep-marker-user",
  html: `<div class="pulse"></div><div class="dot"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function FitBounds({ coords, pathKey }: { coords: { lat: number; lng: number }[]; pathKey?: string }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.flyTo([coords[0]!.lat, coords[0]!.lng], 13, { duration: 0.6 });
      return;
    }
    const bounds = L.latLngBounds(
      coords.map((c) => [c.lat, c.lng] as [number, number]),
    );
    // flyToBounds is smoother and respects a sensible max zoom for
    // long routes (no infinite zoom-in to a single point).
    map.flyToBounds(bounds, {
      padding: [80, 80],
      duration: 0.6,
      maxZoom: 13,
    });
    // pathKey forces a re-fit whenever the selected path identity
    // changes (new route selected), even if the same map instance is
    // being reused.
  }, [coords, map, pathKey]);
  return null;
}

interface MapControllerProps {
  onReady: (api: RealMapHandle) => void;
}
function MapController({ onReady }: MapControllerProps) {
  const map = useMap();
  useEffect(() => {
    onReady({
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
      recenter: () => {
        // Recenter to Peninsular Malaysia overview.
        map.flyTo([2.6, 102.3], 7, { duration: 0.6 });
      },
      flyTo: (lat: number, lng: number, zoom: number = 15) => {
        map.flyTo([lat, lng], zoom, { duration: 0.8 });
      },
    });
  }, [map, onReady]);
  return null;
}

function ClickCatcher({
  onClick,
}: {
  onClick: (loc: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function UserMarker({ loc }: { loc: UserLocation | null }) {
  const map = useMap();
  useEffect(() => {
    if (loc) {
      map.panTo([loc.lat, loc.lng], { animate: true, duration: 0.5 });
    }
  }, [loc, map]);
  if (!loc) return null;
  return (
    <Marker
      position={[loc.lat, loc.lng]}
      icon={userIcon}
      zIndexOffset={1000}
    >
      <Popup>
        <div style={{ fontWeight: 600 }}>Your location</div>
        {loc.label && (
          <div style={{ fontSize: 11, color: "#6e6b85" }}>{loc.label}</div>
        )}
        <div style={{ fontSize: 10, color: "#9ca3af" }}>
          {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
        </div>
      </Popup>
    </Marker>
  );
}

function pathToCoords(graph: WeightedGraph, path: string[] | null) {
  if (!path) return [];
  return path
    .map((id) => junctionAt(graph, id))
    .filter((j): j is NonNullable<typeof j> => Boolean(j && j.lat && j.lng))
    .map((j) => ({ lat: j.lat as number, lng: j.lng as number }));
}

function straightSegments(
  graph: WeightedGraph,
  path: string[],
): [number, number][] {
  // Use a per-edge mid-point so that kinked routes (e.g. Tampin → Seremban →
  // Seremban Tol) bend correctly without the OSRM snap artifacts. Mid-point
  // offset is small (1% of segment length) to stay visually identical to
  // straight lines.
  const out: [number, number][] = [];
  for (let i = 0; i < path.length; i++) {
    const a = junctionAt(graph, path[i]!);
    if (!a?.lat || !a?.lng) continue;
    out.push([a.lat, a.lng]);
  }
  return out;
}

function useOsrmForSelected(
  coords: { lat: number; lng: number }[],
): [number, number][] | null {
  const [geometry, setGeometry] = useState<[number, number][] | null>(null);
  const cacheRef = useRef<Map<string, [number, number][]>>(new Map());
  useEffect(() => {
    if (coords.length >= 2) {
      const key = coords
        .map((c) => `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`)
        .join("|");
      const cached = cacheRef.current.get(key);
      if (cached) {
        setGeometry(cached);
        return;
      }
      let cancelled = false;
      fetchOsrmRoute(coords).then((r: OsrmRoute | null) => {
        if (cancelled || !r) return;
        const geo = r.geometry.map(
          (c) => [c.lat, c.lng] as [number, number],
        );
        cacheRef.current.set(key, geo);
        setGeometry(geo);
      });
      return () => {
        cancelled = true;
      };
    }
  }, [coords]);
  return geometry;
}

function AlternativePolyline({
  graph,
  path,
}: {
  graph: WeightedGraph;
  path: string[];
}) {
  const points = useMemo(
    () => straightSegments(graph, path),
    [graph, path],
  );
  if (points.length < 2) return null;
  return (
    <>
      <Polyline
        positions={points}
        pathOptions={{
          color: "#9ca3af",
          weight: 5,
          opacity: 0.55,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      <Polyline
        positions={points}
        pathOptions={{
          color: "#ffffff",
          weight: 1.5,
          opacity: 0.85,
          dashArray: "5 6",
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
  const osrmGeo = useOsrmForSelected(coords);
  const points = useMemo(() => {
    if (osrmGeo && osrmGeo.length >= 2) return osrmGeo;
    return straightSegments(graph, path);
  }, [osrmGeo, graph, path]);
  if (points.length < 2) return null;
  return (
    <>
      <Polyline
        positions={points}
        pathOptions={{
          color: "#df0059",
          weight: 7,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      <Polyline
        positions={points}
        pathOptions={{
          color: "#237af9",
          weight: 3,
          opacity: 0.85,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
    </>
  );
}

function weightPillIcon(
  timeMin: number,
  tollRM: number,
  penaltyMin: number,
  w: number,
): L.DivIcon {
  const html = `
    <div class="iep-weight-pill">
      <div class="row w"><span class="lbl">W</span><span class="val">${w.toFixed(1)}</span></div>
      <div class="row t"><span class="lbl">⏱</span><span class="val">${timeMin.toFixed(1)}m</span></div>
      <div class="row tl"><span class="lbl">$</span><span class="val">${tollRM.toFixed(2)}</span></div>
      <div class="row p"><span class="lbl">⚠</span><span class="val">${penaltyMin.toFixed(1)}m</span></div>
    </div>`;
  return L.divIcon({
    className: "iep-weight-pill-wrap",
    html,
    iconSize: [82, 56],
    iconAnchor: [41, 28],
  });
}

function WeightPills({
  graph,
  path,
  mode,
}: {
  graph: WeightedGraph;
  path: string[];
  mode?: OptimizationMode;
}) {
  const beta = getBeta(mode ?? "time");
  const segments: { mid: [number, number]; html: L.DivIcon }[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = junctionAt(graph, path[i]!);
    const b = junctionAt(graph, path[i + 1]!);
    if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) continue;
    const edge = graph.edges.find(
      (e) =>
        (e.from === a.id && e.to === b.id) ||
        (e.from === b.id && e.to === a.id),
    );
    if (!edge) continue;
    const w =
      edge.timeMin + edge.tollRM * beta + edge.penaltyMin;
    segments.push({
      mid: [(a.lat + b.lat) / 2, (a.lng + b.lng) / 2],
      html: weightPillIcon(edge.timeMin, edge.tollRM, edge.penaltyMin, w),
    });
  }
  if (segments.length === 0) return null;
  return (
    <>
      {segments.map((s, i) => (
        <Marker
          key={`wp-${i}`}
          position={s.mid}
          icon={s.html}
          interactive={false}
          keyboard={false}
          zIndexOffset={500}
        />
      ))}
    </>
  );
}

export const RealMap = forwardRef<RealMapHandle, RealMapProps>(function RealMap(
  {
    graph,
    selectedPath,
    alternativePaths,
    originLabel = "Origin",
    destinationLabel = "Destination",
    maptilerKey,
    layer = "streets",
    pinkFilter = false,
    userLocation = null,
    onMapClick,
    mode,
    selectedRouteGeometry = null,
  },
  ref,
) {
  const [controllerApi, setControllerApi] = useState<RealMapHandle | null>(
    null,
  );
  useImperativeHandle(
    ref,
    (): RealMapHandle => ({
      zoomIn: () => controllerApi?.zoomIn(),
      zoomOut: () => controllerApi?.zoomOut(),
      recenter: () => controllerApi?.recenter(),
      flyTo: (lat: number, lng: number, zoom: number = 15) =>
        controllerApi?.flyTo(lat, lng, zoom),
    }),
    [controllerApi],
  );

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

  const initialCenter =
    selectedCoords[0] ?? allJunctionCoords[0] ?? { lat: 2.2, lng: 102.5 };

  const allVisibleCoords = useMemo(() => {
    // Prefer the OSRM real-road geometry for the fit (it traces the
    // actual road instead of straight line segments between junctions).
    if (selectedRouteGeometry && selectedRouteGeometry.length >= 2) {
      return selectedRouteGeometry;
    }
    if (selectedCoords.length > 0) return selectedCoords;
    return allJunctionCoords;
  }, [selectedCoords, allJunctionCoords, selectedRouteGeometry]);

  const selectedPathKey = useMemo(
    () => (selectedPath ? selectedPath.join(">") : null),
    [selectedPath],
  );

  const originId = selectedPath?.[0];
  const destId = selectedPath?.[selectedPath.length - 1];

  return (
    <div className="absolute inset-0 z-0">
      <div
        className="absolute inset-0 z-[500] pointer-events-none transition-opacity duration-300"
        style={{
          opacity: pinkFilter ? 1 : 0,
          background:
            "linear-gradient(180deg, rgba(255, 220, 235, 0.35) 0%, rgba(255, 192, 220, 0.25) 100%)",
          mixBlendMode: "multiply",
        }}
        aria-hidden
      />
      <MapContainer
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={9}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
        style={{ background: "#f5fafc" }}
      >
        {(() => {
          const mt = maptilerKey;
          if (layer === "satellite" && mt) {
            return (
              <TileLayer
                attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={`https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${mt}`}
                maxZoom={20}
              />
            );
          }
          if (layer === "topo" && mt) {
            return (
              <TileLayer
                attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={`https://api.maptiler.com/maps/topographique/{z}/{x}/{y}.png?key=${mt}`}
                maxZoom={20}
              />
            );
          }
          if (layer === "light" && mt) {
            return (
              <TileLayer
                attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={`https://api.maptiler.com/maps/light/{z}/{x}/{y}.png?key=${mt}`}
                maxZoom={20}
              />
            );
          }
          // Default: streets
          if (mt) {
            return (
              <TileLayer
                attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${mt}`}
                maxZoom={20}
              />
            );
          }
          return (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          );
        })()}

        {onMapClick && <ClickCatcher onClick={onMapClick} />}
        <UserMarker loc={userLocation} />

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

        {selectedPath && (
          <WeightPills graph={graph} path={selectedPath} mode={mode} />
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

        <FitBounds coords={allVisibleCoords} pathKey={selectedPathKey ?? undefined} />
        <MapController onReady={setControllerApi} />
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
          border: 3px solid #df0059;
          box-shadow: 0 4px 12px rgba(204, 13, 90, 0.35);
        }
        .iep-marker-origin .dot {
          background: #ffffff;
          border-color: #df0059;
        }
        .iep-marker-mid .dot {
          width: 10px;
          height: 10px;
          background: #ffffff;
          border: 2px solid #e06e9c;
          box-shadow: 0 2px 6px rgba(204, 13, 90, 0.3);
        }
        .iep-marker-alt .dot {
          width: 8px;
          height: 8px;
          background: #ffffff;
          border: 1.5px solid #9ca3af;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
        }
        .iep-marker-user {
          position: relative;
        }
        .iep-marker-user .dot {
          position: absolute;
          inset: 0;
          margin: auto;
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: #237af9;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(35, 122, 249, 0.45);
        }
        .iep-marker-user .pulse {
          position: absolute;
          inset: 0;
          margin: auto;
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: #237af9;
          opacity: 0.25;
          animation: ping-slow 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
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
          background: #df0059;
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
          background: #df0059;
          opacity: 0.35;
        }
        .iep-marker-dest .core {
          position: absolute;
          inset: 0;
          margin: auto;
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #df0059;
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
        .iep-weight-pill-wrap {
          background: transparent !important;
          border: 0 !important;
          pointer-events: none;
        }
        .iep-weight-pill {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 78px;
          padding: 4px 6px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(223, 0, 89, 0.25);
          box-shadow: 0 4px 12px rgba(82, 63, 160, 0.22);
          font-family: var(--font-sans, system-ui);
          color: #221f20;
          backdrop-filter: blur(6px);
          transform: translate(-50%, -50%);
        }
        .iep-weight-pill .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          font-size: 9px;
          line-height: 1.1;
        }
        .iep-weight-pill .row .lbl {
          color: #6b7280;
          font-weight: 600;
        }
        .iep-weight-pill .row .val {
          color: #221f20;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }
        .iep-weight-pill .row.w {
          border-bottom: 1px solid rgba(223, 0, 89, 0.18);
          padding-bottom: 2px;
          margin-bottom: 1px;
        }
        .iep-weight-pill .row.w .lbl {
          color: #df0059;
          font-size: 10px;
        }
        .iep-weight-pill .row.w .val {
          color: #df0059;
          font-size: 11px;
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
});
RealMap.displayName = "RealMap";
