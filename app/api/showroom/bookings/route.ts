import { NextResponse } from "next/server";

import { countBookings } from "@/lib/showroom/bookings";
import { clampRange } from "@/lib/showroom/query";

export const dynamic = "force-dynamic";

/**
 * GET /api/showroom/bookings?from&to → confirmed bookings per slot, counts only.
 * Read by the Studio calendar preview; carries no names or contact details.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const { from, to } = clampRange(url.searchParams.get("from"), url.searchParams.get("to"));
  const bookings = await countBookings(from, to);
  return NextResponse.json({ from, to, bookings }, { headers: { "Cache-Control": "no-store" } });
}
