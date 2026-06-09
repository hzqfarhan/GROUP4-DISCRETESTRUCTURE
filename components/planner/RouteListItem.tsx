"use client";
import { MapPinned } from "lucide-react";
import type { RealRoadGeometry, Route, WeightedGraph } from "@/lib/graph/types";

interface RouteListItemProps {
  rank: number;
  route: Route;
  graph: WeightedGraph;
  realRoad: RealRoadGeometry | null;
  isSelected: boolean;
  onSelect: () => void;
}

function junctionName(graph: WeightedGraph, id: string): string {
  return graph.junctions.find((j) => j.id === id)?.name ?? id;
}

function fmtTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function RouteListItem({
  rank,
  route,
  graph,
  realRoad,
  isSelected,
  onSelect,
}: RouteListItemProps) {
  const names = route.path.map((id) => junctionName(graph, id));
  const seq = names.join(" → ");
  const displaySeq =
    names.length > 4
      ? `${names[0]} → … → ${names.at(-2)} → ${names.at(-1)}`
      : seq;

  const dist = realRoad?.distanceKm ?? route.totalDistanceKm;
  const dur =
    realRoad != null
      ? realRoad.durationMin
      : route.totalTimeMin;
  const isReal = realRoad != null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "w-full rounded-lg border bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.6)_100%)] px-1.5 py-1 text-left backdrop-blur-xl transition-all active:scale-[0.99] " +
        (isSelected
          ? "border-primary-300 shadow-[0_2px_8px_rgba(223,0,89,0.15)]"
          : "border-white/60 hover:border-primary-200")
      }
    >
      <div className="flex items-center gap-1.5">
        <span
          className={
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold " +
            (isSelected
              ? "bg-primary-500 text-white"
              : "bg-primary-100 text-primary-600")
          }
        >
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-semibold text-ink-900">
            {displaySeq}
          </div>
          <div className="mt-px flex items-center gap-1.5 text-[9px] text-ink-500 tabular-nums">
            <span className="flex items-center gap-0.5">
              {isReal && <MapPinned className="h-2 w-2 text-primary-500" />}
              {dist.toFixed(1)} km
            </span>
            <span className="text-ink-300">·</span>
            <span>{fmtTime(dur)}</span>
            <span className="text-ink-300">·</span>
            <span>RM {route.totalTollRM.toFixed(0)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
