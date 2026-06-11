// Real-world AI smoke: ask Ollama to build a graph for KL -> Penang.
import { fetchDynamicGraph } from "../lib/ai/ollama";

async function main() {
  const key = process.env.OLLAMA_CLOUD_API_KEY!;
  const model = process.env.OLLAMA_CLOUD_MODEL ?? "minimax-m3";
  const baseUrl = process.env.OLLAMA_CLOUD_BASE_URL ?? "https://ollama.com/v1";

  if (!key) {
    console.error("OLLAMA_CLOUD_API_KEY not set");
    process.exit(1);
  }

  console.log(`Probing: ${baseUrl}/chat/completions (model=${model})`);
  const t0 = Date.now();
  try {
    const graph = await fetchDynamicGraph(
      "Kuala Lumpur",
      "George Town, Penang",
      key,
      model,
      baseUrl,
    );
    const dt = Date.now() - t0;
    console.log(`\n✅ OK in ${dt}ms`);
    console.log(`Junctions (${graph.junctions.length}):`);
    graph.junctions.forEach((j) => console.log(`  - ${j.id}: ${j.name}`));
    console.log(`Edges (${graph.edges.length}):`);
    graph.edges.forEach((e) =>
      console.log(
        `  - ${e.id}: ${e.from} → ${e.to} · ${e.distanceKm}km · ${e.timeMin}m · RM${e.tollRM} · ${e.roadType}`,
      ),
    );
  } catch (e) {
    console.error(`❌ FAILED: ${(e as Error).message}`);
    process.exit(1);
  }
}

main();

export {};
