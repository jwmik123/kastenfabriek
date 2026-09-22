import { NextResponse } from "next/server";

import { clampRange, getAvailability } from "@/lib/showroom/query";

export const dynamic = "force-dynamic";

/** GET /api/showroom/availability?from=YYYY-MM-DD&to=YYYY-MM-DD → days with bookable slots. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const { from, to } = clampRange(url.searchParams.get("from"), url.searchParams.get("to"));
  const days = await getAvailability(from, to);
  return NextResponse.json({ from, to, days }, { headers: { "Cache-Control": "no-store" } });
}
