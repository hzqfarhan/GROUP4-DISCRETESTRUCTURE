"use client";
import { useMemo } from "react";
import type { WeightedGraph } from "@/lib/graph/types";

interface MapCanvasProps {
  graph: WeightedGraph;
  path: string[] | null;
  originLabel?: string;
  destLabel?: string;
  showFullGraph?: boolean;
}

interface Point {
  x: number;
  y: number;
}

const W = 430;
const H = 720;

// Hand-tuned layout positions for the demo Sendayan route so the
// schematic illustration looks balanced in the About page.
const LAYOUT_POSITIONS: Record<string, Point> = {
  N1_UTHM: { x: 60, y: 120 },
  N2_AyerHitamTol: { x: 180, y: 180 },
  N3_YongPeng: { x: 110, y: 250 },
  N4_Segamat: { x: 180, y: 360 },
  N5_Gemas: { x: 220, y: 460 },
  N6_Tampin: { x: 290, y: 540 },
  N7_Rembau: { x: 320, y: 640 },
  N8_Seremban: { x: 350, y: 470 },
  N9_SerembanTol: { x: 360, y: 360 },
  N10_Masjid: { x: 360, y: 660 },
};

function fallbackPositions(graph: WeightedGraph): Record<string, Point> {
  const n = graph.junctions.length || 1;
  const out: Record<string, Point> = {};
  graph.junctions.forEach((j, i) => {
    out[j.id] = {
      x: 60 + ((i * 320) / Math.max(n - 1, 1)),
      y: 120 + ((i * 480) / Math.max(n - 1, 1)),
    };
  });
  return out;
}

const DECORATIVE_ROADS = [
  "M -20 80 C 100 120, 200 40, 460 100",
  "M -20 220 C 120 180, 280 280, 460 240",
  "M -20 360 C 80 420, 260 340, 460 400",
  "M -20 500 C 140 460, 320 540, 460 500",
  "M -20 640 C 100 700, 300 620, 460 680",
  "M 100 0 C 80 200, 200 380, 100 720",
  "M 240 0 C 280 180, 200 380, 280 720",
  "M 380 0 C 320 200, 380 400, 360 720",
];

const DECORATIVE_LABELS = [
  { x: 70, y: 60, text: "Embassy" },
  { x: 160, y: 80, text: "Mount Alto" },
  { x: 60, y: 200, text: "Kalidasa St" },
  { x: 240, y: 200, text: "Sheridan" },
  { x: 310, y: 220, text: "Heights" },
  { x: 50, y: 380, text: "Glover Park" },
  { x: 250, y: 420, text: "United States" },
  { x: 260, y: 440, text: "Capitol" },
  { x: 380, y: 420, text: "Observatory" },
  { x: 30, y: 580, text: "W St NW" },
];

export function MapCanvas({
  graph,
  path,
  originLabel = "Origin",
  destLabel = "Destination",
  showFullGraph = true,
}: MapCanvasProps) {
  const positions = useMemo(() => {
    if (graph.junctions.some((j) => LAYOUT_POSITIONS[j.id])) {
      return LAYOUT_POSITIONS;
    }
    return fallbackPositions(graph);
  }, [graph]);

  const pathSet = useMemo(() => new Set(path ?? []), [path]);
  const pathEdges = useMemo(() => {
    if (!path) return [] as Array<{ from: Point; to: Point; key: string }>;
    const out: Array<{ from: Point; to: Point; key: string }> = [];
    for (let i = 0; i < path.length - 1; i++) {
      const a = positions[path[i]!];
      const b = positions[path[i + 1]!];
      if (a && b) out.push({ from: a, to: b, key: `${path[i]}-${path[i + 1]}` });
    }
    return out;
  }, [path, positions]);

  const originId = path?.[0] ?? graph.junctions[0]?.id ?? null;
  const destId = path?.[path.length - 1] ?? graph.junctions.at(-1)?.id ?? null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-surface-map"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id="routeGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#237af9" />
            <stop offset="60%" stopColor="#e06e9c" />
            <stop offset="100%" stopColor="#df0059" />
          </linearGradient>
          <linearGradient id="mapAltGrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f5fafc" />
            <stop offset="100%" stopColor="#e9f2fe" />
          </linearGradient>
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="6"
              stdDeviation="8"
              floodColor="#CC0D5A"
              floodOpacity="0.18"
            />
          </filter>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="url(#mapAltGrad)" />

        {DECORATIVE_ROADS.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="#ffffff"
            strokeWidth={i % 3 === 0 ? 10 : 5}
            strokeOpacity={0.75}
            fill="none"
            strokeLinecap="round"
          />
        ))}

        {showFullGraph &&
          graph.edges.map((e) => {
            const a = positions[e.from];
            const b = positions[e.to];
            if (!a || !b) return null;
            return (
              <line
                key={`bg-${e.id}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#ffffff"
                strokeWidth={3}
                strokeOpacity={0.6}
                strokeLinecap="round"
              />
            );
          })}

        {showFullGraph &&
          graph.edges.map((e) => {
            const a = positions[e.from];
            const b = positions[e.to];
            if (!a || !b) return null;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const tollLabel = e.tollRM > 0 ? `RM ${e.tollRM.toFixed(2)}` : "free";
            return (
              <g key={`lbl-${e.id}`} transform={`translate(${mx}, ${my})`}>
                <rect
                  x={-22}
                  y={-8}
                  width={44}
                  height={14}
                  rx={7}
                  ry={7}
                  fill="#ffffff"
                  fillOpacity={0.85}
                  stroke={e.tollRM > 0 ? "#df0059" : "#9ca3af"}
                  strokeWidth={0.75}
                />
                <text
                  x={0}
                  y={3}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight={600}
                  fill={e.tollRM > 0 ? "#cc0d5a" : "#6e6b85"}
                  style={{ letterSpacing: 0.2 }}
                >
                  {tollLabel}
                </text>
              </g>
            );
          })}

        {pathEdges.map(({ from, to, key }) => (
          <line
            key={`route-${key}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="url(#routeGrad)"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#softShadow)"
          />
        ))}

        {DECORATIVE_LABELS.map((l) => (
          <text
            key={l.text}
            x={l.x}
            y={l.y}
            fontSize="10"
            fontWeight={500}
            fill="#9ca3af"
            style={{ letterSpacing: 0.3 }}
          >
            {l.text}
          </text>
        ))}

        {graph.junctions.map((j) => {
          const p = positions[j.id];
          if (!p) return null;
          const onPath = pathSet.has(j.id);
          const isOrigin = j.id === originId;
          const isDest = j.id === destId;

          if (isDest) {
            return (
              <g key={j.id} transform={`translate(${p.x}, ${p.y})`}>
                <circle
                  r={22}
                  fill="#df0059"
                  fillOpacity={0.18}
                  className="animate-ping-slow"
                />
                <circle r={12} fill="#df0059" fillOpacity={0.35} />
                <circle r={6} fill="#df0059" />
              </g>
            );
          }

          if (isOrigin && path) {
            return (
              <g key={j.id} transform={`translate(${p.x}, ${p.y})`}>
                <circle
                  r={9}
                  fill="#ffffff"
                  stroke="#df0059"
                  strokeWidth={3}
                  filter="url(#softShadow)"
                />
                <circle r={3} fill="#df0059" />
              </g>
            );
          }

          return (
            <g key={j.id} transform={`translate(${p.x}, ${p.y})`}>
              {onPath ? (
                <circle
                  r={7}
                  fill="#ffffff"
                  stroke="#df0059"
                  strokeWidth={3}
                  filter="url(#softShadow)"
                />
              ) : (
                <circle r={4} fill="#ffffff" stroke="#e06e9c" strokeWidth={1.5} />
              )}
              {showFullGraph && (
                <text
                  x={9}
                  y={3}
                  fontSize="9"
                  fontWeight={600}
                  fill={onPath ? "#cc0d5a" : "#6e6b85"}
                >
                  {j.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {path && (
        <div className="absolute bottom-2 right-2 rounded-full bg-white/70 px-2 py-1 text-[10px] font-medium text-ink-700 backdrop-blur">
          {originLabel} → {destLabel}
        </div>
      )}
    </div>
  );
}
