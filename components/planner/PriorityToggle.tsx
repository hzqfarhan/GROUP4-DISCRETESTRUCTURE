"use client";
import { Clock, Wallet } from "lucide-react";
import type { OptimizationMode } from "@/lib/graph/types";

interface PriorityToggleProps {
  mode: OptimizationMode;
  onChange: (m: OptimizationMode) => void;
}

export function PriorityToggle({ mode, onChange }: PriorityToggleProps) {
  return (
    <div className="flex h-10 w-full rounded-full border border-white/70 bg-white/40 p-1 backdrop-blur">
      {(
        [
          {
            key: "time" as const,
            label: "Time",
            icon: Clock,
            accent: "text-accent-sky",
          },
          {
            key: "budget" as const,
            label: "Budget",
            icon: Wallet,
            accent: "text-accent-amber",
          },
        ]
      ).map(({ key, label, icon: Icon, accent }) => {
        const active = mode === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={
              "flex flex-1 items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition-all " +
              (active
                ? "bg-white text-primary-600 shadow-[0_2px_8px_rgba(82,63,160,0.10)]"
                : "text-ink-500 hover:text-ink-700")
            }
            aria-pressed={active}
          >
            <Icon
              className={"h-3.5 w-3.5 " + (active ? accent : "")}
              strokeWidth={2.4}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}
