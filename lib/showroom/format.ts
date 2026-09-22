/** Dutch wording for a booked slot: "zaterdag 28 november 2026, 10:00–11:00". */
export function formatSlotNl(date: string, start: string, end?: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  const day = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
  return end ? `${day}, ${start}–${end}` : `${day}, ${start}`;
}

/** Just the day: "woensdag 23 september 2026". */
export function formatDateNl(date: string): string {
  return formatSlotNl(date, "").replace(/,\s*$/, "");
}

/** Sentence case for a Dutch date at the start of a line. */
export function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
