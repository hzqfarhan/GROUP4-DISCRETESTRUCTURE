import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { InstallPrompt } from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "Interstate Expedition Planner",
  description:
    "IEP — find the optimal route between UTHM Parit Raja and Masjid Sri Sendayan with time- or budget-optimized Dijkstra routing.",
  applicationName: "IEP",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IEP",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6b3cff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-surface-base text-ink-900">
        {children}
        <ServiceWorkerRegistrar />
        <InstallPrompt />
      </body>
    </html>
  );
}
