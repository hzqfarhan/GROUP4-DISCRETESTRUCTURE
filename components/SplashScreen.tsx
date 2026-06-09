"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export function SplashScreen() {
  const [hidden, setHidden] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("jj-splash-shown") === "1";
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("jj-splash-shown") === "1") {
      return;
    }
    const startedAt = Date.now();
    const TOTAL = 1100; // ms — long enough to read but snappy
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / TOTAL);
      setProgress(Math.round(t * 100));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        sessionStorage.setItem("jj-splash-shown", "1");
        setHidden(true);
      }
    };
    let raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (hidden) return null;

  return (
    <div
      className="jj-splash fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: "var(--grad-splash)" }}
      aria-hidden
    >
      <div className="relative flex flex-col items-center gap-4">
        {/* Soft halo behind logo */}
        <div className="jj-splash-halo absolute inset-0 -z-10 m-auto h-56 w-56 rounded-full bg-white/40 blur-3xl" />
        <div className="jj-splash-logo relative h-36 w-36 overflow-hidden rounded-[28px] bg-white shadow-[0_18px_40px_rgba(204,13,90,0.25)]">
          <Image
            src="/asset/jjlogo.PNG"
            alt="JimatJourney logo"
            fill
            priority
            sizes="144px"
            className="object-cover"
          />
        </div>
        <div className="text-center">
          <div className="text-2xl font-black tracking-tight text-ink-900">
            JimatJourney
          </div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-primary-600">
            JJ · shortest path planner
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 w-44 overflow-hidden rounded-full bg-white/60">
          <div
            className="jj-splash-bar h-full rounded-full bg-[image:var(--grad-cta)] transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 tabular-nums">
          Loading map · {progress}%
        </div>
      </div>

      <style jsx global>{`
        @keyframes jj-splash-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes jj-splash-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes jj-logo-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes jj-halo-pulse {
          0%, 100% { transform: scale(1); opacity: 0.45; }
          50% { transform: scale(1.18); opacity: 0.65; }
        }
        .jj-splash {
          animation: jj-splash-in 0.35s ease-out;
        }
        .jj-splash-logo {
          animation: jj-logo-pulse 1.6s ease-in-out infinite;
        }
        .jj-splash-halo {
          animation: jj-halo-pulse 2.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .jj-splash-logo, .jj-splash-halo { animation: none; }
        }
      `}</style>
    </div>
  );
}
