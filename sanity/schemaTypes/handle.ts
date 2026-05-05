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
    defineField({
      name: "allowedMaterials",
      title: "Allowed Materials",
      type: "array",
      of: [{ type: "string" }],
      description:
        "Restrict which metal finishes are available for this handle. Leave empty to allow all finishes.",
      options: {
        layout: "grid",
        list: [
          { title: "Chrome", value: "chrome" },
          { title: "Zwart", value: "black" },
          { title: "Goud", value: "gold" },
          { title: "Rosé goud", value: "rose-gold" },
          { title: "Zilver", value: "silver" },
          { title: "Oud zilver", value: "old-silver" },
          { title: "Grijsblauw", value: "gray-blue" },
          { title: "Grijs", value: "gray" },
          { title: "Wit", value: "white" },
        ],
      },
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: "meshId",
      title: "Mesh ID (override)",
      type: "string",
      description:
        'Optional. Use a different GLB mesh than handleId. Lets multiple handles share one mesh (e.g. 4 leather variants of the same shape). Set to the numeric prefix of the mesh name (e.g. "30").',
    }),
    defineField({
      name: "bodyColor",
      title: "Body Color (Leather)",
      type: "string",
      description:
        "Optional. Set when the handle has a fixed leather body and a customer-selected metal knob. Leave empty for single-material handles.",
      options: {
        list: [
          { title: "Huidskleur roze", value: "leather-pink" },
          { title: "Beige", value: "leather-beige" },
          { title: "Bruin", value: "leather-brown" },
          { title: "Lichtgrijs", value: "leather-light-gray" },
          { title: "Zwart", value: "leather-black" },
        ],
      },
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
