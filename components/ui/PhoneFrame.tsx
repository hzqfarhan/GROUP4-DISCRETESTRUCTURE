import type { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-surface-base">
      {children}
    </div>
  );
}
