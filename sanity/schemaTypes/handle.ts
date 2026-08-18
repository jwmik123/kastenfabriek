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
      name: "heightCm",
      title: "Height (cm)",
      type: "number",
      description:
        "Vertical extent of physical handle in cm (from Hafele/Prodinter spec). Optional for now; will gate handle availability on sloped doors once populated.",
      validation: (Rule) => Rule.min(1).max(100),
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
          { title: "Messing", value: "brass" },
          { title: "Koper", value: "copper" },
          { title: "Rosé goud", value: "rose-gold" },
          { title: "Zilver", value: "silver" },
          { title: "Oud zilver", value: "old-silver" },
          { title: "RVS look", value: "stainless" },
          { title: "Aluminium", value: "aluminium" },
          { title: "Grijsblauw", value: "gray-blue" },
          { title: "Grijs", value: "gray" },
          { title: "Wit", value: "white" },
        ],
      },
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: "fitsLowModule",
      title: "Past op lage module",
      type: "boolean",
      initialValue: true,
      description:
        "Zet uit wanneer deze greep niet op een lade of een module van de lage kast past. Uitgeschakelde grepen zijn niet kiesbaar zodra de configuratie een lage kast heeft. Leeg = past wel.",
    }),
    defineField({
      name: "noRotationOnDrawer",
      title: "Niet draaien op lade",
      type: "boolean",
      initialValue: false,
      description:
        "Standaard wordt een greep een kwartslag gedraaid zodat hij horizontaal op een ladefront ligt. Zet aan voor grepen die rechtop moeten blijven (bijvoorbeeld knoppen of grepen die al horizontaal getekend zijn).",
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
      heightCm: "heightCm",
      media: "image",
    },
    prepare({ title, price, productCode, heightCm, media }) {
      const heightPart = typeof heightCm === "number" ? ` — H ${heightCm}cm` : "";
      return {
        title: title ?? productCode,
        subtitle: `€${price} — ${productCode}${heightPart}`,
        media,
      };
    },
  },
});
