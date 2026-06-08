"use client";
import { useEffect } from "react";
import { X, Clock, Coins, MapPinned, Route as RouteIcon } from "lucide-react";
import type {
  PlanResponse,
  RealRoadGeometry,
  Route,
} from "@/lib/graph/types";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  edgeBetween,
  formatMinutes,
  junctionName,
  roadTypeLabel,
} from "./RecommendedRouteCard";

interface RouteDetailsModalProps {
  open: boolean;
  onClose: () => void;
  result: PlanResponse;
  selectedIdx: number;
  onSelectRoute: (i: number) => void;
}

export function RouteDetailsModal({
  open,
  onClose,
  result,
  selectedIdx,
  onSelectRoute,
}: RouteDetailsModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const route = result.routes[selectedIdx] ?? result.recommended;
  const rr: RealRoadGeometry | null =
    result.realRoads?.[selectedIdx] ?? result.realRoad ?? null;
  const graph = result.graph;
  const stats = result.stats;

  const dist = rr?.distanceKm ?? route.totalDistanceKm;
  const dur = rr != null ? formatMinutes(rr.durationMin) : stats.formattedTime;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/30 backdrop-blur-sm md:items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[860px] overflow-hidden rounded-t-3xl border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.88)_100%)] shadow-[0_-12px_48px_rgba(82,63,160,0.18)] backdrop-blur-xl md:rounded-3xl md:m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-300/15 px-5 py-3.5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              Route details
            </div>
            <div className="text-sm font-bold text-ink-900">
              {graph.junctions.find((j) => j.id === route.path[0])?.name} →{" "}
              {graph.junctions.find(
                (j) => j.id === route.path[route.path.length - 1],
              )?.name}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-ink-700 active:scale-95"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-4 md:p-5">
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <BentoStat
              icon={<Clock className="h-3.5 w-3.5" />}
              label="Time"
              value={dur}
            />
            <BentoStat
              icon={<MapPinned className="h-3.5 w-3.5" />}
              label="Distance"
              value={`${dist.toFixed(1)} km`}
              sub={rr ? "real road" : "graph"}
            />
            <BentoStat
              icon={<Coins className="h-3.5 w-3.5" />}
              label="Toll"
              value={`RM ${stats.tollRM.toFixed(2)}`}
            />
            <BentoStat
              icon={<RouteIcon className="h-3.5 w-3.5" />}
              label="Stops"
              value={`${route.path.length}`}
              sub={`${route.edgeIds.length} segments`}
            />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <GlassCard className="p-3.5 md:col-span-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                Timeline
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
                        <div className="text-xs font-semibold text-ink-900">
                          {junctionName(graph, nodeId)}
                        </div>
                        {e && (
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-ink-500 tabular-nums">
                            <span>{e.timeMin + e.penaltyMin}m</span>
                            <span className="text-ink-300">·</span>
                            <span>{e.distanceKm}km</span>
                            <span className="text-ink-300">·</span>
                            <span>{roadTypeLabel(e.roadType)}</span>
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

            <GlassCard className="p-3.5 md:col-span-2">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                All routes
              </div>
              <div className="space-y-1.5">
                {result.routes.map((r: Route, i: number) => {
                  const altRr: RealRoadGeometry | null =
                    result.realRoads?.[i] ?? null;
                  const altDist = altRr?.distanceKm ?? r.totalDistanceKm;
                  const altDur =
                    altRr != null
                      ? formatMinutes(altRr.durationMin)
                      : formatMinutes(r.totalTimeMin);
                  const isSel = i === selectedIdx;
                  return (
                    <button
                      key={`${r.edgeIds.join("-")}-${i}`}
                      type="button"
                      onClick={() => onSelectRoute(i)}
                      className={
                        "flex w-full items-center gap-2 rounded-xl p-2 text-left transition-colors " +
                        (isSel
                          ? "bg-primary-50 ring-1 ring-primary-200"
                          : "hover:bg-white/70")
                      }
                    >
                      <span
                        className={
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold " +
                          (isSel
                            ? "bg-primary-500 text-white"
                            : "bg-ink-300/30 text-ink-700")
                        }
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] font-semibold text-ink-900">
                          {r.path
                            .map((id) => junctionName(graph, id))
                            .slice(0, 2)
                            .join(" → ")}
                          …
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-ink-500 tabular-nums">
                          <span>{altDist.toFixed(1)} km</span>
                          <span className="text-ink-300">·</span>
                          <span>{altDur}</span>
                          <span className="text-ink-300">·</span>
                          <span>RM {r.totalTollRM.toFixed(0)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 text-[9px] font-medium uppercase tracking-wider text-ink-300">
                Source: {result.source} · β = {stats.beta} ·{" "}
                {stats.mode === "time" ? "Time" : "Budget"}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function BentoStat({
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
    <GlassCard className="p-3">
      <div className="flex items-center gap-1.5 text-ink-500">
        {icon}
        <span className="text-[9px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="mt-1 text-base font-bold tabular-nums text-ink-900">
        {value}
      </div>
      {sub && (
        <div className="text-[9px] font-medium text-ink-300">{sub}</div>
      )}
    </GlassCard>
  );
}
