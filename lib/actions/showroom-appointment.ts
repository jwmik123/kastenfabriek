"use server";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { showroomAppointment } from "@/db/schema";
import { getShowroomSettings } from "@/sanity/lib/showroom";
import { getSiteSettings } from "@/sanity/lib/siteSettings";
import { formatShowroomAddress } from "@/components/ShowroomCta";
import { sendShowroomAppointmentEmails } from "@/lib/email/resend";
import { findBookableSlot, isIsoDate, isTime } from "@/lib/showroom/availability";

export type ShowroomAppointmentInput = {
  date: string;
  start: string;
  name: string;
  email: string;
  phone: string;
  note?: string;
  // Honeypot — must stay empty (bots fill it).
  company?: string;
};

export type ShowroomAppointmentResult =
  | { ok: true; date: string; start: string; end: string }
  | { ok: false; code: "invalid" | "slot-taken" | "closed"; error: string };

function clean(v: string | undefined): string {
  return (v ?? "").trim();
}

/**
 * Book one showroom slot. The slot is re-checked inside a transaction that
 * holds a per-slot advisory lock, so two customers racing for the last place
 * cannot both get it: the second one sees `slot-taken` and a fresh list.
 */
export async function createShowroomAppointment(
  input: ShowroomAppointmentInput,
): Promise<ShowroomAppointmentResult> {
  // Honeypot: silently succeed so bots get no signal, but persist nothing.
  if (clean(input.company)) {
    return { ok: true, date: input.date, start: input.start, end: input.start };
  }

  const date = clean(input.date);
  const start = clean(input.start);
  const name = clean(input.name);
  const email = clean(input.email).toLowerCase();
  const phone = clean(input.phone);
  const note = clean(input.note).slice(0, 1000) || null;

  if (!isIsoDate(date) || !isTime(start)) {
    return { ok: false, code: "invalid", error: "Kies een dag en tijd." };
  }
  if (!name || !email || !phone) {
    return { ok: false, code: "invalid", error: "Vul je naam, e-mailadres en telefoonnummer in." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, code: "invalid", error: "Vul een geldig e-mailadres in." };
  }
  if (phone.replace(/\D/g, "").length < 8) {
    return { ok: false, code: "invalid", error: "Vul een geldig telefoonnummer in." };
  }

  const config = await getShowroomSettings();
  if (!config || config.enabled === false) {
    return { ok: false, code: "closed", error: "Afspraken maken is op dit moment niet mogelijk." };
  }

  const id = crypto.randomUUID();
  const now = new Date();

  const booked = await db.transaction(async (tx) => {
    // One lock per slot: bookings for other slots are not held up.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${date} ${start}`}))`);
    const bookings = await tx
      .select({
        date: showroomAppointment.date,
        startTime: showroomAppointment.startTime,
        count: sql<number>`count(*)::int`,
      })
      .from(showroomAppointment)
      .where(
        and(
          eq(showroomAppointment.status, "confirmed"),
          eq(showroomAppointment.date, date),
          eq(showroomAppointment.startTime, start),
        ),
      )
      .groupBy(showroomAppointment.date, showroomAppointment.startTime);
    const slot = findBookableSlot({
      config,
      bookings: bookings.map((b) => ({ ...b, count: Number(b.count) })),
      date,
      start,
      now,
    });
    if (!slot) return null;
    await tx.insert(showroomAppointment).values({
      id,
      status: "confirmed",
      date,
      startTime: slot.start,
      endTime: slot.end,
      name,
      email,
      phone,
      note,
    });
    return slot;
  });

  if (!booked) {
    return {
      ok: false,
      code: "slot-taken",
      error: "Dit tijdslot is zojuist geboekt of niet meer beschikbaar. Kies een ander moment.",
    };
  }

  // Emails are best-effort — the booking is already persisted.
  try {
    const site = await getSiteSettings();
    await sendShowroomAppointmentEmails({
      customerEmail: email,
      appointment: {
        name,
        email,
        phone,
        note,
        date,
        start: booked.start,
        end: booked.end,
        addressLine: formatShowroomAddress(site.address),
        confirmationText: config.confirmationText,
      },
    });
  } catch (err) {
    console.error("Failed to send showroom appointment emails:", err);
  }

  return { ok: true, date, start: booked.start, end: booked.end };
}
