import Link from "next/link";
import { Clock, Wallet, ArrowRight } from "lucide-react";
import { StatusBar } from "@/components/ui/StatusBar";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { GlassCard } from "@/components/ui/GlassCard";

export default function LandingPage() {
  return (
    <PhoneFrame>
      <StatusBar tone="dark" />
      <div
        className="relative flex flex-1 flex-col items-center px-6 pt-10 pb-12"
        style={{ background: "var(--grad-splash)" }}
      >
        <div className="mt-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-[0_12px_32px_rgba(204,13,90,0.18)]">
          <span className="text-2xl font-black tracking-tight text-primary-500">
            IEP
          </span>
        </div>
        <h1 className="mt-8 text-center text-3xl font-bold text-ink-900">
          Interstate
          <br />
          Expedition Planner
        </h1>
        <p className="mt-3 max-w-[300px] text-center text-sm text-ink-700">
          Find the optimal route between UTHM Parit Raja and Masjid Sri
          Sendayan, balancing travel time and toll cost using graph theory.
        </p>

        <div className="mt-8 w-full space-y-3">
          <Link
            href="/planner"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[image:var(--grad-cta)] text-base font-semibold text-white shadow-[0_8px_24px_rgba(223,0,89,0.35)] active:scale-95 transition-transform"
          >
            Plan my trip
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/about"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full border border-white/70 bg-white/60 text-base font-semibold text-ink-900 backdrop-blur active:scale-95 transition-transform"
          >
            How it works
          </Link>
        </div>

        <GlassCard className="mt-8 w-full p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-primary-50/70 p-3">
              <Clock
                className="h-5 w-5 text-primary-500"
                strokeWidth={2.4}
              />
              <div className="mt-2 text-sm font-semibold text-ink-900">
                Time-Optimized
              </div>
              <div className="mt-0.5 text-xs text-ink-500">
                β = 0.5 · ignores tolls
              </div>
            </div>
            <div className="rounded-2xl bg-primary-100/60 p-3">
              <Wallet
                className="h-5 w-5 text-primary-600"
                strokeWidth={2.4}
              />
              <div className="mt-2 text-sm font-semibold text-ink-900">
                Budget-Optimized
              </div>
              <div className="mt-0.5 text-xs text-ink-500">
                β = 2.5 · avoids tolls
              </div>
            </div>
          </div>
        </GlassCard>

        <p className="mt-auto pt-8 text-center text-xs text-ink-500">
          Built for BIK10602 · Discrete Structure
          <br />
          Graph Theory · Shortest Path
        </p>
      </div>
    </PhoneFrame>
  );
}
