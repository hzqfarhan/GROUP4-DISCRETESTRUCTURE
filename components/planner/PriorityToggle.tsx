"use client";
import { Clock, Calculator } from "lucide-react";
import type { OptimizationMode } from "@/lib/graph/types";

interface PriorityToggleProps {
  mode: OptimizationMode;
  onChange: (m: OptimizationMode) => void;
}

export function PriorityToggle({ mode, onChange }: PriorityToggleProps) {
  return (
    <div className="flex h-8 w-full rounded-full border border-white/70 bg-white/40 p-0.5 backdrop-blur">
      {(
        [
          {
            key: "time" as const,
            label: "Time",
            icon: Clock,
            accent: "text-primary-600",
          },
          {
            key: "budget" as const,
            label: "Calculation",
            icon: Calculator,
            accent: "text-primary-700",
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
              "flex flex-1 items-center justify-center gap-1 rounded-full text-[11px] font-semibold transition-all " +
              (active
                ? "bg-white text-primary-600 shadow-[0_2px_6px_rgba(204,13,90,0.10)]"
                : "text-ink-500 hover:text-ink-700")
            }
            aria-pressed={active}
          >
            <Icon
              className={"h-3 w-3 " + (active ? accent : "")}
              strokeWidth={2.4}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}
