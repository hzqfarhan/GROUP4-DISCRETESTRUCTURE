"use client";
import { MapPinned, ChevronRight } from "lucide-react";
import type {
  RealRoadGeometry,
  Route,
  TripStats,
  WeightedGraph,
} from "@/lib/graph/types";
import { GlassCard } from "@/components/ui/GlassCard";

interface RecommendedRouteCardProps {
  route: Route;
  stats: TripStats;
  realRoad?: RealRoadGeometry | null;
  onOpenDetails?: () => void;
}

function edgeBetween(graph: WeightedGraph, from: string, to: string) {
  return graph.edges.find(
    (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
  );
}

function junctionName(graph: WeightedGraph, id: string): string {
  return graph.junctions.find((j) => j.id === id)?.name ?? id;
}

function roadTypeLabel(t: string): string {
  if (t === "highway") return "Highway";
  if (t === "federal") return "Federal";
  return "Local";
}

function formatMinutes(min: number): string {
  if (min <= 0) return "0 min";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function RecommendedRouteCard({
  route,
  stats,
  realRoad,
  onOpenDetails,
}: RecommendedRouteCardProps) {
  const beta = stats.beta;
  const modeLabel = stats.mode === "time" ? "Time-Optimized" : "Budget-Optimized";

  const displayDist = realRoad?.distanceKm ?? stats.distanceKm;
  const distLabel = realRoad ? "real road" : "graph";
  const displayTime = realRoad
    ? formatMinutes(realRoad.durationMin)
    : stats.formattedTime;
  const stops = route.path.length;
  const segments = route.edgeIds.length;

  return (
    <GlassCard className="p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              Time
            </div>
            <div className="text-lg font-bold tabular-nums text-ink-900 leading-tight">
              {displayTime}
            </div>
          </div>
          <div className="h-8 w-px bg-ink-300/40" />
          <div>
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              Dist
              {realRoad && <MapPinned className="h-2.5 w-2.5 text-primary-500" />}
            </div>
            <div className="text-lg font-bold tabular-nums text-ink-900 leading-tight">
              {displayDist.toFixed(1)}{" "}
              <span className="text-xs font-semibold text-ink-500">km</span>
            </div>
          </div>
          <div className="h-8 w-px bg-ink-300/40" />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              Toll
            </div>
            <div className="text-lg font-bold tabular-nums text-ink-900 leading-tight">
              {stats.tollRM.toFixed(0)}
              <span className="text-xs font-semibold text-ink-500">.00</span>
            </div>
          </div>
        </div>
        {onOpenDetails && (
          <button
            type="button"
            onClick={onOpenDetails}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-600 active:scale-95"
            aria-label="Open route details"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-ink-500">
        <span>
          {stops} stops · {segments} segments · {distLabel}
        </span>
        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-600 normal-case tracking-normal">
          β = {beta} · {modeLabel}
        </span>
      </div>
    </GlassCard>
  );
}

export { edgeBetween, junctionName, roadTypeLabel, formatMinutes };
