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
        { icon: Apple, color: "text-primary-500", label: "food" },
        { icon: Trophy, color: "text-primary-500", label: "sports" },
        { icon: Home, color: "text-primary-500", label: "home" },
      ].map(({ icon: Icon, color, label }) => (
        <button
          key={label}
          type="button"
          onClick={() => onTap(label)}
          className={
            "flex h-11 w-11 items-center justify-center rounded-full bg-white " +
            "shadow-[0_4px_14px_rgba(204,13,90,0.20)] active:scale-95 transition-transform"
          }
          aria-label={label}
        >
          <Icon className={`h-5 w-5 ${color}`} strokeWidth={2.2} />
        </button>
      ))}
    </div>
  );
}
