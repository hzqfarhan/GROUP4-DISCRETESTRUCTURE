"use client";
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Circle,
  MapPinned,
  Sigma,
} from "lucide-react";
import type {
  RealRoadGeometry,
  Route,
  WeightedGraph,
} from "@/lib/graph/types";

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

function edgeBetween(graph: WeightedGraph, from: string, to: string) {
  return graph.edges.find(
    (e) =>
      (e.from === from && e.to === to) || (e.from === to && e.to === from),
  );
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
  const [open, setOpen] = useState(false);

  const dist = realRoad?.distanceKm ?? route.totalDistanceKm;
  const dur =
    realRoad != null ? realRoad.durationMin : route.totalTimeMin;
  const isReal = realRoad != null;
  const isPrimary = rank === 1;

  return (
    <div
      className={
        "overflow-hidden rounded-lg border bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.6)_100%)] backdrop-blur-xl transition-all " +
        (isSelected
          ? "border-primary-300 shadow-[0_2px_8px_rgba(223,0,89,0.15)]"
          : "border-white/60 hover:border-primary-200")
      }
    >
      {/* Header row — clicking expands the graph timeline */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) onSelect();
        }}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 px-1.5 py-1 text-left active:scale-[0.99]"
      >
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
          <div className="flex items-center gap-1 text-[10px] font-semibold text-ink-900">
            <span className="truncate">
              {isPrimary ? "Recommended route" : `Route ${rank}`}
            </span>
            <span className="shrink-0 text-[8px] font-normal uppercase tracking-wider text-primary-600">
              {route.path.length} stops
            </span>
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
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center text-ink-400"
          aria-hidden
        >
          {open ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </span>
      </button>

      {/* Expanded graph timeline */}
      {open && (
        <ol className="border-t border-ink-300/15 bg-white/70 px-2 py-1.5 space-y-0.5">
          {route.path.map((nodeId, i) => {
            const next = route.path[i + 1];
            const e = next ? edgeBetween(graph, nodeId, next) : null;
            const isLast = i === route.path.length - 1;
            return (
              <li key={`${nodeId}-${i}`} className="flex gap-1.5">
                <div className="flex flex-col items-center pt-0.5">
                  <Circle
                    className={
                      "h-2 w-2 " +
                      (i === 0 || isLast
                        ? "fill-primary-500 text-primary-500"
                        : "fill-primary-300 text-primary-300")
                    }
                    strokeWidth={4}
                  />
                  {!isLast && <span className="my-0.5 w-px flex-1 bg-primary-200" />}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="truncate text-[10px] font-semibold text-ink-900">
                    {junctionName(graph, nodeId)}
                  </div>
                  {e && (
                    <div className="mt-px flex flex-wrap items-center gap-x-1.5 gap-y-0 text-[8.5px] text-ink-500 tabular-nums">
                      <span>
                        {e.timeMin + e.penaltyMin}m
                      </span>
                      <span className="text-ink-300">·</span>
                      <span>{e.distanceKm}km</span>
                      <span className="text-ink-300">·</span>
                      <span className="capitalize">{e.roadType}</span>
                      {e.tollRM > 0 && (
                        <>
                          <span className="text-ink-300">·</span>
                          <span className="font-semibold text-primary-600">
                            RM {e.tollRM.toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
          <li className="mt-1 flex items-center justify-between border-t border-ink-300/10 pt-1 text-[9px] text-ink-600">
            <span className="flex items-center gap-1 font-semibold">
              <Sigma className="h-2.5 w-2.5 text-primary-500" />
              ΣW
            </span>
            <span className="font-bold text-primary-600 tabular-nums">
              {route.totalWeight.toFixed(2)}
            </span>
          </li>
        </ol>
      )}
    </div>
  );
}
