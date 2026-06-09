// Smoke test the new API surface: geocode + plan with maneuvers.
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

const PORT = "4040";

async function main() {
  const isWin = process.platform === "win32";
  const server = spawn(
    isWin ? "npx.cmd" : "npx",
    ["next", "start", "-p", PORT],
    { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env }, shell: isWin },
  );
  let booted = false;
  server.stdout.on("data", (b) => {
    if (b.toString().toLowerCase().includes("started")) booted = true;
  });
  server.stderr.on("data", (b) => process.stderr.write(b));
  for (let i = 0; i < 40 && !booted; i++) await wait(500);

  try {
    // 1) Test geocode
    const geo = await fetch(`http://localhost:${PORT}/api/geocode?q=Kuala`).then(
      (r) => r.json() as Promise<{ results: { name: string; city?: string; lat: number; lng: number }[] }>,
    );
    console.log(`\nGEOCODE /api/geocode?q=Kuala: ${geo.results.length} results`);
    geo.results.slice(0, 3).forEach((r) =>
      console.log(`  - ${r.name}, ${r.city ?? "—"} @ ${r.lat.toFixed(3)}, ${r.lng.toFixed(3)}`),
    );

    // 2) Test plan + maneuvers
    const plan = (await fetch(`http://localhost:${PORT}/api/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: "UTHM Parit Raja",
        destination: "Masjid Sri Sendayan",
        mode: "time",
      }),
    }).then((r) => r.json())) as {
      realRoads: { distanceKm: number; durationMin: number; maneuvers?: unknown[] }[];
    };
    console.log(
      `\nPLAN: ${plan.realRoads.length} routes, first has ${plan.realRoads[0]?.maneuvers?.length ?? 0} maneuvers`,
    );
    if (plan.realRoads[0]?.maneuvers) {
      const ms = plan.realRoads[0].maneuvers as { instruction: string }[];
      console.log("First 3 maneuvers:");
      ms.slice(0, 3).forEach((m) => console.log(`  → ${m.instruction}`));
    }
  } finally {
    server.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
