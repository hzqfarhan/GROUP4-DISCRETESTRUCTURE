import { NextResponse } from "next/server";
import { searchPlaces } from "@/lib/routing/geocode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  if (!q.trim() || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }
  try {
    const results = await searchPlaces(q);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Geocode failed" },
      { status: 502 },
    );
  }
}
