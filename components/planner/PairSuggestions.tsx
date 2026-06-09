"use client";
import { Building2, MapPinned, Sparkles } from "lucide-react";

interface PairSuggestionsProps {
  onPick: (id: "sendayan" | "melaka") => void;
  onTypeOrigin: () => void;
  onTypeDestination: () => void;
}

// Static description metadata for the two hardcoded pairs. Matches
// lib/graph/registry.ts.
const PAIR_META: Record<
  "sendayan" | "melaka",
  { label: string; origin: string; destination: string; tag: string; tone: "sendayan" | "melaka" }
> = {
  sendayan: {
    label: "Masjid Sri Sendayan",
    origin: "UTHM Parit Raja",
    destination: "Masjid Sri Sendayan",
    tag: "highway + federal · 4 routes",
    tone: "sendayan",
  },
  melaka: {
    label: "Masjid Selat Melaka",
    origin: "UTHM Parit Raja",
    destination: "Masjid Selat Melaka (Pulau Melaka)",
    tag: "PLUS / AMJ / FR5 / inland · 6 routes",
    tone: "melaka",
  },
};

const PAIR_ORDER: ("sendayan" | "melaka")[] = ["sendayan", "melaka"];

export function PairSuggestions({
  onPick,
  onTypeOrigin,
  onTypeDestination,
}: PairSuggestionsProps) {
  void onTypeOrigin;
  void onTypeDestination;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 px-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary-600">
        <Sparkles className="h-3 w-3" />
        Suggested routes
      </div>
      <div className="space-y-1.5">
        {PAIR_ORDER.map((id) => {
          const p = PAIR_META[id];
          const isMelaka = p.tone === "melaka";
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPick(id)}
              className={
                "flex w-full items-center gap-2 rounded-xl border p-2 text-left transition-all active:scale-[0.98] " +
                (isMelaka
                  ? "border-primary-200 bg-[linear-gradient(135deg,#df0059_0%,#cc0d5a_100%)] text-white shadow-[0_4px_12px_rgba(223,0,89,0.30)]"
                  : "border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.6)_100%)] text-ink-900 shadow-[0_2px_8px_rgba(82,63,160,0.06)] hover:border-primary-200")
              }
            >
              <span
                className={
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full " +
                  (isMelaka ? "bg-white/20" : "bg-primary-50")
                }
              >
                {isMelaka ? (
                  <MapPinned
                    className="h-3.5 w-3.5 text-white"
                    strokeWidth={2.4}
                  />
                ) : (
                  <Building2
                    className="h-3.5 w-3.5 text-primary-500"
                    strokeWidth={2.4}
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={
                    "truncate text-[11px] font-semibold " +
                    (isMelaka ? "text-white" : "text-ink-900")
                  }
                >
                  {p.origin}
                  <span
                    className={
                      "mx-1 " +
                      (isMelaka ? "text-white/70" : "text-ink-300")
                    }
                  >
                    →
                  </span>
                  {p.destination}
                </div>
                <div
                  className={
                    "mt-0.5 truncate text-[9px] " +
                    (isMelaka ? "text-white/80" : "text-ink-500")
                  }
                >
                  {p.tag}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="px-0.5 pt-1 text-[9px] leading-snug text-ink-500">
        Or click the origin/destination text above to type any place — the AI
        builds a graph and we run Dijkstra on it.
      </p>
    </div>
  );
}
