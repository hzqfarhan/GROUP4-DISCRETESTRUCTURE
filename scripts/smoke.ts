// Quick smoke test of graph logic — run with: npx tsx scripts/smoke.ts
import { findAllRoutes, dijkstra } from "../lib/graph/dijkstra";
import { UTHM_SENDAYAN_GRAPH, UTHM_SENDAYAN_PAIR } from "../lib/graph/uthm-sendayan";

const { originId, destinationId } = UTHM_SENDAYAN_PAIR;

console.log("=== Time-Optimized (β=0.5) ===");
const tRoutes = findAllRoutes(UTHM_SENDAYAN_GRAPH, originId, destinationId, "time", 5);
tRoutes.forEach((r, i) =>
  console.log(
    `${i + 1}. W=${r.totalWeight} dist=${r.totalDistanceKm}km time=${r.totalTimeMin}min toll=RM${r.totalTollRM}\n   ${r.path.join(" -> ")}`,
  ),
);

console.log("\n=== Budget-Optimized (β=2.5) ===");
const bRoutes = findAllRoutes(UTHM_SENDAYAN_GRAPH, originId, destinationId, "budget", 5);
bRoutes.forEach((r, i) =>
  console.log(
    `${i + 1}. W=${r.totalWeight} dist=${r.totalDistanceKm}km time=${r.totalTimeMin}min toll=RM${r.totalTollRM}\n   ${r.path.join(" -> ")}`,
  ),
);

console.log("\n=== Single Dijkstra (Time) ===");
const single = dijkstra(UTHM_SENDAYAN_GRAPH, originId, destinationId, "time");
console.log("Path:", single?.path.join(" -> "));
console.log("W:", single?.totalWeight);

console.log("\nSanity: there are at least 3 distinct routes →", tRoutes.length >= 3 && bRoutes.length >= 3 ? "OK" : "FAIL");
