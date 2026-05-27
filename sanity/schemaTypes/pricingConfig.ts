import { defineField, defineType } from "sanity";

export const pricingConfig = defineType({
  name: "pricingConfig",
  title: "Pricing Configuration",
  type: "document",
  fields: [
    defineField({
      name: "freeMontage",
      title: "Gratis Montage",
      type: "boolean",
      description:
        "Wanneer actief, wordt montage gratis aangeboden aan de klant.",
      initialValue: false,
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      initialValue: "Pricing Configuration",
      readOnly: true,
    }),
    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
      initialValue: "EUR",
      readOnly: true,
    }),
    defineField({
      name: "lastUpdated",
      title: "Last Updated",
      type: "datetime",
    }),
    defineField({
      name: "led",
      title: "LED Lighting Pricing",
      type: "object",
      fields: [
        defineField({
          name: "basePrice",
          title: "Base Installation Price (€)",
          type: "number",
          description: "One-time base cost for LED installation",
          initialValue: 180,
        }),
        defineField({
          name: "pricePerModule",
          title: "Price Per Module (€)",
          type: "number",
          description: "Additional cost per corpus/module",
          initialValue: 65,
        }),
      ],
    }),
    defineField({
      name: "deliveryPrice",
      title: "Delivery Price (€)",
      type: "number",
      initialValue: 95,
    }),
    defineField({
      name: "slopedBackWallSurcharge",
      title: "Sloped Back Wall Surcharge (€)",
      type: "number",
      description:
        "Toeslag voor schuine achterwand (eenmalig per kast).",
      initialValue: 1100,
    }),
    defineField({
      name: "slopedSideWallSurchargePerSide",
      title: "Sloped Side Wall Surcharge per Side (€)",
      type: "number",
      description:
        "Toeslag per schuine zijwand. Bij 'beide' zijden geldt het bedrag dubbel.",
      initialValue: 1100,
    }),
    defineField({
      name: "constraints",
      title: "Dimension Constraints",
      type: "object",
      fields: [
        defineField({
          name: "singleCorpus",
          title: "Single Corpus",
          type: "object",
          fields: [
            defineField({
              name: "minWidth",
              title: "Min Width (cm)",
              type: "number",
              initialValue: 15,
            }),
            defineField({
              name: "maxWidth",
              title: "Max Width (cm)",
              type: "number",
              initialValue: 65,
            }),
            defineField({
              name: "minHeight",
              title: "Min Height (cm)",
              type: "number",
              initialValue: 200,
            }),
            defineField({
              name: "maxHeight",
              title: "Max Height (cm)",
              type: "number",
              initialValue: 275,
            }),
            defineField({
              name: "minDepth",
              title: "Min Depth (cm)",
              type: "number",
              initialValue: 15,
            }),
            defineField({
              name: "maxDepth",
              title: "Max Depth (cm)",
              type: "number",
              initialValue: 90,
            }),
          ],
        }),
        defineField({
          name: "doubleCorpus",
          title: "Double Corpus",
          type: "object",
          fields: [
            defineField({
              name: "minWidth",
              title: "Min Width (cm)",
              type: "number",
              initialValue: 65,
            }),
            defineField({
              name: "maxWidth",
              title: "Max Width (cm)",
              type: "number",
              initialValue: 120,
            }),
            defineField({
              name: "minHeight",
              title: "Min Height (cm)",
              type: "number",
              initialValue: 200,
            }),
            defineField({
              name: "maxHeight",
              title: "Max Height (cm)",
              type: "number",
              initialValue: 275,
            }),
            defineField({
              name: "minDepth",
              title: "Min Depth (cm)",
              type: "number",
              initialValue: 15,
            }),
            defineField({
              name: "maxDepth",
              title: "Max Depth (cm)",
              type: "number",
              initialValue: 90,
            }),
          ],
        }),
        defineField({
          name: "topCabinet",
          title: "Top Cabinet (Kleine Boven Kast)",
          type: "object",
          fields: [
            defineField({
              name: "maxHeight",
              title: "Max Height (cm)",
              type: "number",
              initialValue: 110,
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      lastUpdated: "lastUpdated",
    },
    prepare({ title, lastUpdated }) {
      return {
        title: title || "Pricing Configuration",
        subtitle: lastUpdated
          ? `Last updated: ${new Date(lastUpdated).toLocaleDateString()}`
          : "Not updated yet",
      };
    },
  },
});
