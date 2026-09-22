import "server-only";

import { getShowroomSettings } from "@/sanity/lib/showroom";
import { countBookings } from "./bookings";
import { addDays, computeAvailability, isIsoDate, localNow, type DayAvailability } from "./availability";

/** Clamp a requested range to something sane: at most ~14 weeks, never in the past. */
export function clampRange(from: unknown, to: unknown, now = new Date()): { from: string; to: string } {
  const today = localNow(now).date;
  const f = isIsoDate(from) && from >= today ? from : today;
  const maxTo = addDays(f, 7 * 14);
  const t = isIsoDate(to) && to >= f ? (to <= maxTo ? to : maxTo) : addDays(f, 7 * 8);
  return { from: f, to: t };
}

/** Availability per day for the homepage calendar. */
export async function getAvailability(from: string, to: string, now = new Date()): Promise<DayAvailability[]> {
  const [config, bookings] = await Promise.all([getShowroomSettings(), countBookings(from, to)]);
  return computeAvailability({ config, bookings, from, to, now });
}
