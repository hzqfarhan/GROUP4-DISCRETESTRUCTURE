"use client";
import { Calculator, Sigma } from "lucide-react";
import type {
  OptimizationMode,
  Route,
  WeightedGraph,
} from "@/lib/graph/types";
import { getBeta, calculateWeight } from "@/lib/graph/weight";
import { GlassCard } from "@/components/ui/GlassCard";

interface CalculationPanelProps {
  route: Route;
  graph: WeightedGraph;
  mode: OptimizationMode;
}

function edgeBetween(graph: WeightedGraph, from: string, to: string) {
  return graph.edges.find(
    (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
  );
}

function junctionName(graph: WeightedGraph, id: string): string {
  return graph.junctions.find((j) => j.id === id)?.name ?? id;
}

function fmt(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, "");
}

export function CalculationPanel({ route, graph, mode }: CalculationPanelProps) {
  const beta = getBeta(mode);
  const modeLabel = mode === "time" ? "Time-Optimized" : "Budget-Optimized";

  // Walk the path edge-by-edge and compute W for each segment.
  const steps: {
    index: number;
    from: string;
    to: string;
    timeMin: number;
    tollRM: number;
    penaltyMin: number;
    w: number;
  }[] = [];
  let runningTotal = 0;
  for (let i = 0; i < route.path.length - 1; i++) {
    const a = route.path[i];
    const b = route.path[i + 1];
    const e = edgeBetween(graph, a, b);
    if (!e) continue;
    const w = calculateWeight(e, mode);
    runningTotal += w;
    steps.push({
      index: i + 1,
      from: a,
      to: b,
      timeMin: e.timeMin,
      tollRM: e.tollRM,
      penaltyMin: e.penaltyMin,
      w,
    });
  }

  return (
    <GlassCard className="p-3">
      <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-500">
        <span className="flex items-center gap-1">
          <Calculator className="h-3 w-3" />
          Step-by-step W calculation
        </span>
        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[9px] font-semibold text-primary-600">
          β = {beta} · {modeLabel}
        </span>
      </div>

      {/* Formula header */}
      <div className="mb-2 rounded-lg bg-primary-50/60 px-2.5 py-1.5 text-[10px] font-mono text-primary-700">
        W = Time + (Toll × β) + Penalty
      </div>

      {steps.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-300/20 p-2 text-[10px] text-ink-500">
          No edges to calculate for this route.
        </div>
      ) : (
        <ol className="space-y-1.5">
          {steps.map((s) => (
            <li
              key={s.index}
              className="rounded-lg border border-ink-300/15 bg-white/60 p-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0 flex-1 text-[11px] font-semibold text-ink-900">
                  <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-white">
                    {s.index}
                  </span>
                  <span className="truncate">
                    {junctionName(graph, s.from)} → {junctionName(graph, s.to)}
                  </span>
                </div>
                <div className="shrink-0 text-[10px] font-bold text-primary-600 tabular-nums">
                  W = {fmt(s.w)}
                </div>
              </div>
              <div className="mt-1 font-mono text-[10px] leading-snug text-ink-700">
                <span className="text-ink-500">W = </span>
                <span>{fmt(s.timeMin)}</span>
                <span className="text-ink-400"> + </span>
                <span>({fmt(s.tollRM)} × {beta})</span>
                <span className="text-ink-400"> + </span>
                <span>{fmt(s.penaltyMin)}</span>
                <span className="text-ink-400"> = </span>
                <span className="font-bold text-primary-600">{fmt(s.w)}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-2 text-[9px] text-ink-500">
                <span>Time: {fmt(s.timeMin)} min</span>
                <span>Toll: RM {fmt(s.tollRM)}</span>
                <span>Penalty: {fmt(s.penaltyMin)} min</span>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* Running total */}
      <div className="mt-2 flex items-center justify-between rounded-lg border border-primary-200/60 bg-primary-50/70 px-2.5 py-1.5">
        <span className="flex items-center gap-1 text-[10px] font-semibold text-primary-700">
          <Sigma className="h-3 w-3" />
          Total weight (Σ W)
        </span>
        <span className="text-[12px] font-bold text-primary-700 tabular-nums">
          {fmt(runningTotal)}
        </span>
      </div>
    </GlassCard>
  );
}
