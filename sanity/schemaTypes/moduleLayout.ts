import { defineField, defineType } from "sanity";

export const moduleLayout = defineType({
  name: "moduleLayout",
  title: "Module Layout (Indeling)",
  type: "document",
  fields: [
    defineField({
      name: "layoutId",
      title: "Layout ID",
      type: "number",
      description: "Unique identifier (1-99)",
      validation: (Rule) => Rule.required().min(1).max(99),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "Display name for the layout",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "string",
      description: 'e.g., "2x plank, 2x roede"',
    }),
    defineField({
      name: "contents",
      title: "Contents",
      type: "object",
      fields: [
        defineField({
          name: "shelves",
          title: "Shelves (Planken)",
          type: "number",
          initialValue: 0,
        }),
        defineField({
          name: "rods",
          title: "Rods (Roedes)",
          type: "number",
          initialValue: 0,
        }),
        defineField({
          name: "drawers",
          title: "Drawers (Lades)",
          type: "number",
          initialValue: 0,
        }),
        defineField({
          name: "hasWashingMachineShelf",
          title: "Washing Machine Shelf",
          type: "boolean",
          initialValue: false,
        }),
        defineField({
          name: "hasDesk",
          title: "Desk (Bureau)",
          type: "boolean",
          initialValue: false,
        }),
      ],
    }),
    defineField({
      name: "priceDouble",
      title: "Price - Double Corpus (€)",
      type: "number",
      description: "Price for double-door corpus (65-120cm wide)",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "priceSingle",
      title: "Price - Single Corpus (€)",
      type: "number",
      description:
        "Price for single-door corpus (15-65cm wide). Usually 60% of double price.",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "availableForTopCabinet",
      title: "Available for Top Cabinet",
      type: "boolean",
      description: "Can this layout be used for small top cabinets?",
      initialValue: false,
    }),
    defineField({
      name: "sectionType",
      title: "Section Type (wasmachinekast)",
      type: "string",
      description:
        "Which wasmachinekast section can use this layout. 'both' fits high and low (90cm) sections; 'high' fits high only; 'low' fits low only.",
      options: {
        list: [
          { title: "Both (high + low / 90cm)", value: "both" },
          { title: "High only", value: "high" },
          { title: "Low only (90cm)", value: "low" },
        ],
        layout: "radio",
      },
      initialValue: "both",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "name",
      layoutId: "layoutId",
      priceDouble: "priceDouble",
    },
    prepare({ title, layoutId, priceDouble }) {
      return {
        title: `${layoutId}. ${title}`,
        subtitle: `€${priceDouble} (double)`,
      };
    },
  },
  orderings: [
    {
      title: "By Layout ID",
      name: "layoutIdAsc",
      by: [{ field: "layoutId", direction: "asc" }],
    },
  ],
});
