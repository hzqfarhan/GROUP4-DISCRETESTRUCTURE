"use client";
import { Apple, Trophy, Home } from "lucide-react";

export function FloatingActionButtons() {
  const onTap = (label: string) => {
    if (typeof window !== "undefined") {
      console.log(`[IEP] FAB tapped: ${label}`);
    }
  };
  return (
    <div className="absolute bottom-44 right-4 z-20 flex flex-col gap-3">
      {[
        { icon: Apple, color: "text-accent-coral", label: "food" },
        { icon: Trophy, color: "text-accent-amber", label: "sports" },
        { icon: Home, color: "text-primary-500", label: "home" },
      ].map(({ icon: Icon, color, label }) => (
        <button
          key={label}
          type="button"
          onClick={() => onTap(label)}
          className={
            "flex h-14 w-14 items-center justify-center rounded-full bg-white " +
            "shadow-[0_8px_24px_rgba(82,63,160,0.18)] active:scale-95 transition-transform"
          }
          aria-label={label}
        >
          <Icon className={`h-6 w-6 ${color}`} strokeWidth={2.2} />
        </button>
      ))}
    </div>
  );
}
