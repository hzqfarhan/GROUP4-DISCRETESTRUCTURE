import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { InstallPrompt } from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "JimatJourney (JJ)",
  description:
    "JJ (JimatJourney) — find the optimal route between UTHM Parit Raja and Masjid Sri Sendayan (or any other place) with time- or budget-optimized Dijkstra routing on real Malaysian roads.",
  applicationName: "JimatJourney",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/asset/jjlogo.PNG", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JimatJourney",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#df0059",
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
