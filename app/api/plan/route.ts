import { NextResponse } from "next/server";
import { z } from "zod";
import { findAllRoutes } from "@/lib/graph/dijkstra";
import { computeTripStats } from "@/lib/graph/stats";
import { HARDCODED_PAIRS, resolveHardcodedPair } from "@/lib/graph/store";
import { resolveJunctionId, roadTypesForRoute } from "@/lib/graph/resolver";
import { fetchDynamicGraph } from "@/lib/ai/ollama";
import { fetchOsrmRoute } from "@/lib/routing/osrm";
import type {
  PlanResponse,
  RealRoadGeometry,
  Route,
  WeightedGraph,
} from "@/lib/graph/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  mode: z.enum(["time", "budget"]),
  // Optional explicit hardcoded-pair id (e.g. "sendayan" or "melaka") so
  // the user can click a suggestion and the path always resolves even
  // after they edit the displayed name. Accept null too (some clients
  // send null when no pair is active).
  pairId: z
    .union([z.enum(["sendayan", "melaka"]), z.null()])
    .optional()
    .transform((v) => (v ? v : undefined)),
});

function pathCoordsForRoute(
  graph: WeightedGraph,
  route: Route,
): { lat: number; lng: number }[] {
  return route.path
    .map((id) => graph.junctions.find((j) => j.id === id))
    .filter((j): j is NonNullable<typeof j> => Boolean(j && j.lat && j.lng))
    .map((j) => ({ lat: j.lat as number, lng: j.lng as number }));
}

async function routeRealRoad(
  graph: WeightedGraph,
  route: Route,
): Promise<RealRoadGeometry | null> {
  const coords = pathCoordsForRoute(graph, route);
  if (coords.length < 2) return null;
  const r = await fetchOsrmRoute(coords);
  if (!r) return null;
  return {
    distanceKm: Number((r.distanceMeters / 1000).toFixed(2)),
    durationMin: Math.round(r.durationSeconds / 60),
    geometry: r.geometry,
    maneuvers: r.maneuvers,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
      .join("; ");
    return NextResponse.json(
      { error: `Invalid input — ${issues}` },
      { status: 400 },
    );
  }
  const { origin, destination, mode, pairId } = parsed.data;

  let graph: WeightedGraph;
  let source: "hardcoded" | "ai";
  let hardcodedOriginId: string | undefined;
  let hardcodedDestId: string | undefined;

  // Prefer the explicit pairId if the client provides one (e.g. the user
  // clicked a hardcoded suggestion). Fall back to name-based matching,
  // then to the AI generator.
  let hardcoded = pairId
    ? HARDCODED_PAIRS.find((p) => p.id === pairId) ?? null
    : null;
  hardcoded ??= resolveHardcodedPair(origin, destination);
  if (hardcoded) {
    graph = hardcoded.graph;
    source = "hardcoded";
    hardcodedOriginId = hardcoded.originId;
    hardcodedDestId = hardcoded.destinationId;
  } else {
    const apiKey = process.env.OLLAMA_CLOUD_API_KEY;
    const model = process.env.OLLAMA_CLOUD_MODEL ?? "minimax-m3";
    const baseUrl =
      process.env.OLLAMA_CLOUD_BASE_URL ?? "https://ollama.com/v1";
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "AI service is not configured. Set OLLAMA_CLOUD_API_KEY in .env.local.",
        },
        { status: 502 },
      );
    }
    try {
      graph = await fetchDynamicGraph(
        origin,
        destination,
        apiKey,
        model,
        baseUrl,
      );
      source = "ai";
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error ? err.message : "AI upstream failed",
        },
        { status: 502 },
      );
    }
  }

  const originId = hardcodedOriginId ?? resolveJunctionId(graph, origin);
  const destinationId =
    hardcodedDestId ?? resolveJunctionId(graph, destination);

  if (!originId || !destinationId) {
    return NextResponse.json(
      {
        error: `Could not map "${origin}" or "${destination}" to a junction in the returned graph.`,
        graph,
      },
      { status: 400 },
    );
  }

  const routes = findAllRoutes(graph, originId, destinationId, mode, 8);
  if (routes.length === 0) {
    return NextResponse.json(
      { error: "No route found between the given points.", graph },
      { status: 400 },
    );
  }

  const recommended = routes[0]!;
  const stats = computeTripStats(
    recommended,
    mode,
    roadTypesForRoute(graph, recommended),
  );

  const realRoads: (RealRoadGeometry | null)[] = await Promise.all(
    routes.map((r) => routeRealRoad(graph, r)),
  );

  const response: PlanResponse = {
    graph,
    routes,
    recommended,
    stats,
    source,
    realRoad: realRoads[0] ?? null,
    realRoads,
  };
  return NextResponse.json(response);
}
