import { SignalHigh, WifiHigh, BatteryFull } from "lucide-react";

export function StatusBar({ tone = "light" }: { tone?: "light" | "dark" }) {
  const fg = tone === "dark" ? "text-white" : "text-ink-900";
  return (
    <div
      className={`relative z-50 flex h-11 w-full items-center justify-between px-6 text-[13px] font-semibold ${fg}`}
    >
      <span className="tabular-nums">9:41</span>
      <div className="flex items-center gap-1.5">
        <SignalHigh className="h-3.5 w-3.5" strokeWidth={2.5} />
        <WifiHigh className="h-3.5 w-3.5" strokeWidth={2.5} />
        <BatteryFull className="h-4 w-4" strokeWidth={2.5} />
      </div>
    </div>
  );
}
