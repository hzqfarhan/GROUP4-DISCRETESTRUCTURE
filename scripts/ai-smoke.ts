// Smoke-test the AI model + OSRM integration with the real env.
// Run: npx tsx scripts/ai-smoke.ts
import { fetchDynamicGraph } from "../lib/ai/ollama";
import { fetchOsrmRoute } from "../lib/routing/osrm";

const apiKey = process.env.OLLAMA_CLOUD_API_KEY;
const model = process.env.OLLAMA_CLOUD_MODEL ?? "minimax-m3";
const baseUrl =
  process.env.OLLAMA_CLOUD_BASE_URL ?? "https://api.ollama.cloud/v1";

if (!apiKey) {
  console.error("OLLAMA_CLOUD_API_KEY not set — skipping AI smoke test");
  process.exit(0);
}

async function main() {
  console.log(`\n=== AI: ${model} ===`);
  const graph = await fetchDynamicGraph(
    "Kuala Lumpur",
    "George Town, Penang",
    apiKey!,
    model,
    baseUrl,
  );
  console.log(`Junctions: ${graph.junctions.length}, Edges: ${graph.edges.length}`);
  console.log("First 3:", graph.junctions.slice(0, 3).map((j) => j.name).join(" → "));

  console.log("\n=== OSRM: KL -> George Town ===");
  const kl = graph.junctions.find((j) => j.name.toLowerCase().includes("kuala"))!;
  const penang = graph.junctions.find((j) => j.name.toLowerCase().includes("george") || j.name.toLowerCase().includes("penang"))!;
  const osrm = await fetchOsrmRoute([
    { lat: kl.lat!, lng: kl.lng! },
    { lat: penang.lat!, lng: penang.lng! },
  ]);
  if (osrm) {
    console.log(`Distance: ${(osrm.distanceMeters / 1000).toFixed(1)} km`);
    console.log(`Duration: ${Math.round(osrm.durationSeconds / 60)} min`);
    console.log(`Polyline points: ${osrm.geometry.length}`);
  } else {
    console.log("OSRM call failed");
  }
}

main().catch((e) => {
  console.error("Smoke test failed:", e);
  process.exit(1);
});
