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
        "w-full rounded-2xl border bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.6)_100%)] p-2.5 text-left backdrop-blur-xl transition-all active:scale-[0.99] " +
        (isSelected
          ? "border-primary-300 shadow-[0_4px_16px_rgba(107,60,255,0.15)]"
          : "border-white/60 hover:border-primary-200")
      }
    >
      <div className="flex items-center gap-2.5">
        <span
          className={
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold " +
            (isSelected
              ? "bg-primary-500 text-white"
              : "bg-primary-100 text-primary-600")
          }
        >
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-ink-900">
            {displaySeq}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-ink-500 tabular-nums">
            <span className="flex items-center gap-0.5">
              {isReal && <MapPinned className="h-2.5 w-2.5 text-primary-500" />}
              {dist.toFixed(1)} km
            </span>
            <span className="text-ink-300">·</span>
            <span>{fmtTime(dur)}</span>
            <span className="text-ink-300">·</span>
            <span>RM {route.totalTollRM.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
