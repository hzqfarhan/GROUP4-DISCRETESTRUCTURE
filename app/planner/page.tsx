"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeftRight,
  X,
  ChevronRight,
  MapPinned,
  Clock,
  Coins,
  Pencil,
} from "lucide-react";
import { StatusBar } from "@/components/ui/StatusBar";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { FloatingActionButtons } from "@/components/planner/FloatingActionButtons";
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

export default function PlannerPage() {
  const responsive = useResponsiveMode();

  // Start with empty inputs — the user picks a suggestion or types their own.
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
  }

  const dist = selectedRealRoad?.distanceKm ?? result?.recommended.totalDistanceKm;
  const durMin = selectedRealRoad
    ? selectedRealRoad.durationMin
    : result?.stats.timeMin;
  const toll = result?.stats.tollRM ?? 0;

  const desktopSidebar = (
    <aside className="relative z-20 flex h-full w-[280px] shrink-0 flex-col border-l border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.88)_100%)] backdrop-blur-xl">
      {/* Compact header */}
      <header className="flex shrink-0 items-center justify-between border-b border-ink-300/10 px-3 py-1.5">
        <h1 className="text-xs font-bold text-ink-900">IEP</h1>
        <span className="rounded-full bg-primary-50 px-1.5 py-0.5 text-[9px] font-semibold text-primary-600">
          β = {mode === "time" ? "0.5" : "2.5"}
        </span>
      </header>

      {/* Origin / Destination row */}
      <div className="shrink-0 px-2.5 pt-2">
        <div className="mb-1 flex items-center justify-between px-0.5">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-ink-500">
            AI: ollama.com · minimax-m3
          </span>
          <span className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wider text-primary-600">
            <span className="h-1 w-1 rounded-full bg-primary-500" />
            online
          </span>
        </div>
        {editing === "origin" || editing === "destination" ? (
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
            className="w-full rounded-lg border border-primary-200 bg-white/90 px-2 py-1 text-[11px] text-ink-900 focus:border-primary-500 focus:outline-none"
            placeholder="Type a place…"
          />
        ) : (
          <div className="flex items-center gap-1 rounded-lg border border-white/60 bg-white/70 px-1.5 py-1">
            <button
              type="button"
              onClick={() => setEditing("origin")}
              className="group flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-0.5 hover:bg-primary-50/60"
              title="Edit origin"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
              <span
                className={
                  "truncate text-[10px] font-semibold " +
                  (origin ? "text-ink-900" : "text-ink-300 italic")
                }
              >
                {origin || "Click to type origin"}
              </span>
              <Pencil className="h-2.5 w-2.5 shrink-0 text-ink-300 group-hover:text-primary-500" />
            </button>
            <button
              type="button"
              onClick={handleSwap}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/80 text-ink-500 hover:text-primary-500"
              aria-label="Swap"
              title="Swap"
            >
              <ArrowLeftRight className="h-2.5 w-2.5" />
            </button>
            <button
              type="button"
              onClick={() => setEditing("destination")}
              className="group flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-0.5 hover:bg-primary-50/60"
              title="Edit destination"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
              <span
                className={
                  "truncate text-[10px] font-semibold " +
                  (destination ? "text-ink-900" : "text-ink-300 italic")
                }
              >
                {destination || "Click to type destination"}
              </span>
              <Pencil className="h-2.5 w-2.5 shrink-0 text-ink-300 group-hover:text-primary-500" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/80 text-ink-500 hover:text-primary-500"
              aria-label="Reset"
              title="Reset"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        )}
        <div className="mt-1 px-1 text-[9px] text-ink-500">
          {result
            ? "Route loaded · type any place above to try a different one"
            : "Pick a suggested pair below, or type your own places above"}
        </div>
      </div>

      {/* Priority + Find button on one row */}
      <div className="shrink-0 px-2.5 pt-2">
        <div className="flex items-center gap-1.5">
          <div className="flex-1">
            <PriorityToggle mode={mode} onChange={setMode} />
          </div>
          <PrimaryButton
            onClick={handleFind}
            loading={loading}
            disabled={!canFind}
            size="sm"
            className="!w-auto !px-4"
          >
            Find
          </PrimaryButton>
        </div>
        {error && (
          <div className="mt-1.5">
            <ErrorBanner message={error} />
          </div>
        )}
      </div>

      {/* Recommended bento — 1 line, clickable */}
      {result && (
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className="mx-2.5 mt-1.5 shrink-0 rounded-xl border border-white/60 bg-[linear-gradient(135deg,#df0059_0%,#cc0d5a_100%)] px-2.5 py-1.5 text-left text-white shadow-[0_4px_12px_rgba(223,0,89,0.30)] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-wider opacity-80">
            <span>Recommended</span>
            <ChevronRight className="h-3 w-3" />
          </div>
          <div className="mt-0.5 flex items-end gap-3 tabular-nums">
            <MiniStat icon={<Clock className="h-2.5 w-2.5" />} label="Time" value={durMin ? fmtDur(durMin) : "—"} />
            <MiniStat icon={<MapPinned className="h-2.5 w-2.5" />} label="Dist" value={dist ? `${dist.toFixed(1)}km` : "—"} />
            <MiniStat icon={<Coins className="h-2.5 w-2.5" />} label="Toll" value={toll ? `RM${toll.toFixed(0)}` : "—"} />
          </div>
        </button>
      )}

      {/* Routes list */}
      {result && result.routes.length > 0 && (
        <div className="mt-1.5 flex min-h-0 flex-1 flex-col px-2.5">
          <div className="flex items-center justify-between px-1 pb-1 text-[9px] font-semibold uppercase tracking-wider text-ink-500">
            <span>All routes</span>
            <span className="text-ink-300 normal-case tracking-normal">
              {result.routes.length}
            </span>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto pb-2 pr-0.5">
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
        </div>
      )}

      {/* No result state — big suggestion buttons */}
      {!result && (
        <div className="mt-2 flex-1 overflow-y-auto px-2.5 pb-2">
          <PairSuggestions
            onPick={pickPair}
            onTypeOrigin={() => setEditing("origin")}
            onTypeDestination={() => setEditing("destination")}
          />
          <div className="mt-2">
            <FormulaExplainer mode={mode} />
          </div>
        </div>
      )}
    </aside>
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
          {desktopSidebar}
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

  // Mobile: iPhone shell + bottom sheet
  const mobileSheet = (
    <div className="space-y-2.5">
      {!result && (
        <div className="rounded-xl border border-white/60 bg-white/70 p-2.5 text-[10px] text-ink-700">
          <span className="font-semibold text-primary-600">Suggested routes:</span>{" "}
          pick one of the two hardcoded pairs below, or type your own places
          above.
        </div>
      )}
      {editing !== null ? (
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
        <div className="flex items-center gap-1 rounded-xl border border-white/60 bg-white/70 p-1.5">
          <button
            type="button"
            onClick={() => setEditing("origin")}
            className="flex flex-1 items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] font-semibold"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
            <span
              className={
                "truncate " + (origin ? "text-ink-900" : "text-ink-300 italic")
              }
            >
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
            <span
              className={
                "truncate " +
                (destination ? "text-ink-900" : "text-ink-300 italic")
              }
            >
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
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <PriorityToggle mode={mode} onChange={setMode} />
        </div>
      </div>
      <PrimaryButton
        onClick={handleFind}
        loading={loading}
        disabled={!canFind}
      >
        Find My Route
      </PrimaryButton>
      {error && <ErrorBanner message={error} />}
      {result && (
        <>
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-white/60 bg-[linear-gradient(135deg,#df0059_0%,#cc0d5a_100%)] p-2.5 text-left text-white shadow-[0_4px_12px_rgba(223,0,89,0.30)] active:scale-[0.99]"
          >
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider opacity-80">
                Recommended
              </div>
              <div className="mt-0.5 text-sm font-bold tabular-nums">
                {durMin ? fmtDur(durMin) : "—"} · {dist ? `${dist.toFixed(1)} km` : "—"} · RM {toll.toFixed(0)}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 opacity-80" />
          </button>
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
      <BottomSheet snap={snap} onSnapChange={setSnap}>
        {mobileSheet}
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
