// Local smoke that calls the in-process logic (no server) to inspect all routes.
import { findAllRoutes } from "../lib/graph/dijkstra";
import { UTHM_MELAKA_GRAPH, UTHM_MELAKA_PAIR } from "../lib/graph/uthm-melaka";

const { originId, destinationId } = UTHM_MELAKA_PAIR;

for (const mode of ["time", "budget"] as const) {
  const routes = findAllRoutes(UTHM_MELAKA_GRAPH, originId, destinationId, mode, 10);
  console.log(`\n=== ${mode.toUpperCase()} (β=${mode === "time" ? 0.5 : 2.5}) ===`);
  console.log(`Found ${routes.length} routes:`);
  routes.forEach((r, i) => {
    console.log(
      `  ${i + 1}. W=${r.totalWeight} dist=${r.totalDistanceKm}km time=${r.totalTimeMin}min toll=RM${r.totalTollRM}`,
    );
    console.log(`     ${r.path.join(" → ")}`);
  });
}

export {};
