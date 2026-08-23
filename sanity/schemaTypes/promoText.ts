import { defineArrayMember, defineType } from "sanity";

/**
 * One line of banner copy. Portable Text rather than a plain string so an
 * editor can bold a phrase and mark the discount in the accent colour —
 * exactly the two bits of styling the promo strips already used.
 */
export const promoText = defineType({
  name: "promoText",
  title: "Bannertekst",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [{ title: "Normaal", value: "normal" }],
      lists: [],
      marks: {
        decorators: [
          { title: "Vet", value: "strong" },
          { title: "Accentkleur", value: "accent" },
        ],
        annotations: [],
      },
    }),
  ],
  validation: (Rule) => Rule.max(1).error("Eén regel tekst."),
});
