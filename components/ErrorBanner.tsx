"use client";
import { TriangleAlert } from "lucide-react";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-red-200/70 bg-red-50/80 px-3 py-2.5 text-sm text-red-700 backdrop-blur">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
      <span>{message}</span>
    </div>
  );
}
