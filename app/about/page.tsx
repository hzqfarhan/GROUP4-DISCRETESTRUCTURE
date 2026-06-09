import Link from "next/link";
import { ArrowLeft, GitBranch, Calculator, Sparkles } from "lucide-react";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { GlassCard } from "@/components/ui/GlassCard";
import { MapCanvas } from "@/components/planner/MapCanvas";
import { UTHM_SENDAYAN_GRAPH } from "@/lib/graph/uthm-sendayan";

export default function AboutPage() {
  return (
    <PhoneFrame>
      <div
        className="relative flex flex-1 flex-col"
        style={{ background: "var(--grad-splash)" }}
      >
        <div className="relative z-10 px-4 pt-2">
          <Link
            href="/planner"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-ink-700 backdrop-blur"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative z-10 space-y-4 overflow-y-auto px-4 pb-10 pt-4">
          <header>
            <h1 className="text-2xl font-bold text-ink-900">How it works</h1>
            <p className="mt-1 text-sm text-ink-700">
              Graph theory, the weight formula, and Dijkstra — explained
              plainly.
            </p>
          </header>

          <GlassCard className="p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                <GitBranch className="h-4 w-4" strokeWidth={2.4} />
              </span>
              <h2 className="text-base font-semibold text-ink-900">
                The graph model
              </h2>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
              <li>• <b>Vertices</b> = road junctions (UTHM, Ayer Hitam Tol, …, Masjid Sri Sendayan)</li>
              <li>• <b>Edges</b> = roads connecting junctions (PLUS Highway, Federal Route 1, AMJ, local roads)</li>
              <li>• <b>Undirected</b> — every road is two-way</li>
              <li>• <b>Weighted</b> — every edge carries distance, time, toll, and a road-type penalty</li>
              <li>• <b>Connected</b> — there is a path from any junction to any other</li>
            </ul>
            <div className="relative mt-3 h-56 overflow-hidden rounded-2xl border border-white/60">
              <MapCanvas
                graph={UTHM_SENDAYAN_GRAPH}
                path={null}
                showFullGraph
              />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                <Calculator className="h-4 w-4" strokeWidth={2.4} />
              </span>
              <h2 className="text-base font-semibold text-ink-900">
                The weight formula
              </h2>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-primary-50/70 p-3 text-xs text-primary-700">
{`W = Time + (Toll × β) + Penalty

β (Toll Penalty Factor):
  Time-Optimized:   β = 0.5   (tolls barely matter)
  Budget-Optimized: β = 2.5   (tolls add huge cost)`}
            </pre>
            <table className="mt-3 w-full text-xs">
              <thead>
                <tr className="text-left text-ink-500">
                  <th className="py-1 font-medium">Edge</th>
                  <th className="py-1 font-medium">Time</th>
                  <th className="py-1 font-medium">Toll</th>
                  <th className="py-1 font-medium">W (β=0.5)</th>
                  <th className="py-1 font-medium">W (β=2.5)</th>
                </tr>
              </thead>
              <tbody className="text-ink-700">
                <tr className="border-t border-ink-300/20">
                  <td className="py-1.5">Ayer Hitam → Seremban Tol</td>
                  <td className="py-1.5 tabular-nums">110</td>
                  <td className="py-1.5 tabular-nums">24.50</td>
                  <td className="py-1.5 tabular-nums">122.25</td>
                  <td className="py-1.5 tabular-nums font-semibold text-primary-600">171.25</td>
                </tr>
                <tr className="border-t border-ink-300/20">
                  <td className="py-1.5">UTHM → Yong Peng</td>
                  <td className="py-1.5 tabular-nums">35+8</td>
                  <td className="py-1.5 tabular-nums">0.00</td>
                  <td className="py-1.5 tabular-nums">43</td>
                  <td className="py-1.5 tabular-nums">43</td>
                </tr>
              </tbody>
            </table>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                <Sparkles className="h-4 w-4" strokeWidth={2.4} />
              </span>
              <h2 className="text-base font-semibold text-ink-900">
                Dijkstra, in plain English
              </h2>
            </div>
            <div className="mt-3 space-y-2 text-sm text-ink-700">
              <p>
                1. Start at the origin junction with a tentative distance of
                zero. Every other junction starts at infinity.
              </p>
              <p>
                2. Look at all neighbours reachable from the current
                junction. For each one, compute{" "}
                <span className="font-mono text-primary-600">
                  current + edge.W
                </span>{" "}
                and keep the smaller value.
              </p>
              <p>
                3. Pick the unvisited junction with the smallest tentative
                distance, mark it visited, and repeat.
              </p>
              <p>
                4. Stop when the destination is visited. Walk the{" "}
                <span className="font-mono">prev[]</span> chain backwards to
                reconstruct the shortest path.
              </p>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-primary-50/70 p-3 text-xs text-primary-700">
{`function dijkstra(graph, start, end, mode):
  dist[v] = ∞ for all v
  prev[v] = null for all v
  dist[start] = 0
  heap = min-heap [(0, start)]
  while heap not empty:
    (d, u) = heap.pop()
    if u == end: break
    for each (edge, v) from u:
      w = calculateWeight(edge, mode)
      if dist[u] + w < dist[v]:
        dist[v] = dist[u] + w
        prev[v] = (u, edge)
        heap.push(dist[v], v)
  return reconstruct(prev, end)`}
            </pre>
          </GlassCard>

          <p className="pt-2 text-center text-xs text-ink-500">
            Built for BIK10602 · Discrete Structure · Graph Theory Shortest Path
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
}
