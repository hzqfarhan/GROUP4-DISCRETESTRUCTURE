async function main() {
  const r = await fetch("http://localhost:3939/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin: "UTHM Parit Raja", destination: "Masjid Selat Melaka", mode: "time" }),
  }).then((r) => r.json());
  for (let i = 0; i < r.realRoads.length; i++) {
    const g = r.realRoads[i]?.geometry ?? [];
    if (g.length < 2) { console.log(`route ${i+1}: no geometry (n=${g.length})`); continue; }
    const lats = g.map(c => c.lat);
    const lngs = g.map(c => c.lng);
    const latSpan = Math.max(...lats) - Math.min(...lats);
    const lngSpan = Math.max(...lngs) - Math.min(...lngs);
    console.log(`route ${i+1}: geom=${g.length} pts, latSpan=${latSpan.toFixed(3)}deg, lngSpan=${lngSpan.toFixed(3)}deg, OK(<=2)=${latSpan <= 2 && lngSpan <= 2}`);
  }
}
main().catch(console.error);
