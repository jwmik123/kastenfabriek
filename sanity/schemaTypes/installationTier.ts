import { defineField, defineType } from "sanity";

export const installationTier = defineType({
  name: "installationTier",
  title: "Installation Tier",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: 'e.g., "Small Project", "Medium Project"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "minTotal",
      title: "Minimum Subtotal (€)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "maxTotal",
      title: "Maximum Subtotal (€)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "price",
      title: "Installation Price (€)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "days",
      title: "Days Required",
      type: "number",
    }),
    defineField({
      name: "people",
      title: "People Required",
      type: "number",
    }),
  ],
  orderings: [
    {
      title: "By Min Total",
      name: "minTotalAsc",
      by: [{ field: "minTotal", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      minTotal: "minTotal",
      maxTotal: "maxTotal",
      price: "price",
      name: "name",
    },
    prepare({ minTotal, maxTotal, price, name }) {
      return {
        title: name || `€${minTotal} - €${maxTotal}`,
        subtitle: `Installation: €${price}`,
      };
    },
  },
});
