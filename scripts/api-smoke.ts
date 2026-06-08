// scripts/api-smoke.ts — start the prod server, hit /api/plan, log results, exit.
import { spawn } from "node:child_process";

const PORT = "3737";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const isWin = process.platform === "win32";
  const server = spawn(isWin ? "npx.cmd" : "npx", ["next", "start", "-p", PORT], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env },
    shell: isWin,
  });
  let booted = false;
  server.stdout.on("data", (b) => {
    const s = b.toString();
    if (s.toLowerCase().includes("ready") || s.toLowerCase().includes("started")) {
      booted = true;
    }
  });
  server.stderr.on("data", (b) => process.stderr.write(b));

  for (let i = 0; i < 30 && !booted; i++) await sleep(500);

  try {
    const res = await fetch(`http://localhost:${PORT}/api/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: "UTHM Parit Raja",
        destination: "Masjid Sri Sendayan",
        mode: "time",
      }),
    });
    if (!res.ok) {
      console.error("API error:", res.status, await res.text());
      return;
    }
    const data = (await res.json()) as any;
    console.log("ROUTES:");
    data.routes.forEach((r: any, i: number) =>
      console.log(
        `  ${i + 1}. W=${r.totalWeight} dist=${r.totalDistanceKm}km time=${r.totalTimeMin}min toll=RM${r.totalTollRM} edges=${r.edgeIds.join(",")}`,
      ),
    );
    console.log("\nREAL ROADS (per route):");
    (data.realRoads ?? []).forEach((rr: any, i: number) => {
      if (rr) console.log(`  ${i + 1}. ${rr.distanceKm} km / ${rr.durationMin} min`);
      else console.log(`  ${i + 1}. (no real road)`);
    });
    console.log("\nSTATS:", data.stats);
  } finally {
    server.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
