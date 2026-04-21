import { defineField, defineType } from "sanity";

export const handle = defineType({
  name: "handle",
  title: "Handle",
  type: "document",
  fields: [
    defineField({
      name: "handleId",
      title: "Handle ID",
      type: "slug",
      description: 'Numeric ID matching the GLB mesh (e.g. "1", "28")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: 'e.g. "W4080 - 96mm"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "nameNl",
      title: "Name (Dutch)",
      type: "string",
    }),
    defineField({
      name: "productCode",
      title: "Product Code",
      type: "string",
      description: 'Hafele product code used to look up GLB mesh node (e.g. "W4080")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "price",
      title: "Price (€)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
  ],
  preview: {
    select: {
      title: "name",
      price: "price",
      productCode: "productCode",
      media: "image",
    },
    prepare({ title, price, productCode, media }) {
      return {
        title: title ?? productCode,
        subtitle: `€${price} — ${productCode}`,
        media,
      };
    },
  },
});
