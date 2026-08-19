import { defineArrayMember, defineField, defineType } from "sanity";

export const hotspotSection = defineType({
  name: "hotspotSection",
  title: "Kastdetails (hotspots)",
  type: "document",
  description:
    "De sectie op de homepage waar bezoekers op punten in de foto tikken om details te lezen.",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Bovenschrift",
      type: "string",
      initialValue: "Ontdek de kast",
    }),
    defineField({
      name: "heading",
      title: "Titel",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "headingAccent",
      title: "Titel (cursief accent)",
      description: "Tweede deel van de titel, wordt cursief en in accentkleur getoond.",
      type: "string",
    }),
    defineField({
      name: "intro",
      title: "Introtekst",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "baseImage",
      title: "Hoofdfoto",
      description:
        "De foto met de punten erop. Let op: als je een andere foto kiest, controleer dan de X/Y-posities van de punten hieronder.",
      type: "image",
      options: { hotspot: false },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "baseImageAlt",
      title: "Alt-tekst hoofdfoto",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "points",
      title: "Punten",
      type: "array",
      validation: (Rule) => Rule.min(1).max(8),
      of: [
        defineArrayMember({
          name: "point",
          title: "Punt",
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Titel",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "body",
              title: "Tekst",
              type: "text",
              rows: 5,
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "image",
              title: "Detailfoto",
              type: "image",
              options: { hotspot: true },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "x",
              title: "Positie X (%)",
              description: "0 = linkerrand van de foto, 100 = rechterrand.",
              type: "number",
              validation: (Rule) => Rule.required().min(0).max(100),
            }),
            defineField({
              name: "y",
              title: "Positie Y (%)",
              description: "0 = bovenrand van de foto, 100 = onderrand.",
              type: "number",
              validation: (Rule) => Rule.required().min(0).max(100),
            }),
            defineField({
              name: "label",
              title: "Omschrijving voor schermlezers",
              description: 'Wordt voorgelezen als "Bekijk …", bijvoorbeeld "de lades".',
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "href",
              title: "Link (optioneel)",
              description: "Pad op de site, bijvoorbeeld /wasmachinekast.",
              type: "string",
            }),
            defineField({
              name: "ctaLabel",
              title: "Linktekst",
              description: "Alleen nodig als je hierboven een link invult.",
              type: "string",
            }),
          ],
          preview: {
            select: { title: "title", x: "x", y: "y", media: "image" },
            prepare: ({ title, x, y, media }) => ({
              title,
              subtitle: `${x ?? "?"}% / ${y ?? "?"}%`,
              media,
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "heading", media: "baseImage" },
    prepare: ({ title, media }) => ({
      title: title || "Kastdetails",
      subtitle: "Homepage sectie",
      media,
    }),
  },
});
