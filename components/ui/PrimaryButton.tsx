"use client";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
  size?: "md" | "sm";
}

export function PrimaryButton({
  loading = false,
  disabled,
  children,
  className = "",
  size = "md",
  ...rest
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  const sizing =
    size === "sm" ? "h-8 px-3 text-[11px]" : "h-12 text-sm";
  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={
        "group relative flex w-full items-center justify-center gap-2 " +
        sizing +
        " rounded-full font-semibold text-white " +
        "bg-[image:var(--grad-cta)] " +
        "shadow-[0_6px_18px_rgba(107,60,255,0.30)] " +
        "transition-transform duration-200 active:scale-95 " +
        (isDisabled
          ? "opacity-60"
          : "hover:scale-[1.01]") +
        " " +
        className
      }
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Planning…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
