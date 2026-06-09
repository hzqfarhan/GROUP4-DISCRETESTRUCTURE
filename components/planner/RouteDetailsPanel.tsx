"use client";
import { Clock, Route as RouteIcon, Coins, MapPinned } from "lucide-react";
import type {
  RealRoadGeometry,
  Route,
  TripStats,
  WeightedGraph,
} from "@/lib/graph/types";
import { GlassCard } from "@/components/ui/GlassCard";

interface RouteDetailsPanelProps {
  route: Route;
  graph: WeightedGraph;
  stats: TripStats;
  realRoad: RealRoadGeometry | null;
}

function edgeBetween(graph: WeightedGraph, from: string, to: string) {
  return graph.edges.find(
    (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
  );
}

function junctionName(graph: WeightedGraph, id: string): string {
  return graph.junctions.find((j) => j.id === id)?.name ?? id;
}

function fmtMin(min: number): string {
  if (min <= 0) return "0m";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtMeters(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function maneuverIcon(type: string): string {
  // Returns a short unicode glyph to indicate the maneuver visually.
  if (type === "arrive") return "◎";
  if (type === "depart") return "▶";
  if (type === "merge") return "⤴";
  if (type === "fork") return "⑂";
  if (type === "roundabout" || type === "rotary") return "↻";
  if (type === "turn") return "↱";
  if (type === "new name" || type === "continue" || type === "notification")
    return "↑";
  return "•";
}

export function RouteDetailsPanel({
  route,
  graph,
  stats,
  realRoad,
}: RouteDetailsPanelProps) {
  const beta = stats.beta;
  const modeLabel = stats.mode === "time" ? "Time-Optimized" : "Budget-Optimized · Calculation";
  const dist = realRoad?.distanceKm ?? stats.distanceKm;
  const time = realRoad ? fmtMin(realRoad.durationMin) : stats.formattedTime;
  const maneuvers = (realRoad?.maneuvers ?? []).filter(
    (m) => m.type !== "arrive" || (realRoad?.maneuvers ?? []).indexOf(m) === (realRoad?.maneuvers ?? []).length - 1,
  );

  return (
    <div className="space-y-3">
      {/* Summary bento */}
      <GlassCard className="p-3">
        <div className="grid grid-cols-3 gap-2 tabular-nums">
          <Stat
            icon={<Clock className="h-3 w-3" />}
            label="Time"
            value={time}
            sub="real drive"
          />
          <Stat
            icon={<MapPinned className="h-3 w-3" />}
            label="Distance"
            value={`${dist.toFixed(1)} km`}
            sub={realRoad ? "real road" : "graph"}
          />
          <Stat
            icon={<Coins className="h-3 w-3" />}
            label="Toll"
            value={`RM ${stats.tollRM.toFixed(2)}`}
            sub={stats.tollRM === 0 ? "free" : "cash / TnG"}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-ink-500">
          <span>
            {route.path.length} stops · {route.edgeIds.length} segments
          </span>
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-600">
            β = {beta} · {modeLabel}
          </span>
        </div>
      </GlassCard>

      {/* Turn-by-turn directions */}
      <GlassCard className="p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-500">
          <span className="flex items-center gap-1">
            <RouteIcon className="h-3 w-3" />
            Turn-by-turn directions
          </span>
          <span className="text-ink-300 normal-case tracking-normal">
            {maneuvers.length} steps
          </span>
        </div>
        {maneuvers.length > 0 ? (
          <ol className="space-y-1">
            {maneuvers.map((m, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg p-1.5 hover:bg-primary-50/40"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[10px] font-bold text-primary-600">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5 text-[11px] font-semibold text-ink-900">
                    <span className="text-primary-500">
                      {maneuverIcon(m.type)}
                    </span>
                    <span className="truncate">{m.instruction}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[9px] text-ink-500 tabular-nums">
                    <span>{fmtMeters(m.distanceMeters)}</span>
                    <span className="text-ink-300">·</span>
                    <span>{fmtMin(Math.round(m.durationSeconds / 60))}</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="rounded-lg border border-dashed border-ink-300/20 p-2 text-[10px] text-ink-500">
            Step-by-step directions aren&rsquo;t available for this route
            yet — the OSRM public server may be rate-limited. The graph
            timeline below still shows every junction.
          </div>
        )}
      </GlassCard>

      {/* Graph-level timeline (junctions + edges) */}
      <GlassCard className="p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
          Graph timeline
        </div>
        <ol className="space-y-1.5">
          {route.path.map((nodeId, i) => {
            const next = route.path[i + 1];
            const e = next ? edgeBetween(graph, nodeId, next) : null;
            return (
              <li key={`${nodeId}-${i}`} className="flex gap-2.5">
                <div className="flex flex-col items-center pt-0.5">
                  <span
                    className={
                      "h-2.5 w-2.5 rounded-full " +
                      (i === 0 || i === route.path.length - 1
                        ? "bg-primary-500"
                        : "bg-primary-400")
                    }
                  />
                  {i < route.path.length - 1 && (
                    <span className="my-0.5 w-px flex-1 bg-primary-200" />
                  )}
                </div>
                <div className="flex-1 pb-1.5">
                  <div className="text-[11px] font-semibold text-ink-900">
                    {junctionName(graph, nodeId)}
                  </div>
                  {e && (
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[9px] text-ink-500 tabular-nums">
                      <span>{e.timeMin + e.penaltyMin}m</span>
                      <span className="text-ink-300">·</span>
                      <span>{e.distanceKm}km</span>
                      <span className="text-ink-300">·</span>
                      <span>{e.roadType}</span>
                      {e.tollRM > 0 && (
                        <>
                          <span className="text-ink-300">·</span>
                          <span>RM {e.tollRM.toFixed(2)}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </GlassCard>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider text-ink-500">
        {icon}
        {label}
      </div>
      <div className="text-sm font-bold text-ink-900 tabular-nums">
        {value}
      </div>
      {sub && <div className="text-[9px] text-ink-300">{sub}</div>}
    </div>
  );
}
