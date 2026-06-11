"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export function SplashScreen() {
  const [hidden, setHidden] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("jj-splash-shown") === "1";
  });
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("jj-splash-shown") === "1") {
      return;
    }
    const startedAt = Date.now();
    const TOTAL = 1300; // ms — long enough to read but snappy
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / TOTAL);
      setProgress(Math.round(t * 100));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        sessionStorage.setItem("jj-splash-shown", "1");
        setLeaving(true);
        setTimeout(() => setHidden(true), 450);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (hidden) return null;

  return (
    <div
      className={
        "jj-splash fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 " +
        (leaving ? "jj-splash-leaving" : "")
      }
      style={{ background: "var(--grad-splash)" }}
      aria-hidden
    >
      <div className="relative flex w-full max-w-sm flex-col items-center gap-5">
        {/* Soft halo behind logo */}
        <div className="jj-splash-halo absolute left-1/2 top-0 -z-10 h-48 w-48 -translate-x-1/2 rounded-full bg-white/50 blur-3xl" />

        {/* Logo with reveal */}
        <div className="jj-splash-logoWrap relative">
          <div className="jj-splash-logo relative h-32 w-32 overflow-hidden rounded-[28px] bg-white shadow-[0_18px_40px_rgba(204,13,90,0.25)] ring-1 ring-white/70">
            <Image
              src="/asset/jjlogo.PNG"
              alt="JimatJourney logo"
              fill
              priority
              sizes="128px"
              className="object-cover"
            />
          </div>
        </div>

        {/* Wordmark */}
        <div className="jj-splash-text text-center">
          <div className="text-3xl font-black tracking-tight text-ink-900">
            JimatJourney
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-primary-600">
            JJ · shortest path planner
          </div>
        </div>

        {/* Tagline */}
        <p className="jj-splash-text max-w-[18rem] text-center text-[11px] leading-relaxed text-ink-700">
          AI-routed trips across Peninsular Malaysia — type any place, get the
          fastest <span className="font-semibold text-primary-600">or</span>{" "}
          cheapest route.
        </p>

        {/* Progress */}
        <div className="jj-splash-text mt-2 flex w-56 flex-col items-center gap-1.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/70 ring-1 ring-white/60">
            <div
              className="jj-splash-bar h-full rounded-full bg-[image:var(--grad-cta)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex w-full items-center justify-between text-[9px] font-semibold uppercase tracking-wider text-ink-500 tabular-nums">
            <span>Loading map</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="jj-splash-foot absolute bottom-6 left-0 right-0 text-center text-[9px] font-semibold uppercase tracking-[0.32em] text-ink-300">
        BIK10602 · Discrete Structure
      </div>

      <style jsx global>{`
        @keyframes jj-splash-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes jj-splash-out {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(1.02); }
        }
        @keyframes jj-logo-reveal {
          0% { opacity: 0; transform: translateY(8px) scale(0.92); }
          60% { opacity: 1; transform: translateY(0) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes jj-text-rise {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes jj-logo-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.035); }
        }
        @keyframes jj-halo-pulse {
          0%, 100% { transform: translate(-50%, 0) scale(1); opacity: 0.45; }
          50% { transform: translate(-50%, 0) scale(1.18); opacity: 0.7; }
        }
        @keyframes jj-bar-shine {
          0% { background-position: -120% 0; }
          100% { background-position: 220% 0; }
        }
        .jj-splash {
          animation: jj-splash-in 0.35s ease-out;
        }
        .jj-splash-leaving {
          animation: jj-splash-out 0.45s ease-in forwards;
          pointer-events: none;
        }
        .jj-splash-logoWrap {
          animation: jj-logo-reveal 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .jj-splash-logo {
          animation: jj-logo-pulse 1.8s ease-in-out 0.6s infinite;
        }
        .jj-splash-halo {
          animation: jj-halo-pulse 2.4s ease-in-out 0.4s infinite;
        }
        .jj-splash-text {
          animation: jj-text-rise 0.5s ease-out 0.25s both;
        }
        .jj-splash-foot {
          animation: jj-text-rise 0.5s ease-out 0.5s both;
        }
        .jj-splash-bar {
          background-image: linear-gradient(
            90deg,
            var(--grad-cta, #df0059) 0%,
            #ff5e8a 45%,
            #df0059 80%
          );
          background-size: 200% 100%;
          animation: jj-bar-shine 1.4s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .jj-splash-logo,
          .jj-splash-halo,
          .jj-splash-bar,
          .jj-splash-logoWrap,
          .jj-splash-text,
          .jj-splash-foot {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
