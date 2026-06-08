"use client";
import { useState } from "react";
import { Info, ChevronDown } from "lucide-react";
import type { OptimizationMode } from "@/lib/graph/types";
import { getBeta } from "@/lib/graph/weight";

interface FormulaExplainerProps {
  mode: OptimizationMode;
}

export function FormulaExplainer({ mode }: FormulaExplainerProps) {
  const [open, setOpen] = useState(false);
  const beta = getBeta(mode);
  return (
    <div className="mt-4 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Info className="h-4 w-4 text-primary-500" strokeWidth={2.4} />
          How the math works
        </span>
        <ChevronDown
          className={
            "h-4 w-4 text-ink-500 transition-transform " + (open ? "rotate-180" : "")
          }
        />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <pre className="rounded-xl bg-primary-50/70 p-3 text-xs text-primary-700 overflow-x-auto">
{`W = Time + (Toll × β) + Penalty

Current β = ${beta}  (${mode === "time" ? "Time-Optimized" : "Budget-Optimized"})

Example: Ayer Hitam → Seremban Tol (highway)
  Time      = 110 min
  Toll      = RM 24.50
  Penalty   = 0   min
  W(${mode}) = 110 + (24.50 × ${beta}) + 0
            = ${(110 + 24.5 * beta).toFixed(2)}`}
          </pre>
          <p className="mt-2 text-xs text-ink-500">
            A lower W means a &ldquo;cheaper&rdquo; edge for the algorithm.
            In Time mode, tolls barely affect the score (β=0.5).
            In Budget mode, tolls dominate (β=2.5), pushing the
            algorithm toward the toll-free Federal Route 1.
          </p>
        </div>
      )}
    </div>
  );
}
