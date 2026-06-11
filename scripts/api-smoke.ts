// scripts/api-smoke.ts — start the prod server, hit /api/plan, log results, exit.
import { spawn } from "node:child_process";

const PORT = process.env.SMOKE_PORT ?? "3939";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface RouteResp {
  totalWeight: number;
  totalDistanceKm: number;
  totalTimeMin: number;
  totalTollRM: number;
  path: string[];
  edgeIds: string[];
}
interface PlanResp {
  routes: RouteResp[];
  realRoads: { distanceKm: number; durationMin: number }[];
  stats: {
    distanceKm: number;
    timeMin: number;
    tollRM: number;
    formattedTime: string;
    beta: number;
    mode: string;
  };
}

async function hitApi(
  origin: string,
  destination: string,
  mode: "time" | "budget",
) {
  const res = await fetch(`http://localhost:${PORT}/api/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin, destination, mode }),
  });
  if (!res.ok) {
    console.error(`API error (${origin}→${destination}):`, res.status, await res.text());
    return null;
  }
  return (await res.json()) as PlanResp;
}

async function main() {
  const isWin = process.platform === "win32";
  const server = spawn(
    isWin ? "npx.cmd" : "npx",
    ["next", "start", "-p", PORT],
    { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env }, shell: isWin },
  );
  let booted = false;
  server.stdout.on("data", (b) => {
    const s = b.toString();
    if (s.toLowerCase().includes("ready") || s.toLowerCase().includes("started"))
      booted = true;
  });
  server.stderr.on("data", (b) => process.stderr.write(b));
  for (let i = 0; i < 40 && !booted; i++) await sleep(500);

  try {
    for (const pair of [
      { o: "UTHM Parit Raja", d: "Masjid Sri Sendayan" },
      { o: "UTHM Parit Raja", d: "Masjid Selat Melaka" },
    ]) {
      for (const mode of ["time", "budget"] as const) {
        const data = await hitApi(pair.o, pair.d, mode);
        if (!data) continue;
        console.log(
          `\n=== ${pair.o} → ${pair.d} · ${mode.toUpperCase()} (β=${data.stats.beta}) ===`,
        );
        data.routes.forEach((r, i) => {
          const rr = data.realRoads[i];
          const realDist = rr ? `${rr.distanceKm} km` : "—";
          const realDur = rr ? `${rr.durationMin} min` : "—";
          console.log(
            `  ${i + 1}. W=${r.totalWeight} dist=${r.totalDistanceKm}km real=${realDist} time=${r.totalTimeMin}min real=${realDur} toll=RM${r.totalTollRM}`,
          );
          console.log(`     ${r.path.join(" → ")}`);
        });
      }
    }
  } finally {
    server.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
