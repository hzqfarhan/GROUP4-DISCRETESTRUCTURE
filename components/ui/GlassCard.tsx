import type { ReactNode } from "react";

export function GlassCard({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={
        "rounded-3xl border border-white/60 " +
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.55)_100%)] " +
        "backdrop-blur-xl backdrop-saturate-150 " +
        "shadow-[0_8px_32px_rgba(82,63,160,0.10)] " +
        className
      }
    >
      {children}
    </div>
  );
}
