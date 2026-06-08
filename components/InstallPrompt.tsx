"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("iep-install-dismissed") === "1";
  });
  const [installed, setInstalled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error - iOS Safari
      window.navigator.standalone === true;
    return isStandalone;
  });

  useEffect(() => {
    if (installed) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [installed]);

  if (installed || dismissed || !evt) return null;

  async function handleInstall() {
    if (!evt) return;
    await evt.prompt();
    const choice = await evt.userChoice;
    if (choice.outcome === "dismissed") {
      sessionStorage.setItem("iep-install-dismissed", "1");
    }
    setEvt(null);
  }

  return (
    <div className="pointer-events-auto fixed bottom-24 left-3 right-3 z-50 flex items-center gap-3 rounded-2xl border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.85)_100%)] p-3 shadow-[0_8px_24px_rgba(82,63,160,0.18)] backdrop-blur-xl md:left-auto md:right-6 md:max-w-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
        <Download className="h-5 w-5 text-primary-500" strokeWidth={2.4} />
      </span>
      <div className="flex-1">
        <div className="text-sm font-semibold text-ink-900">
          Install IEP
        </div>
        <div className="text-xs text-ink-500">
          Add to home screen for offline access
        </div>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        className="h-9 rounded-full bg-[image:var(--grad-cta)] px-4 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(107,60,255,0.35)] active:scale-95"
      >
        Install
      </button>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem("iep-install-dismissed", "1");
          setDismissed(true);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:text-ink-900"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
