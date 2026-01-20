import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Instellingen",
  type: "document",
  fields: [
    defineField({
      name: "siteName",
      title: "Website naam",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
    }),
    defineField({
      name: "tagline",
      title: "Slogan",
      type: "string",
    }),
    defineField({
      name: "contactEmail",
      title: "Contact e-mail",
      type: "string",
    }),
    defineField({
      name: "contactPhone",
      title: "Contact telefoon",
      type: "string",
    }),
    defineField({
      name: "address",
      title: "Adres",
      type: "object",
      fields: [
        { name: "street", title: "Straat", type: "string" },
        { name: "postalCode", title: "Postcode", type: "string" },
        { name: "city", title: "Plaats", type: "string" },
        { name: "country", title: "Land", type: "string" },
      ],
    }),
    defineField({
      name: "socialMedia",
      title: "Social Media",
      type: "object",
      fields: [
        { name: "instagram", title: "Instagram URL", type: "url" },
        { name: "facebook", title: "Facebook URL", type: "url" },
        { name: "pinterest", title: "Pinterest URL", type: "url" },
        { name: "linkedin", title: "LinkedIn URL", type: "url" },
      ],
    }),
    defineField({
      name: "shippingInfo",
      title: "Verzendgegevens",
      type: "object",
      fields: [
        {
          name: "freeShippingThreshold",
          title: "Gratis verzending vanaf (centen)",
          type: "number",
        },
        {
          name: "standardShippingCost",
          title: "Standaard verzendkosten (centen)",
          type: "number",
        },
        {
          name: "deliveryTimeText",
          title: "Levertijd tekst",
          type: "string",
        },
      ],
    }),
    defineField({
      name: "vatRate",
      title: "BTW percentage",
      type: "number",
      initialValue: 21,
    }),
    defineField({
      name: "kvkNumber",
      title: "KvK nummer",
      type: "string",
    }),
    defineField({
      name: "vatNumber",
      title: "BTW nummer",
      type: "string",
    }),
  ],
  preview: {
    select: {
      title: "siteName",
      media: "logo",
    },
  },
});
