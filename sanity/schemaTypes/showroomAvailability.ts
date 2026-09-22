import { defineArrayMember, defineField, defineType } from "sanity";

import { ShowroomCalendarInput } from "../components/ShowroomCalendarInput";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const timeRange = defineArrayMember({
  type: "object",
  name: "timeRange",
  title: "Tijdvak",
  fields: [
    defineField({
      name: "start",
      title: "Van",
      type: "string",
      placeholder: "10:00",
      validation: (Rule) =>
        Rule.required().regex(TIME_RE, { name: "tijd", invert: false }).error("Gebruik uu:mm, bijv. 10:00"),
    }),
    defineField({
      name: "end",
      title: "Tot",
      type: "string",
      placeholder: "16:00",
      validation: (Rule) =>
        Rule.required()
          .regex(TIME_RE, { name: "tijd", invert: false })
          .error("Gebruik uu:mm, bijv. 16:00")
          .custom((end, ctx) => {
            const start = (ctx.parent as { start?: string } | undefined)?.start;
            if (!start || !end || !TIME_RE.test(start) || !TIME_RE.test(end)) return true;
            return end > start ? true : "Eindtijd moet na de begintijd liggen.";
          }),
    }),
  ],
  preview: {
    select: { start: "start", end: "end" },
    prepare: ({ start, end }) => ({ title: `${start ?? "?"} – ${end ?? "?"}` }),
  },
});

/**
 * The showroom's opening schedule, from which the homepage calendar derives
 * its bookable slots (lib/showroom/availability.ts). A singleton, edited by the
 * owner; the bookings themselves live in Postgres.
 */
export const showroomAvailability = defineType({
  name: "showroomAvailability",
  title: "Showroom-afspraken",
  type: "document",
  groups: [
    { name: "calendar", title: "Kalender", default: true },
    { name: "schedule", title: "Openingstijden" },
    { name: "rules", title: "Regels" },
    { name: "texts", title: "Teksten" },
  ],
  fields: [
    defineField({
      name: "enabled",
      title: "Afspraken boeken ingeschakeld",
      type: "boolean",
      description:
        "Uit: de kalender staat niet op de homepage. Aan: klanten kunnen een tijdslot kiezen.",
      initialValue: false,
      group: ["calendar", "rules"],
    }),
    defineField({
      name: "bookableFrom",
      title: "Boekbaar vanaf",
      type: "date",
      description:
        "Optioneel. Tot deze datum toont de homepage alleen 'afspraken mogelijk vanaf …' — handig zolang de showroom nog niet klaar is.",
      group: ["calendar", "rules"],
    }),
    defineField({
      name: "capacityPerSlot",
      title: "Hoeveel afspraken tegelijk mogelijk?",
      type: "number",
      description:
        "Aantal afspraken per tijdslot. Zodra een tijdslot dit aantal boekingen heeft, is het vol en kan niemand het meer kiezen. Bijvoorbeeld 2 = twee klanten tegelijk in de showroom.",
      initialValue: 1,
      group: ["calendar", "rules"],
      validation: (Rule) => Rule.required().min(1).max(20).integer(),
    }),
    defineField({
      name: "saturdayRanges",
      title: "Openingstijden op zaterdag",
      type: "array",
      description:
        "De showroom is alleen op zaterdag open. Meestal één tijdvak, bijv. 10:00–16:00; voeg een tweede toe voor een pauze (10:00–12:30 en 13:30–16:00).",
      group: ["calendar", "schedule"],
      of: [timeRange],
      validation: (Rule) => Rule.required().min(1).error("Vul minstens één tijdvak in."),
    }),
    defineField({
      name: "exceptions",
      title: "Afwijkende zaterdagen",
      type: "array",
      description:
        "Een zaterdag dat de showroom dicht is (vakantie, feestdag) of andere tijden heeft. Gaat vóór de gewone openingstijden.",
      group: ["calendar", "schedule"],
      of: [
        defineArrayMember({
          type: "object",
          name: "dateException",
          title: "Afwijkende zaterdag",
          fields: [
            defineField({
              name: "date",
              title: "Zaterdag",
              type: "date",
              validation: (Rule) =>
                Rule.required().custom((date) => {
                  if (!date || typeof date !== "string") return true;
                  return new Date(`${date}T12:00:00Z`).getUTCDay() === 6
                    ? true
                    : "Kies een zaterdag — op andere dagen is de showroom altijd dicht.";
                }),
            }),
            defineField({
              name: "closed",
              title: "Gesloten",
              type: "boolean",
              description: "Aan: die zaterdag dicht. Uit: open met de tijden hieronder.",
              initialValue: true,
            }),
            defineField({
              name: "ranges",
              title: "Afwijkende tijden",
              type: "array",
              of: [timeRange],
              hidden: ({ parent }) => (parent as { closed?: boolean } | undefined)?.closed !== false,
            }),
            defineField({ name: "label", title: "Reden (optioneel)", type: "string" }),
          ],
          preview: {
            select: { date: "date", closed: "closed", label: "label", ranges: "ranges" },
            prepare: ({ date, closed, label, ranges }) => ({
              title: `${date ?? "?"} · ${closed === false ? "andere tijden" : "gesloten"}`,
              subtitle:
                label ||
                (closed === false && Array.isArray(ranges)
                  ? ranges.map((r: { start?: string; end?: string }) => `${r.start}–${r.end}`).join(", ")
                  : ""),
            }),
          },
        }),
      ],
    }),
    defineField({
      name: "calendarPreview",
      title: "Komende zaterdagen",
      type: "string",
      description:
        "De komende zaterdagen zoals klanten ze zien, met per tijdslot hoeveel plekken er nog vrij zijn.",
      readOnly: true,
      group: "calendar",
      components: { input: ShowroomCalendarInput },
    }),
    defineField({
      name: "slotMinutes",
      title: "Lengte van een tijdslot (minuten)",
      type: "number",
      initialValue: 60,
      group: "rules",
      validation: (Rule) => Rule.required().min(15).max(240),
    }),
    defineField({
      name: "minLeadHours",
      title: "Minimaal vooraf boeken (uren)",
      type: "number",
      description: "Een tijdslot dat binnen dit aantal uren begint, is niet meer te boeken.",
      initialValue: 24,
      group: "rules",
      validation: (Rule) => Rule.required().min(0).max(24 * 14),
    }),
    defineField({
      name: "maxWeeksAhead",
      title: "Maximaal vooruit boeken (weken)",
      type: "number",
      initialValue: 8,
      group: "rules",
      validation: (Rule) => Rule.required().min(1).max(52).integer(),
    }),
    defineField({
      name: "introText",
      title: "Introductietekst op de homepage",
      type: "text",
      rows: 3,
      group: "texts",
      initialValue:
        "Kom langs in onze showroom en bekijk de materialen en modules in het echt. Kies een dag en tijd die jou uitkomt.",
    }),
    defineField({
      name: "confirmationText",
      title: "Tekst in de bevestigingsmail",
      type: "text",
      rows: 3,
      group: "texts",
      description: "Bijvoorbeeld parkeerinstructies of wat de klant kan verwachten.",
      initialValue: "We nemen rustig de tijd voor je. Parkeren kan gratis voor de deur.",
    }),
  ],
  preview: {
    select: { enabled: "enabled", ranges: "saturdayRanges" },
    prepare({ enabled, ranges }) {
      const times = Array.isArray(ranges)
        ? ranges.map((r: { start?: string; end?: string }) => `${r.start}–${r.end}`).join(", ")
        : "";
      return {
        title: "Showroom-afspraken",
        subtitle: enabled ? `Boeken aan · zaterdag ${times}` : "Boeken uit",
      };
    },
  },
});
