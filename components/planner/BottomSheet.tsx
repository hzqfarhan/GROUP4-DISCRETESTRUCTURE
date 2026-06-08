"use client";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type Snap = "collapsed" | "half" | "full";

const HEIGHTS: Record<Snap, string> = {
  collapsed: "h-[180px]",
  half: "h-[58%]",
  full: "h-[92%]",
};

interface BottomSheetProps {
  snap: Snap;
  onSnapChange: (s: Snap) => void;
  children: ReactNode;
}

export function BottomSheet({ snap, onSnapChange, children }: BottomSheetProps) {
  const startY = useRef<number | null>(null);
  const startSnap = useRef<Snap>(snap);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    startSnap.current = snap;
  }, [snap]);

  const SNAP_ORDER: Snap[] = ["collapsed", "half", "full"];

  function nextSnap(direction: "up" | "down", current: Snap): Snap {
    const i = SNAP_ORDER.indexOf(current);
    if (direction === "up") return SNAP_ORDER[Math.min(i + 1, 2)]!;
    return SNAP_ORDER[Math.max(i - 1, 0)]!;
  }

  function onPointerDown(e: React.PointerEvent) {
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startY.current == null) return;
    setDragOffset(startY.current - e.clientY);
  }
  function onPointerUp() {
    if (startY.current == null) return;
    const dy = -dragOffset;
    if (Math.abs(dy) > 60) {
      onSnapChange(nextSnap(dy > 0 ? "up" : "down", startSnap.current));
    }
    startY.current = null;
    setDragOffset(0);
  }

  return (
    <div
      className={
        "absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl border-t border-white/60 " +
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.85)_100%)] " +
        "backdrop-blur-xl backdrop-saturate-150 " +
        "shadow-[0_-12px_32px_rgba(82,63,160,0.12)] " +
        "transition-[height] duration-300 ease-out " +
        HEIGHTS[snap]
      }
      style={{ transform: `translateY(${-dragOffset * 0.15}px)` }}
    >
      <div
        className="flex h-6 w-full items-center justify-center pt-2 pb-1"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="h-1.5 w-12 rounded-full bg-ink-300/60" />
      </div>
      <div className="h-[calc(100%-1.5rem)] overflow-y-auto px-4 pb-6">
        {children}
      </div>
    </div>
  );
}
