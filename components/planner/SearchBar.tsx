"use client";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  ArrowLeftRight,
  X,
  MapPin,
  Loader2,
  Sparkles,
  LocateFixed,
} from "lucide-react";
import type { PhotonPlace } from "@/lib/routing/geocode";
import { formatPlaceLabel, reverseGeocode } from "@/lib/routing/geocode";

interface SearchBarProps {
  origin: string;
  destination: string;
  onChangeOrigin: (v: string) => void;
  onChangeDestination: (v: string) => void;
  onSwap: () => void;
  onClear: () => void;
  onPickPair: (id: "sendayan" | "melaka") => void;
  onFind: () => void;
  canFind: boolean;
  loading: boolean;
  hasResult: boolean;
}

const SUGGESTED_PAIRS = [
  { id: "sendayan" as const, o: "UTHM Parit Raja", d: "Masjid Sri Sendayan" },
  { id: "melaka" as const, o: "UTHM Parit Raja", d: "Masjid Selat Melaka" },
];

export function SearchBar({
  origin,
  destination,
  onChangeOrigin,
  onChangeDestination,
  onSwap,
  onClear,
  onPickPair,
  onFind,
  canFind,
  loading,
  hasResult,
}: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<null | "origin" | "destination">(
    null,
  );
  const [originQ, setOriginQ] = useState(origin);
  const [destQ, setDestQ] = useState(destination);
  const [originResults, setOriginResults] = useState<PhotonPlace[]>([]);
  const [destResults, setDestResults] = useState<PhotonPlace[]>([]);
  const [originLoading, setOriginLoading] = useState(false);
  const [destLoading, setDestLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const originAbortRef = useRef<AbortController | null>(null);
  const destAbortRef = useRef<AbortController | null>(null);

  // Keep local query in sync with upstream state.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- mirror upstream prop into local state.
  useEffect(() => setOriginQ(origin), [origin]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- mirror upstream prop into local state.
  useEffect(() => setDestQ(destination), [destination]);

  // Debounced geocoding for origin
  useEffect(() => {
    if (editing === "origin" && originQ.trim().length >= 2) {
      originAbortRef.current?.abort();
      const ac = new AbortController();
      originAbortRef.current = ac;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async loading flag, set inside setTimeout.
      setOriginLoading(true);
      const t = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/geocode?q=${encodeURIComponent(originQ)}`,
            { signal: ac.signal },
          );
          if (!res.ok) {
            setOriginResults([]);
            return;
          }
          const data = (await res.json()) as { results: PhotonPlace[] };
          setOriginResults(data.results);
        } catch {
          // aborted — ignore
        } finally {
          setOriginLoading(false);
        }
      }, 220);
      return () => {
        clearTimeout(t);
        ac.abort();
      };
    }
  }, [originQ, editing]);

  // Debounced geocoding for destination
  useEffect(() => {
    if (editing === "destination" && destQ.trim().length >= 2) {
      destAbortRef.current?.abort();
      const ac = new AbortController();
      destAbortRef.current = ac;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async loading flag, set inside setTimeout.
      setDestLoading(true);
      const t = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/geocode?q=${encodeURIComponent(destQ)}`,
            { signal: ac.signal },
          );
          if (!res.ok) {
            setDestResults([]);
            return;
          }
          const data = (await res.json()) as { results: PhotonPlace[] };
          setDestResults(data.results);
        } catch {
          // aborted — ignore
        } finally {
          setDestLoading(false);
        }
      }, 220);
      return () => {
        clearTimeout(t);
        ac.abort();
      };
    }
  }, [destQ, editing]);

  function pickOrigin(p: PhotonPlace) {
    onChangeOrigin(formatPlaceLabel(p));
    setEditing("destination");
  }
  function pickDest(p: PhotonPlace) {
    onChangeDestination(formatPlaceLabel(p));
    setEditing(null);
  }

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocateError("Geolocation is not supported in this browser.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const place = await reverseGeocode(latitude, longitude);
        if (place) {
          onChangeOrigin(formatPlaceLabel(place));
        } else {
          onChangeOrigin(
            `My location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          );
        }
        setLocating(false);
        setEditing("destination");
      },
      (err) => {
        setLocateError(err.message || "Could not get your location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  const showSuggestions =
    open && editing !== null && (originLoading || destLoading || originResults.length > 0 || destResults.length > 0);
  const showPairChips = open && !hasResult;

  return (
    <div className="pointer-events-auto absolute left-0 right-0 top-3 z-30 pl-14 pr-3 sm:top-4 sm:pl-16 sm:pr-4">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-2">
        {/* Pill */}
        <div
          className={
            "flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full border border-white/60 bg-white/95 pl-4 pr-2 shadow-[0_4px_16px_rgba(82,63,160,0.18)] backdrop-blur-xl transition-all " +
            (open ? "rounded-b-none rounded-t-3xl ring-2 ring-primary-200" : "")
          }
        >
          <button
            type="button"
            onClick={() => {
              setOpen((v) => !v);
              if (!open) setEditing("origin");
            }}
            className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-ink-900"
          >
            {origin || destination
              ? `${origin || "Origin"} → ${destination || "Destination"}`
              : "Search any place in Malaysia…"}
          </button>
          {(origin || destination) && (
            <button
              type="button"
              onClick={() => {
                onClear();
                setOriginQ("");
                setDestQ("");
                setOriginResults([]);
                setDestResults([]);
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-500 hover:bg-primary-50 hover:text-primary-500"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (canFind) {
                onFind();
                setOpen(false);
                return;
              }
              setOpen((v) => !v);
              if (!open) setEditing("origin");
            }}
            disabled={!canFind && !open}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white shadow-[0_2px_8px_rgba(223,0,89,0.30)] active:scale-95 disabled:opacity-60"
            aria-label={canFind ? "Find route" : "Search"}
            title={canFind ? "Find route" : "Search"}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" strokeWidth={2.6} />
            )}
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {open && (
        <div className="rounded-b-3xl border border-t-0 border-white/60 bg-white/95 shadow-[0_12px_32px_rgba(82,63,160,0.18)] backdrop-blur-xl">
          {/* Origin / Destination rows with inline autocomplete */}
          <div className="border-b border-ink-300/10 p-3">
            {/* Origin row */}
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50">
                <MapPin className="h-3.5 w-3.5 text-primary-500" strokeWidth={2.4} />
              </span>
              {editing === "origin" ? (
                <input
                  autoFocus
                  value={originQ}
                  onChange={(e) => setOriginQ(e.target.value)}
                  onFocus={() => setEditing("origin")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onChangeOrigin(originQ);
                      setEditing("destination");
                    } else if (e.key === "Escape") {
                      setEditing(null);
                    }
                  }}
                  className="h-9 flex-1 rounded-full border border-primary-200 bg-white px-3 text-xs font-semibold text-ink-900 focus:border-primary-500 focus:outline-none"
                  placeholder="Type origin place…"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing("origin")}
                  className={
                    "h-9 flex-1 rounded-full px-3 text-left text-xs font-semibold " +
                    (origin
                      ? "bg-white text-ink-900"
                      : "bg-primary-50 text-ink-500 italic")
                  }
                >
                  {origin || "Choose origin…"}
                </button>
              )}
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                title="Use my current location"
                aria-label="Use my current location"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary-500 shadow-sm hover:bg-primary-50 disabled:opacity-60"
              >
                {locating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LocateFixed className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={onSwap}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink-500 shadow-sm hover:text-primary-500"
                aria-label="Swap"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </button>
              {editing === "destination" ? (
                <input
                  autoFocus
                  value={destQ}
                  onChange={(e) => setDestQ(e.target.value)}
                  onFocus={() => setEditing("destination")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onChangeDestination(destQ);
                      setEditing(null);
                    } else if (e.key === "Escape") {
                      setEditing(null);
                    }
                  }}
                  className="h-9 flex-1 rounded-full border border-primary-200 bg-white px-3 text-xs font-semibold text-ink-900 focus:border-primary-500 focus:outline-none"
                  placeholder="Type destination…"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing("destination")}
                  className={
                    "h-9 flex-1 rounded-full px-3 text-left text-xs font-semibold " +
                    (destination
                      ? "bg-white text-ink-900"
                      : "bg-primary-50 text-ink-500 italic")
                  }
                >
                  {destination || "Choose destination…"}
                </button>
              )}
            </div>

            {/* Autocomplete suggestions */}
            {showSuggestions && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-ink-300/10 bg-white">
                {locateError && (
                  <div className="px-3 py-2 text-[11px] text-primary-600">
                    {locateError}
                  </div>
                )}
                {(editing === "origin" ? originResults : destResults).map((p) => (
                  <button
                    key={`${p.osmType}-${p.osmId}-${p.lat}-${p.lng}`}
                    type="button"
                    onClick={() =>
                      editing === "origin" ? pickOrigin(p) : pickDest(p)
                    }
                    className="flex w-full items-center gap-2 border-b border-ink-300/5 px-3 py-2 text-left text-xs last:border-b-0 hover:bg-primary-50"
                  >
                    <MapPin className="h-3 w-3 shrink-0 text-primary-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink-900">
                        {p.name}
                      </span>
                      <span className="block truncate text-[10px] text-ink-500">
                        {[p.city, p.state, p.country]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                  </button>
                ))}
                {(editing === "origin" ? originLoading : destLoading) &&
                  (editing === "origin" ? originResults : destResults)
                    .length === 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-ink-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Searching…
                    </div>
                  )}
                {(editing === "origin" ? originQ : destQ).trim().length >= 2 &&
                  !(
                    editing === "origin" ? originLoading : destLoading
                  ) &&
                  (editing === "origin" ? originResults : destResults).length ===
                    0 && (
                    <div className="px-3 py-2 text-[11px] text-ink-500">
                      No matches — try a different spelling.
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Suggested pairs (only when no result yet) */}
          {showPairChips && (
            <div className="p-3">
              <div className="mb-1.5 flex items-center gap-1 px-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary-600">
                <Sparkles className="h-3 w-3" />
                Quick starts
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {SUGGESTED_PAIRS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onPickPair(p.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-white/60 bg-[linear-gradient(135deg,#df0059_0%,#cc0d5a_100%)] p-2 text-left text-white shadow-[0_2px_8px_rgba(223,0,89,0.25)] active:scale-[0.98]"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <MapPin className="h-3.5 w-3.5 text-white" strokeWidth={2.4} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-semibold text-white">
                        {p.o} → {p.d}
                      </div>
                      <div className="truncate text-[9px] text-white/80">
                        Curated demo route
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer: Find button (when collapsed opened + has inputs) */}
          {open && canFind && (
            <div className="border-t border-ink-300/10 p-3">
              <button
                type="button"
                onClick={() => {
                  onFind();
                  setOpen(false);
                }}
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[image:var(--grad-cta)] text-sm font-semibold text-white shadow-[0_4px_14px_rgba(223,0,89,0.35)] active:scale-95 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" strokeWidth={2.6} />
                )}
                {loading ? "Finding route…" : "Find route"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
