"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card, Flex, Stack, Text } from "@sanity/ui";
import { useFormValue, type StringInputProps } from "sanity";

import {
  addDays,
  computeAvailability,
  localNow,
  saturdaysBetween,
  toAvailabilityConfig,
  DEFAULTS,
  type BookingCount,
  type ShowroomDocument,
} from "@/lib/showroom/availability";
import { formatDateNl } from "@/lib/showroom/format";

/**
 * Read-only overview inside the Studio: the coming Saturdays exactly as the
 * homepage offers them, one row each, with every time slot and how many
 * places it has left. Reads the document being edited, so unsaved changes show
 * straight away; confirmed bookings come from the site.
 */
export function ShowroomCalendarInput(props: StringInputProps) {
  void props; // the field carries no value; this input only renders the schedule
  const doc = useFormValue([]) as ShowroomDocument | undefined;
  const [bookings, setBookings] = useState<BookingCount[]>([]);
  const [error, setError] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const today = localNow(now).date;
  const weeks = doc?.maxWeeksAhead ?? DEFAULTS.maxWeeksAhead;
  // Before the showroom opens, preview the first weeks after the opening date.
  const from = doc?.bookableFrom && doc.bookableFrom > today ? doc.bookableFrom : today;
  const to = addDays(from, 7 * weeks);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/showroom/bookings?from=${from}&to=${to}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { bookings: BookingCount[] }) => {
        if (!cancelled) setBookings(data.bookings ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Boekingen konden niet worden geladen; alleen de openingstijden worden getoond.");
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const config = useMemo(() => toAvailabilityConfig(doc), [doc]);
  // Preview as if booking were open, so the owner sees the schedule before switching it on.
  const byDate = useMemo(() => {
    const days = computeAvailability({
      config: config ? { ...config, enabled: true, bookableFrom: null } : null,
      bookings,
      from,
      to,
      now: from === today ? now : new Date(`${from}T00:00:00Z`),
    });
    return new Map(days.map((d) => [d.date, d]));
  }, [config, bookings, from, to, today, now]);

  const saturdays = saturdaysBetween(from, to);
  const closed = new Set(
    (config?.exceptions ?? []).filter((e) => e.closed !== false).map((e) => e.date),
  );

  return (
    <Stack space={3}>
      <Card padding={3} radius={2} tone={doc?.enabled ? "positive" : "caution"}>
        <Text size={1}>
          {doc?.enabled
            ? doc.bookableFrom && doc.bookableFrom > today
              ? `Boeken staat aan — klanten kunnen kiezen vanaf ${formatDateNl(doc.bookableFrom)}`
              : "Boeken staat aan — klanten zien deze zaterdagen op de homepage"
            : "Boeken staat uit — de kalender is niet zichtbaar op de site"}
        </Text>
      </Card>
      {error && (
        <Card padding={3} radius={2} tone="critical">
          <Text size={1}>{error}</Text>
        </Card>
      )}
      {saturdays.map((date) => {
        const day = byDate.get(date);
        const slots = day?.slots ?? [];
        const free = slots.filter((s) => s.remaining > 0).length;
        return (
          <Card key={date} padding={3} radius={2} border>
            <Flex align="center" gap={3} wrap="wrap">
              <div style={{ minWidth: 190 }}>
                <Text weight="semibold" size={1}>
                  {formatDateNl(date)}
                </Text>
              </div>
              {closed.has(date) ? (
                <Badge tone="caution">Gesloten</Badge>
              ) : slots.length === 0 ? (
                <Badge tone="default">Geen tijdslots</Badge>
              ) : (
                <Flex gap={2} wrap="wrap" style={{ flex: 1 }}>
                  {slots.map((s) => (
                    <Badge
                      key={s.start}
                      tone={s.remaining > 0 ? "positive" : "critical"}
                      title={`${s.start}–${s.end}: ${s.remaining} plek${s.remaining === 1 ? "" : "ken"} vrij`}
                    >
                      {s.start} · {s.remaining > 0 ? `${s.remaining} vrij` : "vol"}
                    </Badge>
                  ))}
                  <Text size={0} muted>
                    {free}/{slots.length} vrij
                  </Text>
                </Flex>
              )}
            </Flex>
          </Card>
        );
      })}
      <Text size={1} muted>
        Groen = nog plek, rood = vol. Wijzigingen zijn hier meteen zichtbaar, ook vóór publiceren.
      </Text>
    </Stack>
  );
}
