import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JimatJourney",
    short_name: "JJ",
    description:
      "Find the optimal route between UTHM Parit Raja and Masjid Sri Sendayan (or any other place) using graph theory + Dijkstra.",
    start_url: "/planner",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFAFA",
    theme_color: "#DF0059",
    categories: ["navigation", "travel"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/asset/jjlogo.PNG",
        sizes: "1080x1080",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
