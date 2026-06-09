"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  ArrowLeftRight,
  X,
  ChevronRight,
  MapPinned,
  Clock,
  Coins,
  Pencil,
  Plus,
  Minus,
  Crosshair,
  Layers,
  Utensils,
  Hotel,
  Camera,
  Mountain,
  Bus,
} from "lucide-react";
import { StatusBar } from "@/components/ui/StatusBar";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { PriorityToggle } from "@/components/planner/PriorityToggle";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RouteListItem } from "@/components/planner/RouteListItem";
import { FormulaExplainer } from "@/components/planner/FormulaExplainer";
import { ErrorBanner } from "@/components/ErrorBanner";
import { RouteDetailsModal } from "@/components/planner/RouteDetailsModal";
import { PairSuggestions } from "@/components/planner/PairSuggestions";
import type { OptimizationMode, PlanResponse } from "@/lib/graph/types";
import { HARDCODED_PAIRS } from "@/lib/graph/store";

const RealMap = dynamic(
  () => import("@/components/planner/RealMap").then((m) => m.RealMap),
  { ssr: false },
);

type Snap = "collapsed" | "half" | "full";
type Mode = "mobile" | "desktop";

const PAIR_BY_ID: Record<string, (typeof HARDCODED_PAIRS)[number]> =
  Object.fromEntries(HARDCODED_PAIRS.map((p) => [p.id, p]));

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

const CATEGORY_CHIPS = [
  { label: "Restaurants", icon: Utensils },
  { label: "Hotels", icon: Hotel },
  { label: "Things to do", icon: Camera },
  { label: "Museums", icon: Mountain },
  { label: "Transit", icon: Bus },
] as const;

export default function PlannerPage() {
  const responsive = useResponsiveMode();
  const mapRef = useRef<{ zoomIn: () => void; zoomOut: () => void; recenter: () => void }>(null);

  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [mode, setMode] = useState<OptimizationMode>("time");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanResponse | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [snap, setSnap] = useState<Snap>("collapsed");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editing, setEditing] = useState<null | "origin" | "destination">(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY || undefined;

  const selectedRoute = result?.routes[selectedIdx] ?? null;
  const selectedRealRoad = useMemo(() => {
    if (!result) return null;
    return result.realRoads?.[selectedIdx] ?? result.realRoad ?? null;
  }, [result, selectedIdx]);

  const alternativePaths = useMemo(() => {
    if (!result) return [] as { path: string[]; rank: number }[];
    return result.routes
      .map((r, i) => ({ path: r.path, rank: i + 1 }))
      .filter((_, i) => i !== selectedIdx);
  }, [result, selectedIdx]);

  const canFind =
    !loading && origin.trim().length > 0 && destination.trim().length > 0;

  async function handleFind() {
    if (!canFind) return;
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
      setSearchOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setOrigin("");
    setDestination("");
    setResult(null);
    setError(null);
    setSelectedIdx(0);
    setSnap("collapsed");
    setDetailsOpen(false);
    setEditing(null);
  }

  function handleSwap() {
    setOrigin(destination);
    setDestination(origin);
  }

  function pickPair(pairId: string) {
    const p = PAIR_BY_ID[pairId];
    if (!p) return;
    setOrigin(p.origin);
    setDestination(p.destination);
    setError(null);
    setSearchOpen(false);
  }

  const dist = selectedRealRoad?.distanceKm ?? result?.recommended.totalDistanceKm;
  const durMin = selectedRealRoad
    ? selectedRealRoad.durationMin
    : result?.stats.timeMin;
  const toll = result?.stats.tollRM ?? 0;

  // ============================
  // Google-Maps-style top search bar
  // ============================
  const TopSearchBar = (
    <div className="pointer-events-auto absolute left-0 right-0 top-3 z-30 flex flex-col gap-2 px-3 sm:top-4 sm:px-4">
      <div className="flex items-center gap-2">
        <div
          className={
            "flex h-12 flex-1 items-center gap-2 rounded-full border border-white/60 bg-white/95 px-4 shadow-[0_4px_16px_rgba(82,63,160,0.12)] backdrop-blur-xl " +
            (searchOpen ? "ring-2 ring-primary-200" : "")
          }
        >
          <Search className="h-4 w-4 shrink-0 text-primary-500" strokeWidth={2.6} />
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex-1 truncate text-left text-sm font-semibold text-ink-900"
          >
            {origin || destination
              ? `${origin || "Origin"} → ${destination || "Destination"}`
              : "Search UTHM → Masjid Sri Sendayan"}
          </button>
          {(origin || destination) && (
            <button
              type="button"
              onClick={handleClear}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-500 hover:bg-primary-50 hover:text-primary-500"
              aria-label="Clear"
              title="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category chips (Google-Maps style) */}
      <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_CHIPS.map((chip) => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.label}
              type="button"
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/60 bg-white/85 px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-[0_2px_6px_rgba(82,63,160,0.06)] backdrop-blur-xl active:scale-95"
            >
              <Icon className="h-3.5 w-3.5 text-primary-500" strokeWidth={2.2} />
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Expanded search panel */}
      {searchOpen && (
        <div className="rounded-2xl border border-white/60 bg-white/95 p-2.5 shadow-[0_8px_24px_rgba(82,63,160,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setEditing("origin")}
              className="group flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-surface-map px-3 py-2 text-left text-xs font-semibold text-ink-900 hover:bg-primary-50"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
              <span
                className={
                  "flex-1 truncate " +
                  (origin ? "" : "text-ink-300 italic")
                }
              >
                {origin || "Type origin"}
              </span>
              <Pencil className="h-3 w-3 shrink-0 text-ink-300 group-hover:text-primary-500" />
            </button>
            <button
              type="button"
              onClick={handleSwap}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink-500 shadow-sm hover:text-primary-500"
              aria-label="Swap"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setEditing("destination")}
              className="group flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-surface-map px-3 py-2 text-left text-xs font-semibold text-ink-900 hover:bg-primary-50"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
              <span
                className={
                  "flex-1 truncate " +
                  (destination ? "" : "text-ink-300 italic")
                }
              >
                {destination || "Type destination"}
              </span>
              <Pencil className="h-3 w-3 shrink-0 text-ink-300 group-hover:text-primary-500" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setEditing(null);
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink-500 shadow-sm"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <PairSuggestions
            onPick={pickPair}
            onTypeOrigin={() => setEditing("origin")}
            onTypeDestination={() => setEditing("destination")}
          />
        </div>
      )}
    </div>
  );

  // ============================
  // Right-side map controls (Google-Maps style)
  // ============================
  const RightControls = (
    <div className="absolute bottom-44 right-3 z-20 flex flex-col gap-2 sm:right-4 sm:bottom-48">
      <button
        type="button"
        onClick={() => mapRef.current?.zoomIn()}
        aria-label="Zoom in"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-500 shadow-[0_4px_14px_rgba(82,63,160,0.18)] active:scale-95"
      >
        <Plus className="h-4 w-4" strokeWidth={2.4} />
      </button>
      <button
        type="button"
        onClick={() => mapRef.current?.zoomOut()}
        aria-label="Zoom out"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-500 shadow-[0_4px_14px_rgba(82,63,160,0.18)] active:scale-95"
      >
        <Minus className="h-4 w-4" strokeWidth={2.4} />
      </button>
      <button
        type="button"
        onClick={() => mapRef.current?.recenter()}
        aria-label="Recenter"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-500 shadow-[0_4px_14px_rgba(82,63,160,0.18)] active:scale-95"
      >
        <Crosshair className="h-4 w-4" strokeWidth={2.4} />
      </button>
      <button
        type="button"
        onClick={() => mapRef.current?.recenter()}
        aria-label="Layers"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-500 shadow-[0_4px_14px_rgba(82,63,160,0.18)] active:scale-95"
      >
        <Layers className="h-4 w-4" strokeWidth={2.4} />
      </button>
    </div>
  );

  // ============================
  // Recommended bento — clickable, opens detail modal
  // ============================
  const RecommendedBento = result && (
    <button
      type="button"
      onClick={() => setDetailsOpen(true)}
      className="w-full rounded-2xl border border-white/60 bg-[linear-gradient(135deg,#df0059_0%,#cc0d5a_100%)] p-3 text-left text-white shadow-[0_6px_18px_rgba(223,0,89,0.30)] active:scale-[0.99]"
    >
      <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-wider opacity-80">
        <span>Recommended</span>
        <ChevronRight className="h-3 w-3" />
      </div>
      <div className="mt-1 grid grid-cols-3 gap-2 tabular-nums">
        <MiniStat icon={<Clock className="h-2.5 w-2.5" />} label="Time" value={durMin ? fmtDur(durMin) : "—"} />
        <MiniStat icon={<MapPinned className="h-2.5 w-2.5" />} label="Dist" value={dist ? `${dist.toFixed(1)} km` : "—"} />
        <MiniStat icon={<Coins className="h-2.5 w-2.5" />} label="Toll" value={toll ? `RM${toll.toFixed(0)}` : "—"} />
      </div>
    </button>
  );

  // ============================
  // Inline input row used in the bottom sheet (mobile)
  // ============================
  const MobileInputRow = editing !== null ? (
    <input
      autoFocus
      value={editing === "origin" ? origin : destination}
      onChange={(e) =>
        editing === "origin"
          ? setOrigin(e.target.value)
          : setDestination(e.target.value)
      }
      onBlur={() => setEditing(null)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Escape") {
          setEditing(null);
        }
      }}
      className="w-full rounded-xl border border-primary-200 bg-white/90 px-3 py-2 text-xs text-ink-900 focus:border-primary-500 focus:outline-none"
      placeholder="Type a place…"
    />
  ) : (
    <div className="flex items-center gap-1 rounded-xl border border-white/60 bg-white/80 p-1.5">
      <button
        type="button"
        onClick={() => setEditing("origin")}
        className="flex flex-1 items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] font-semibold"
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
        <span className={"truncate " + (origin ? "text-ink-900" : "text-ink-300 italic")}>
          {origin || "Type origin"}
        </span>
        <Pencil className="h-2.5 w-2.5 shrink-0 text-ink-300" />
      </button>
      <button
        type="button"
        onClick={handleSwap}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-ink-500"
        aria-label="Swap"
      >
        <ArrowLeftRight className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => setEditing("destination")}
        className="flex flex-1 items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] font-semibold"
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
        <span className={"truncate " + (destination ? "text-ink-900" : "text-ink-300 italic")}>
          {destination || "Type destination"}
        </span>
        <Pencil className="h-2.5 w-2.5 shrink-0 text-ink-300" />
      </button>
      <button
        type="button"
        onClick={handleClear}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-ink-500"
        aria-label="Reset"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );

  // ============================
  // Bottom sheet content (mobile only)
  // ============================
  const MobileSheetContent = (
    <div className="space-y-2.5">
      {!result && (
        <div className="rounded-xl border border-white/60 bg-white/70 p-2.5 text-[10px] text-ink-700">
          <span className="font-semibold text-primary-600">Tip:</span> tap the
          search bar above to pick a route or type your own.
        </div>
      )}
      {MobileInputRow}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <PriorityToggle mode={mode} onChange={setMode} />
        </div>
      </div>
      <PrimaryButton onClick={handleFind} loading={loading} disabled={!canFind}>
        Find My Route
      </PrimaryButton>
      {error && <ErrorBanner message={error} />}
      {result && (
        <>
          {RecommendedBento}
          {result.routes.length > 1 && (
            <div className="mt-1 space-y-1">
              <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                All routes
              </div>
              {result.routes.map((r, i) => (
                <RouteListItem
                  key={`${r.edgeIds.join("-")}-${i}`}
                  rank={i + 1}
                  route={r}
                  graph={result.graph}
                  realRoad={result.realRoads?.[i] ?? null}
                  isSelected={i === selectedIdx}
                  onSelect={() => setSelectedIdx(i)}
                />
              ))}
            </div>
          )}
          <div className="px-1 text-[9px] uppercase tracking-wider text-ink-300">
            Source: {result.source} · {result.graph.junctions.length} junctions · {result.graph.edges.length} edges
            {result.realRoads?.some(Boolean) && " · real road ✓"}
          </div>
        </>
      )}
      {!result && (
        <PairSuggestions
          onPick={pickPair}
          onTypeOrigin={() => setEditing("origin")}
          onTypeDestination={() => setEditing("destination")}
        />
      )}
      <FormulaExplainer mode={mode} />
    </div>
  );

  // ============================
  // Mobile
  // ============================
  if (responsive === "mobile") {
    return (
      <PhoneFrame>
        <StatusBar tone="dark" />
        <RealMap
          ref={mapRef}
          graph={result?.graph ?? { junctions: [], edges: [] }}
          selectedPath={selectedRoute?.path ?? null}
          alternativePaths={alternativePaths}
          originLabel={origin || "Origin"}
          destinationLabel={destination || "Destination"}
          maptilerKey={maptilerKey}
        />
        {TopSearchBar}
        {RightControls}
        <BottomSheet snap={snap} onSnapChange={setSnap}>
          {MobileSheetContent}
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

  // ============================
  // Desktop — same Google-Maps layout, sidebar is a right rail
  // ============================
  return (
    <>
      <div className="relative flex h-screen w-full overflow-hidden bg-surface-base">
        <div className="relative flex-1">
          <RealMap
            ref={mapRef}
            graph={result?.graph ?? { junctions: [], edges: [] }}
            selectedPath={selectedRoute?.path ?? null}
            alternativePaths={alternativePaths}
            originLabel={origin || "Origin"}
            destinationLabel={destination || "Destination"}
            maptilerKey={maptilerKey}
          />
          {TopSearchBar}
          {RightControls}
        </div>

        <aside className="relative z-20 flex h-full w-[320px] shrink-0 flex-col border-l border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.88)_100%)] backdrop-blur-xl">
          <header className="flex shrink-0 items-center justify-between border-b border-ink-300/10 px-4 py-2.5">
            <h1 className="text-sm font-bold text-ink-900">
              Interstate Expedition Planner
            </h1>
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[9px] font-semibold text-primary-600">
              β = {mode === "time" ? "0.5" : "2.5"}
            </span>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {error && <ErrorBanner message={error} />}
            {RecommendedBento}

            {result && result.routes.length > 1 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1 text-[9px] font-semibold uppercase tracking-wider text-ink-500">
                  <span>All routes</span>
                  <span className="text-ink-300 normal-case tracking-normal">
                    {result.routes.length}
                  </span>
                </div>
                {result.routes.map((r, i) => (
                  <RouteListItem
                    key={`${r.edgeIds.join("-")}-${i}`}
                    rank={i + 1}
                    route={r}
                    graph={result.graph}
                    realRoad={result.realRoads?.[i] ?? null}
                    isSelected={i === selectedIdx}
                    onSelect={() => setSelectedIdx(i)}
                  />
                ))}
              </div>
            )}

            {!result && (
              <div className="rounded-2xl border border-white/60 bg-white/70 p-3 text-[10px] text-ink-700">
                <div className="font-semibold text-primary-600">Pick a route</div>
                <p className="mt-1 leading-snug">
                  Tap a suggestion in the search bar above, or type any
                  place.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-white/60 bg-white/70 p-2.5">
              <PriorityToggle mode={mode} onChange={setMode} />
            </div>

            <FormulaExplainer mode={mode} />
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

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider opacity-80">
        {icon}
        {label}
      </div>
      <div className="text-sm font-bold leading-tight">{value}</div>
    </div>
  );
}

function fmtDur(min: number): string {
  if (min <= 0) return "0m";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function BottomSheet({
  snap,
  onSnapChange,
  children,
}: {
  snap: Snap;
  onSnapChange: (s: Snap) => void;
  children: React.ReactNode;
}) {
  const HEIGHTS: Record<Snap, string> = {
    collapsed: "h-[180px]",
    half: "h-[58%]",
    full: "h-[92%]",
  };
  return (
    <div
      className={
        "absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl border-t border-white/60 " +
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.85)_100%)] " +
        "backdrop-blur-xl backdrop-saturate-150 " +
        "shadow-[0_-12px_32px_rgba(204,13,90,0.12)] transition-[height] duration-300 ease-out " +
        HEIGHTS[snap]
      }
    >
      <div
        className="flex h-6 w-full items-center justify-center pt-2"
        onClick={() =>
          onSnapChange(
            snap === "collapsed" ? "half" : snap === "half" ? "full" : "collapsed",
          )
        }
      >
        <span className="h-1.5 w-12 rounded-full bg-ink-300/60" />
      </div>
      <div className="h-[calc(100%-1.5rem)] overflow-y-auto px-4 pb-6">
        {children}
      </div>
    </div>
  );
}
