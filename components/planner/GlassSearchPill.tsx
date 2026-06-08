"use client";
import { MapPin, ArrowLeftRight, X } from "lucide-react";

interface GlassSearchPillProps {
  origin: string;
  destination: string;
  subline: string;
  onSwap: () => void;
  onClear: () => void;
}

export function GlassSearchPill({
  origin,
  destination,
  subline,
  onSwap,
  onClear,
}: GlassSearchPillProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.85)_0%,rgba(255,255,255,0.7)_100%)] px-3 py-2 backdrop-blur-xl shadow-[0_4px_16px_rgba(82,63,160,0.10)]">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50">
        <MapPin className="h-3.5 w-3.5 text-primary-500" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold text-ink-900">
          {origin}{" "}
          <ArrowLeftRight className="inline h-3 w-3 text-ink-300" />{" "}
          {destination}
        </div>
        <div className="truncate text-[10px] text-ink-500 tabular-nums">
          {subline}
        </div>
      </div>
      <button
        type="button"
        onClick={onSwap}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-ink-500 active:scale-95"
        aria-label="Swap"
        title="Swap origin and destination"
      >
        <ArrowLeftRight className="h-3.5 w-3.5" strokeWidth={2.2} />
      </button>
      <button
        type="button"
        onClick={onClear}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-ink-500 active:scale-95"
        aria-label="Reset"
        title="Reset"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.4} />
      </button>
    </div>
  );
}
