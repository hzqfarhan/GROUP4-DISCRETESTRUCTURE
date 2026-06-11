"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Plus,
  Minus,
  Crosshair,
  Layers,
  Clock,
  Coins,
  MapPinned,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Loader2,
  Palette,
  Map as MapIcon,
  Satellite,
  Mountain,
  Sun,
} from "lucide-react";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { PriorityToggle } from "@/components/planner/PriorityToggle";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RouteListItem } from "@/components/planner/RouteListItem";
import { ErrorBanner } from "@/components/ErrorBanner";
import { RouteDetailsModal } from "@/components/planner/RouteDetailsModal";
import { SearchBar } from "@/components/planner/SearchBar";
import { RouteDetailsPanel } from "@/components/planner/RouteDetailsPanel";
import { CalculationPanel } from "@/components/planner/CalculationPanel";
import { SplashScreen } from "@/components/SplashScreen";
import type { OptimizationMode, PlanResponse } from "@/lib/graph/types";
import { HARDCODED_PAIRS } from "@/lib/graph/store";
import type { MapLayer, UserLocation, RealMapHandle } from "@/components/planner/RealMap";

const RealMap = dynamic(
  () => import("@/components/planner/RealMap").then((m) => m.RealMap),
  { ssr: false },
);

type Mode = "mobile" | "desktop";

const PAIR_BY_ID: Record<string, (typeof HARDCODED_PAIRS)[number]> =
  Object.fromEntries(HARDCODED_PAIRS.map((p) => [p.id, p]));

const LAYER_OPTIONS: Array<{ id: MapLayer; label: string; Icon: typeof MapIcon; needsKey: boolean }> = [
  { id: "streets", label: "Streets", Icon: MapIcon, needsKey: false },
  { id: "satellite", label: "Satellite", Icon: Satellite, needsKey: true },
  { id: "topo", label: "Topo", Icon: Mountain, needsKey: true },
  { id: "light", label: "Light", Icon: Sun, needsKey: false },
];

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
  const mapRef = useRef<RealMapHandle | null>(null);

  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [activePairId, setActivePairId] = useState<"sendayan" | "melaka" | null>(
    null,
  );
  const [mode, setMode] = useState<OptimizationMode>("time");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanResponse | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Mobile card collapsed/expanded. Desktop rail collapsed/expanded.
  const [mobileCard, setMobileCard] = useState<"peek" | "expanded">("peek");
  const [desktopRail, setDesktopRail] = useState<"expanded" | "collapsed">(
    "collapsed",
  );
  const [layer, setLayer] = useState<MapLayer>("topo");
  const [pinkFilter, setPinkFilter] = useState(false);
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [pickOnMapHint, setPickOnMapHint] = useState(false);

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
        body: JSON.stringify({
          origin,
          destination,
          mode,
          ...(activePairId ? { pairId: activePairId } : {}),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as PlanResponse;
      setResult(data);
      setSelectedIdx(0);
      setMobileCard("expanded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setOrigin("");
    setDestination("");
    setActivePairId(null);
    setResult(null);
    setError(null);
    setSelectedIdx(0);
    setDetailsOpen(false);
    setMobileCard("peek");
  }

  function handleSwap() {
    setOrigin(destination);
    setDestination(origin);
  }

  function pickPair(pairId: "sendayan" | "melaka") {
    const p = PAIR_BY_ID[pairId];
    if (!p) return;
    setOrigin(p.origin);
    setDestination(p.destination);
    setActivePairId(pairId);
    setError(null);
  }

  async function handleMapClick(loc: { lat: number; lng: number }) {
    if (!pickOnMapHint) return;
    setUserLocation({ lat: loc.lat, lng: loc.lng, label: "Pinned on map" });
    setOrigin(`Pinned (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`);
    setActivePairId(null);
    setError(null);
    setPickOnMapHint(false);
    setMobileCard("expanded");
  }

  const dist = selectedRealRoad?.distanceKm ?? result?.recommended.totalDistanceKm;
  const durMin = selectedRealRoad
    ? selectedRealRoad.durationMin
    : result?.stats.timeMin;
  const toll = result?.stats.tollRM ?? 0;

  // ============================
  // Right-side map controls (Google-Maps style)
  // ============================
  const RightControls = (
    <div className="absolute right-3 top-32 z-20 flex flex-col gap-2 sm:right-4 sm:top-40">
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
        onClick={() => {
          if (typeof navigator === "undefined" || !navigator.geolocation) {
            setError("Geolocation is not supported in this browser.");
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setUserLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                label: "My current location",
              });
              setError(null);
              mapRef.current?.flyTo(
                pos.coords.latitude,
                pos.coords.longitude,
                15,
              );
            },
            (err) =>
              setError(err.message || "Could not get your location."),
            { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
          );
        }}
        aria-label="Locate me"
        title="Locate me"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-500 shadow-[0_4px_14px_rgba(82,63,160,0.18)] active:scale-95"
      >
        <Crosshair className="h-4 w-4" strokeWidth={2.4} />
      </button>
      <button
        type="button"
        onClick={() => setPickOnMapHint((v) => !v)}
        aria-label="Pick origin on map"
        title="Click on the map to set origin"
        className={
          "flex h-10 w-10 items-center justify-center rounded-full shadow-[0_4px_14px_rgba(82,63,160,0.18)] active:scale-95 " +
          (pickOnMapHint
            ? "bg-primary-500 text-white"
            : "bg-white text-primary-500")
        }
      >
        <MapPinned className="h-4 w-4" strokeWidth={2.4} />
      </button>
      <div className="relative">
        <button
          type="button"
          onClick={() => setLayerMenuOpen((v) => !v)}
          aria-label="Map style"
          title="Change map style"
          className={
            "flex h-10 w-10 items-center justify-center rounded-full shadow-[0_4px_14px_rgba(82,63,160,0.18)] active:scale-95 " +
            (layerMenuOpen
              ? "bg-primary-500 text-white"
              : "bg-white text-primary-500")
          }
        >
          <Layers className="h-4 w-4" strokeWidth={2.4} />
        </button>
        {layerMenuOpen && (
          <div
            className="absolute right-12 top-0 z-30 w-44 overflow-hidden rounded-2xl border border-white/60 bg-white/95 shadow-[0_8px_24px_rgba(82,63,160,0.22)] backdrop-blur-xl"
            role="menu"
          >
            <div className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wider text-ink-500">
              Map style
            </div>
            {LAYER_OPTIONS.map((opt) => {
              const disabled = opt.needsKey && !maptilerKey;
              const active = layer === opt.id;
              const Icon = opt.Icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setLayer(opt.id);
                    setLayerMenuOpen(false);
                  }}
                  className={
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors " +
                    (active
                      ? "bg-primary-50 text-primary-600"
                      : "text-ink-700 hover:bg-primary-50/60") +
                    (disabled ? " cursor-not-allowed opacity-40" : "")
                  }
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
                  <span className="flex-1 font-semibold">{opt.label}</span>
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setPinkFilter((v) => !v);
                setLayerMenuOpen(false);
              }}
              className={
                "flex w-full items-center gap-2 border-t border-ink-300/10 px-3 py-2 text-left text-xs " +
                (pinkFilter
                  ? "bg-primary-50 text-primary-600"
                  : "text-ink-700 hover:bg-primary-50/60")
              }
            >
              <Palette className="h-3.5 w-3.5" strokeWidth={2.4} />
              <span className="flex-1 font-semibold">Pink filter</span>
              <span
                className={
                  "inline-flex h-3.5 w-7 items-center rounded-full px-0.5 transition-colors " +
                  (pinkFilter ? "bg-primary-500" : "bg-ink-300/40")
                }
              >
                <span
                  className={
                    "h-2.5 w-2.5 rounded-full bg-white shadow-sm transition-transform " +
                    (pinkFilter ? "translate-x-3.5" : "translate-x-0")
                  }
                />
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ============================
  // Mini bento — sticky recommended card (floating, pink)
  // ============================
  const MiniBento = result && (
    <button
      type="button"
      onClick={() => setDetailsOpen(true)}
      className="w-full rounded-2xl border border-white/60 bg-[linear-gradient(135deg,#df0059_0%,#cc0d5a_100%)] p-2.5 text-left text-white shadow-[0_6px_20px_rgba(223,0,89,0.30)] active:scale-[0.99]"
    >
      <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-wider opacity-80">
        <span>Recommended</span>
        <ChevronRight className="h-3 w-3" />
      </div>
      <div className="mt-1 grid grid-cols-3 gap-2 tabular-nums">
        <MiniStat
          icon={<Clock className="h-2.5 w-2.5" />}
          label="Time"
          value={durMin ? fmtDur(durMin) : "—"}
        />
        <MiniStat
          icon={<MapPinned className="h-2.5 w-2.5" />}
          label="Dist"
          value={dist ? `${dist.toFixed(1)} km` : "—"}
        />
        <MiniStat
          icon={<Coins className="h-2.5 w-2.5" />}
          label="Toll"
          value={toll ? `RM${toll.toFixed(0)}` : "—"}
        />
      </div>
    </button>
  );

  // ============================
  // Mobile floating card
  // ============================
  const MobileFloatingCard = (
    <div
      className={
        "pointer-events-auto absolute bottom-3 left-3 right-3 z-30 rounded-3xl border border-white/60 " +
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.85)_100%)] " +
        "backdrop-blur-xl backdrop-saturate-150 shadow-[0_-4px_24px_rgba(204,13,90,0.18)] " +
        "transition-[max-height,opacity] duration-300 ease-out " +
        (mobileCard === "expanded" ? "max-h-[78vh]" : "max-h-[88px]") +
        " overflow-hidden flex flex-col"
      }
    >
      {/* Drag handle / toggle */}
      <button
        type="button"
        onClick={() =>
          setMobileCard((p) => (p === "expanded" ? "peek" : "expanded"))
        }
        className="shrink-0 flex w-full items-center justify-center bg-transparent py-1.5"
        aria-label="Toggle card"
      >
        <span className="h-1.5 w-12 rounded-full bg-ink-300/60" />
      </button>

      <div className="flex-1 min-h-0 space-y-2 px-3 pb-3 overflow-y-auto">
        {/* Always-visible row: priority + Find */}
        <div className="flex items-center gap-2">
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
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Finding…</span>
              </>
            ) : result ? (
              "Re-find"
            ) : (
              "Find"
            )}
          </PrimaryButton>
        </div>

        {error && <ErrorBanner message={error} />}

        {/* Expanded body */}
        {mobileCard === "expanded" && (
          <>
            {/* Header row: title + back/edit button */}
            <div className="flex items-center justify-between border-b border-ink-300/10 pb-1.5">
              <div className="min-w-0">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-ink-500">
                  {result ? "Trip result" : "Plan a trip"}
                </div>
                <div className="truncate text-xs font-bold text-ink-900">
                  {result
                    ? `${origin || "Origin"} → ${destination || "Destination"}`
                    : "Pick an origin & destination"}
                </div>
              </div>
              {result ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileCard("peek");
                    setResult(null);
                    setError(null);
                    setSelectedIdx(0);
                    setDetailsOpen(false);
                  }}
                  className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-primary-200 bg-white px-2.5 text-[11px] font-semibold text-primary-600 shadow-sm active:scale-95"
                  aria-label="Back to search"
                  title="Clear result and edit search"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMobileCard("peek")}
                  className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-ink-300/20 bg-white px-2.5 text-[11px] font-semibold text-ink-700 shadow-sm active:scale-95"
                  aria-label="Collapse"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  Hide
                </button>
              )}
            </div>

            {result ? (
              <>
                {MiniBento}
                {mode === "budget" && (
                  <CalculationPanel
                    route={result.routes[selectedIdx] ?? result.recommended}
                    graph={result.graph}
                    mode={mode}
                  />
                )}
                {result.routes.length > 1 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between px-1 text-[9px] font-semibold uppercase tracking-wider text-ink-500">
                      <span>All routes</span>
                      <span className="text-ink-300 normal-case tracking-normal">
                        {result.routes.length}
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto pr-0.5">
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
                <div className="px-1 text-[9px] uppercase tracking-wider text-ink-300">
                  Source: {result.source} · {result.graph.junctions.length}{" "}
                  junctions · {result.graph.edges.length} edges
                  {result.realRoads?.some(Boolean) && " · real road ✓"}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-white/60 bg-white/70 p-3 text-[11px] text-ink-700">
                <div className="font-semibold text-primary-600">How to start</div>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 leading-snug">
                  <li>Tap the search bar above and pick an origin.</li>
                  <li>Choose a destination, or pick a hardcoded pair.</li>
                  <li>Switch to <span className="font-semibold">Budget</span> to see the W calculation.</li>
                  <li>Hit <span className="font-semibold">Find</span>.</li>
                </ol>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // ============================
  // Full-screen loading overlay (clear "system is loading" indicator)
  // ============================
  const LoadingOverlay = loading && (
    <div className="pointer-events-auto absolute inset-0 z-[1100] flex flex-col items-center justify-center gap-3 bg-black/35 backdrop-blur-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-[0_8px_28px_rgba(223,0,89,0.35)]">
        <Loader2 className="h-7 w-7 animate-spin text-primary-500" strokeWidth={2.4} />
      </div>
      <div className="rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-ink-900 shadow-lg">
        Finding the best route…
      </div>
      <div className="text-[10px] font-medium text-white/90">
        Crunching {mode === "time" ? "time" : "budget"} weights across {result?.graph.junctions.length ?? "the"} junctions
      </div>
    </div>
  );

  // ============================
  // Mobile
  // ============================
  if (responsive === "mobile") {
    return (
      <>
        <SplashScreen />
        <PhoneFrame>
        <RealMap
          ref={mapRef}
          graph={result?.graph ?? { junctions: [], edges: [] }}
          selectedPath={selectedRoute?.path ?? null}
          alternativePaths={alternativePaths}
          originLabel={origin || "Origin"}
          destinationLabel={destination || "Destination"}
          maptilerKey={maptilerKey}
          layer={layer}
          pinkFilter={pinkFilter}
          userLocation={userLocation}
          onMapClick={handleMapClick}
          mode={mode}
        />
            <SearchBar
              origin={origin}
              destination={destination}
              onChangeOrigin={(v) => {
                setOrigin(v);
                setActivePairId(null);
              }}
              onChangeDestination={(v) => {
                setDestination(v);
                setActivePairId(null);
              }}
              onSwap={handleSwap}
              onClear={handleClear}
              onPickPair={pickPair}
              onFind={handleFind}
              canFind={canFind}
              loading={loading}
              hasResult={!!result}
            />
        {RightControls}
        {MobileFloatingCard}
        {LoadingOverlay}
        {pickOnMapHint && (
          <div className="pointer-events-none absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-full bg-primary-500 px-4 py-2 text-[11px] font-semibold text-white shadow-[0_4px_16px_rgba(223,0,89,0.35)]">
            Tap the map to set your origin
          </div>
        )}
        {result && (
          <RouteDetailsModal
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            result={result}
            selectedIdx={selectedIdx}
            onSelectRoute={(i) => setSelectedIdx(i)}
            customContent={
              <RouteDetailsPanel
                route={result.routes[selectedIdx] ?? result.recommended}
                graph={result.graph}
                stats={result.stats}
                realRoad={selectedRealRoad}
              />
            }
          />
        )}
      </PhoneFrame>
      </>
    );
  }

  // ============================
  // Desktop — collapsible floating right rail
  // ============================
  const DesktopRail = (
    <aside
      className={
        "relative z-20 flex h-full shrink-0 flex-col border-l border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(255,255,255,0.86)_100%)] backdrop-blur-xl transition-[width] duration-300 " +
        (desktopRail === "collapsed" ? "w-12" : "w-[340px]")
      }
    >
      {/* Collapse toggle pinned to top */}
      <button
        type="button"
        onClick={() =>
          setDesktopRail((p) => (p === "collapsed" ? "expanded" : "collapsed"))
        }
        className="absolute -left-3 top-1/2 z-30 flex h-8 w-6 -translate-y-1/2 items-center justify-center rounded-l-full border border-r-0 border-white/60 bg-white text-primary-500 shadow-[0_2px_8px_rgba(82,63,160,0.18)]"
        aria-label={desktopRail === "collapsed" ? "Expand panel" : "Collapse panel"}
      >
        {desktopRail === "collapsed" ? (
          <ChevronLeft className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>

      {desktopRail === "collapsed" ? (
        <div className="flex h-full flex-col items-center gap-3 py-3">
          <Image
            src="/asset/jjlogo.PNG"
            alt="JJ"
            width={28}
            height={28}
            className="h-7 w-7 rounded-md object-cover"
          />
        </div>
      ) : (
        <>
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-ink-300/10 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <Image
                src="/asset/jjlogo.PNG"
                alt="JimatJourney"
                width={24}
                height={24}
                className="h-6 w-6 shrink-0 rounded-md object-cover"
              />
              <h1 className="truncate text-sm font-bold text-ink-900">
                JimatJourney
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {result && (
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setError(null);
                    setSelectedIdx(0);
                    setDetailsOpen(false);
                  }}
                  className="flex h-6 items-center gap-1 rounded-full border border-primary-200 bg-white px-2 text-[10px] font-semibold text-primary-600 shadow-sm active:scale-95"
                  aria-label="Back to search"
                  title="Clear result and edit search"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Edit
                </button>
              )}
              <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-[9px] font-semibold text-primary-600">
                β = {mode === "time" ? "0.5" : "2.5"}
              </span>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {error && <ErrorBanner message={error} />}
            {MiniBento}

            {result && (
              <CalculationPanel
                route={result.routes[selectedIdx] ?? result.recommended}
                graph={result.graph}
                mode={mode}
              />
            )}

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

            <div className="rounded-2xl border border-white/60 bg-white/70 p-2.5">
              <PriorityToggle mode={mode} onChange={setMode} />
            </div>

            {!result && (
              <div className="rounded-2xl border border-white/60 bg-white/70 p-3 text-[10px] text-ink-700">
                <div className="font-semibold text-primary-600">
                  Pick a route
                </div>
                <p className="mt-1 leading-snug">
                  Use the search bar above to pick a hardcoded pair or type
                  any other place.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );

  return (
    <>
      <SplashScreen />
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
            layer={layer}
            pinkFilter={pinkFilter}
            userLocation={userLocation}
            onMapClick={handleMapClick}
            mode={mode}
          />
          <SearchBar
            origin={origin}
            destination={destination}
            onChangeOrigin={setOrigin}
            onChangeDestination={setDestination}
            onSwap={handleSwap}
            onClear={handleClear}
            onPickPair={pickPair}
            onFind={handleFind}
            canFind={canFind}
            loading={loading}
            hasResult={!!result}
          />
          {RightControls}
          {LoadingOverlay}
          {pickOnMapHint && (
            <div className="pointer-events-none absolute left-1/2 top-24 z-40 -translate-x-1/2 rounded-full bg-primary-500 px-4 py-2 text-[11px] font-semibold text-white shadow-[0_4px_16px_rgba(223,0,89,0.35)]">
              Tap the map to set your origin
            </div>
          )}
        </div>
        {DesktopRail}
      </div>
      {result && (
        <RouteDetailsModal
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          result={result}
          selectedIdx={selectedIdx}
          onSelectRoute={(i) => setSelectedIdx(i)}
          customContent={
            <RouteDetailsPanel
              route={result.routes[selectedIdx] ?? result.recommended}
              graph={result.graph}
              stats={result.stats}
              realRoad={selectedRealRoad}
            />
          }
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
