"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { StatusBar } from "@/components/ui/StatusBar";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { FloatingActionButtons } from "@/components/planner/FloatingActionButtons";
import { GlassSearchPill } from "@/components/planner/GlassSearchPill";
import { BottomSheet } from "@/components/planner/BottomSheet";
import { PriorityToggle } from "@/components/planner/PriorityToggle";
import { RouteFinderButton } from "@/components/planner/RouteFinderButton";
import { RecommendedRouteCard } from "@/components/planner/RecommendedRouteCard";
import { RouteListItem } from "@/components/planner/RouteListItem";
import { FormulaExplainer } from "@/components/planner/FormulaExplainer";
import { ErrorBanner } from "@/components/ErrorBanner";
import { RouteDetailsModal } from "@/components/planner/RouteDetailsModal";
import type { OptimizationMode, PlanResponse } from "@/lib/graph/types";

const RealMap = dynamic(
  () => import("@/components/planner/RealMap").then((m) => m.RealMap),
  { ssr: false },
);

type Snap = "collapsed" | "half" | "full";
type Mode = "mobile" | "desktop";

const DEFAULT_ORIGIN = "UTHM Parit Raja";
const DEFAULT_DEST = "Masjid Sri Sendayan";

function useResponsiveMode(): Mode {
  const [mode, setMode] = useState<Mode>("mobile");
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const apply = () => setMode(mql.matches ? "desktop" : "mobile");
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);
  return mode;
}

export default function PlannerPage() {
  const responsive = useResponsiveMode();

  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState(DEFAULT_DEST);
  const [mode, setMode] = useState<OptimizationMode>("time");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanResponse | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [snap, setSnap] = useState<Snap>("collapsed");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY || undefined;

  const selectedRoute = result?.routes[selectedIdx] ?? null;
  const selectedRealRoad = useMemo(() => {
    if (!result) return null;
    return result.realRoads?.[selectedIdx] ?? result.realRoad ?? null;
  }, [result, selectedIdx]);

  const subline = useMemo(() => {
    if (!result) return `${origin} → ${destination}`;
    const km =
      selectedRealRoad?.distanceKm ?? result.recommended.totalDistanceKm;
    const t = selectedRealRoad
      ? `${Math.round(selectedRealRoad.durationMin)} min drive`
      : `~${result.stats.formattedTime}`;
    return `${km.toFixed(1)} km · ${t}`;
  }, [result, selectedRealRoad, origin, destination]);

  async function handleFind() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, mode }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as PlanResponse;
      setResult(data);
      setSelectedIdx(0);
      setSnap("half");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setOrigin(DEFAULT_ORIGIN);
    setDestination(DEFAULT_DEST);
    setResult(null);
    setError(null);
    setSelectedIdx(0);
    setSnap("collapsed");
    setDetailsOpen(false);
  }

  function handleSwap() {
    setOrigin(destination);
    setDestination(origin);
  }

  const alternativePaths = useMemo(() => {
    if (!result) return [] as { path: string[]; rank: number }[];
    return result.routes
      .map((r, i) => ({ path: r.path, rank: i + 1 }))
      .filter((_, i) => i !== selectedIdx);
  }, [result, selectedIdx]);

  const card = result && (
    <RecommendedRouteCard
      route={result.recommended}
      stats={result.stats}
      realRoad={selectedRealRoad}
      onOpenDetails={() => setDetailsOpen(true)}
    />
  );

  const sheet = (
    <div className="space-y-3">
      <PriorityToggle mode={mode} onChange={setMode} />
      <RouteFinderButton onClick={handleFind} loading={loading} />
      {error && <ErrorBanner message={error} />}
      {result && (
        <>
          {card}
          {result.routes.length > 1 && (
            <div className="mt-2 space-y-1.5">
              <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                All possible routes
              </div>
              {result.routes.map((r, i) => (
                <RouteListItem
                  key={`${r.edgeIds.join("-")}-${i}`}
                  rank={i + 1}
                  route={r}
                  graph={result.graph}
                  realRoad={result.realRoads?.[i] ?? null}
                  isSelected={i === selectedIdx}
                  onSelect={() => {
                    setSelectedIdx(i);
                    setSnap("half");
                  }}
                />
              ))}
            </div>
          )}
          <div className="px-1 pt-1 text-[9px] font-medium uppercase tracking-wider text-ink-300">
            Source: {result.source} · {result.graph.junctions.length}{" "}
            junctions · {result.graph.edges.length} edges
            {result.realRoads?.some(Boolean) && " · real road ✓"}
          </div>
        </>
      )}
      <FormulaExplainer mode={mode} />
    </div>
  );

  if (responsive === "desktop") {
    return (
      <>
        <div className="relative flex h-screen w-full overflow-hidden bg-surface-base">
          <div className="relative flex-1">
            <RealMap
              graph={result?.graph ?? { junctions: [], edges: [] }}
              selectedPath={selectedRoute?.path ?? null}
              alternativePaths={alternativePaths}
              originLabel={origin}
              destinationLabel={destination}
              maptilerKey={maptilerKey}
            />
          </div>
          <aside className="relative z-20 flex h-full w-[340px] shrink-0 flex-col border-l border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.85)_100%)] backdrop-blur-xl">
            <header className="flex shrink-0 items-center justify-between border-b border-ink-300/10 px-4 py-2.5">
              <div className="min-w-0">
                <h1 className="truncate text-sm font-bold text-ink-900">
                  Interstate Expedition Planner
                </h1>
                <p className="truncate text-[10px] text-ink-500">
                  UTHM Parit Raja → Masjid Sri Sendayan
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-600">
                β = {mode === "time" ? "0.5" : "2.5"}
              </span>
            </header>
            <div className="shrink-0 space-y-2 px-3 pt-2.5">
              <GlassSearchPill
                origin={origin}
                destination={destination}
                subline={subline}
                onSwap={handleSwap}
                onClear={handleClear}
              />
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2.5">
              {sheet}
            </div>
          </aside>
        </div>
        {result && (
          <RouteDetailsModal
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            result={result}
            selectedIdx={selectedIdx}
            onSelectRoute={(i) => setSelectedIdx(i)}
          />
        )}
      </>
    );
  }

  return (
    <PhoneFrame>
      <StatusBar tone="dark" />
      <RealMap
        graph={result?.graph ?? { junctions: [], edges: [] }}
        selectedPath={selectedRoute?.path ?? null}
        alternativePaths={alternativePaths}
        originLabel={origin}
        destinationLabel={destination}
        maptilerKey={maptilerKey}
      />
      <FloatingActionButtons />
      <GlassSearchPill
        origin={origin}
        destination={destination}
        subline={subline}
        onSwap={handleSwap}
        onClear={handleClear}
      />
      <BottomSheet snap={snap} onSnapChange={setSnap}>
        {sheet}
      </BottomSheet>
      {result && (
        <RouteDetailsModal
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          result={result}
          selectedIdx={selectedIdx}
          onSelectRoute={(i) => setSelectedIdx(i)}
        />
      )}
    </PhoneFrame>
  );
}
