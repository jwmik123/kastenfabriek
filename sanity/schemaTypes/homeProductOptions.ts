import { defineField, defineType } from "sanity";

/**
 * The photos on the "Waar ben je naar op zoek?" cards under the homepage hero.
 * Only the images live here — titles, teksten en links blijven in code, zodat
 * een lege foto simpelweg terugvalt op de afbeelding in `public/`.
 */
export const homeProductOptions = defineType({
  name: "homeProductOptions",
  title: "Kasttypes (homepage)",
  type: "document",
  description:
    "De foto's bij de kaarten onder de hero. Laat je een veld leeg, dan blijft de standaardfoto staan.",
  fields: [
    defineField({
      name: "kledingkast",
      title: "Foto Kledingkast",
      description: "Vierkante uitsnede. Zet de hotspot op het deel dat altijd zichtbaar moet blijven.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "wasmachinekast",
      title: "Foto Wasmachinekast",
      description: "Vierkante uitsnede.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "ikeaPax",
      title: "Foto IKEA PAX Deuren",
      description: "Vierkante uitsnede.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "alleProducten",
      title: "Foto balk 'Bekijk al onze producten'",
      description:
        "Brede banner onder de drie kaarten. De foto staat achter een gekleurde laag, dus rustige beelden werken het best.",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: {
    prepare: () => ({ title: "Kasttypes (homepage)" }),
  },
});
