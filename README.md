# JJ — JimatJourney

A PWA that finds the **optimal travel route** between **UTHM Parit Raja** and
**Masjid Sri Sendayan** (or any other place in Malaysia), with two priority
modes (**Time-Optimized** / **Budget-Optimized**) powered by a hand-implemented
**Dijkstra's algorithm** on an undirected weighted graph. For free-text
origin/destination pairs, the app uses **Photon** for geocoding and **Ollama
Cloud** to generate a route graph, then runs the same Dijkstra locally with
real road geometry from **OSRM**.

Built for the **BIK10602 Discrete Structure** group project.

> **JimatJourney (JJ)** — *Jimat* means "save" in Malay; *Journey* is the trip.
> Save your journey, not your money.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **Hand-written Dijkstra** (no graph libraries) — see `lib/graph/dijkstra.ts`
- **Zod** for validating AI responses and API bodies
- **Ollama Cloud** for non-hardcoded origin/destination pairs
- **PWA**: manifest + service worker for offline support of the hardcoded pair

## Setup

```bash
npm install
cp .env.example .env.local          # then fill in OLLAMA_CLOUD_API_KEY
npm run dev                         # http://localhost:3000
```

> The hardcoded UTHM → Masjid Sri Sendayan pair works **without** any API
> key. The key is only required for free-text origin/destination inputs.

## Scripts

| Command          | What it does                          |
|------------------|---------------------------------------|
| `npm run dev`    | Start the dev server                  |
| `npm run build`  | Production build                      |
| `npm run start`  | Start the production server           |
| `npm run lint`   | Run ESLint                            |
| `npx tsx scripts/smoke.ts` | Smoke-test the graph logic   |

## How the optimization works

Every road edge has four base properties: **distance**, **time**, **toll**,
and a **road-type penalty** (for traffic lights, single lanes, etc.).
At runtime, each edge's "weight" is computed as:

```
W = Time + (Toll × β) + Penalty
```

where the **β (Toll Penalty Factor)** is controlled by the user:

| Mode             | β    | Effect on route choice                    |
|------------------|------|-------------------------------------------|
| Time-Optimized   | 0.5  | Tolls barely matter → PLUS Expressway     |
| Budget-Optimized | 2.5  | Tolls add huge cost → Federal Route 1     |

Dijkstra is then run on the weighted graph. The full graph is also
explored with bounded DFS to surface up to 5 alternative routes, which
are listed in the UI and can be tapped to swap onto the map.

## Project structure

```
app/
  page.tsx              # landing
  planner/page.tsx      # main interactive map + bottom sheet
  about/page.tsx        # graph theory explainer
  api/plan/route.ts     # POST /api/plan
components/
  ui/                   # GlassCard, StatusBar, PhoneFrame, PrimaryButton
  planner/              # MapCanvas, BottomSheet, GlassSearchPill, etc.
lib/
  graph/                # types, hardcoded graph, weight, dijkstra, stats
  ai/ollama.ts          # Zod-validated Ollama Cloud client
public/
  manifest.json, sw.js, icon-*.png
```

## Demo screenshots to capture for the report

1. **Planner with default inputs** — the pastel map with the gradient
   route, glass search pill, and FABs visible.
2. **Time-Optimized result** — recommended route is the PLUS Expressway
   (220 km, 2h 40m, RM 24.50).
3. **Budget-Optimized result** — recommended route is Federal Route 1
   (225 km, 5h 3m, RM 0.00).
4. **SVG map with the gradient purple polyline** — proves the graph
   theory → visualization pipeline.
5. **"How it works" page** — the weight formula + Dijkstra pseudocode.

## Environment variables

| Name                     | Required for    | Default                           |
|--------------------------|-----------------|-----------------------------------|
| `OLLAMA_CLOUD_API_KEY`   | AI fallback     | —                                 |
| `OLLAMA_CLOUD_MODEL`     | AI fallback     | `llama3.1:70b`                    |
| `OLLAMA_CLOUD_BASE_URL`  | AI fallback     | `https://api.ollama.cloud/v1`     |

## Built for BIK10602 · Discrete Structure · Graph Theory Shortest Path
