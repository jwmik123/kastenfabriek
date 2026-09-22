import "server-only";

import { and, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { showroomAppointment } from "@/db/schema";
import type { BookingCount } from "./availability";

/** Confirmed bookings per slot in [from, to], for the availability maths. */
export async function countBookings(from: string, to: string): Promise<BookingCount[]> {
  try {
    return await queryCounts(from, to);
  } catch (err) {
    // A missing table (migration not run yet) or a DB hiccup must not take the
    // homepage down; the calendar then shows the schedule without bookings.
    console.error("Showroom bookings could not be read:", err);
    return [];
  }
}

async function queryCounts(from: string, to: string): Promise<BookingCount[]> {
  const rows = await db
    .select({
      date: showroomAppointment.date,
      startTime: showroomAppointment.startTime,
      count: sql<number>`count(*)::int`,
    })
    .from(showroomAppointment)
    .where(
      and(
        eq(showroomAppointment.status, "confirmed"),
        gte(showroomAppointment.date, from),
        lte(showroomAppointment.date, to),
      ),
    )
    .groupBy(showroomAppointment.date, showroomAppointment.startTime);
  return rows.map((r) => ({ date: r.date, startTime: r.startTime, count: Number(r.count) }));
}
