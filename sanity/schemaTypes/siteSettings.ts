import { defineField, defineType } from "sanity";

/**
 * The single settings document. Everything the site chrome shows about the
 * company lives here — the footer reads it via `sanity/lib/siteSettings` and
 * falls back to built-in defaults for whatever an editor left empty.
 */
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Instellingen",
  type: "document",
  groups: [
    { name: "general", title: "Algemeen", default: true },
    { name: "contact", title: "Contact" },
    { name: "banner", title: "Actiebanner" },
    { name: "commerce", title: "Verkoop" },
    { name: "legal", title: "Juridisch" },
  ],
  fields: [
    defineField({
      name: "siteName",
      title: "Website naam",
      type: "string",
      group: "general",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      group: "general",
    }),
    defineField({
      name: "tagline",
      title: "Slogan",
      description: "De grote zin bovenaan de footer.",
      type: "string",
      group: "general",
    }),
    defineField({
      name: "contactEmail",
      title: "Contact e-mail",
      type: "string",
      group: "contact",
    }),
    defineField({
      name: "contactPhone",
      title: "Contact telefoon",
      description:
        "Leeg laten verbergt de telefoonregel in de footer — beter geen nummer dan een verkeerd nummer.",
      type: "string",
      group: "contact",
    }),
    defineField({
      name: "address",
      title: "Adres",
      type: "object",
      group: "contact",
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
      group: "contact",
      fields: [
        { name: "instagram", title: "Instagram URL", type: "url" },
        { name: "facebook", title: "Facebook URL", type: "url" },
        { name: "pinterest", title: "Pinterest URL", type: "url" },
        { name: "linkedin", title: "LinkedIn URL", type: "url" },
      ],
    }),
    defineField({
      name: "promoBanner",
      title: "Actiebanner",
      description:
        "Een regel leegmaken verbergt die balk — zo haal je de actie weg zonder een developer.",
      type: "object",
      group: "banner",
      fields: [
        defineField({
          name: "topBar",
          title: "Balk bovenaan elke pagina",
          type: "promoText",
        }),
        defineField({
          name: "homepage",
          title: "Balk onder de homepage-hero",
          description:
            "Meer ruimte dan de bovenste balk — hier past bijvoorbeeld het kortingsbedrag bij.",
          type: "promoText",
        }),
      ],
    }),
    defineField({
      name: "shippingInfo",
      title: "Verzendgegevens",
      type: "object",
      group: "commerce",
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
      group: "commerce",
      initialValue: 21,
    }),
    defineField({
      name: "kvkNumber",
      title: "KvK nummer",
      type: "string",
      group: "legal",
    }),
    defineField({
      name: "vatNumber",
      title: "BTW nummer",
      type: "string",
      group: "legal",
    }),
    defineField({
      name: "mainsElectricityNotice",
      title: "Netstroom melding",
      description:
        "Wordt getoond bij LED-verlichting en Stekkerdoos in de configurator.",
      type: "string",
      group: "commerce",
      initialValue:
        "Let op: er moet netstroom achter de kast aanwezig zijn.",
    }),
    defineField({
      name: "termsAndConditions",
      title: "Algemene voorwaarden",
      description:
        "Zolang dit veld leeg is bestaat /algemene-voorwaarden niet en toont de footer de link niet.",
      type: "richText",
      group: "legal",
    }),
    defineField({
      name: "privacyPolicy",
      title: "Privacyverklaring",
      description:
        "Zolang dit veld leeg is bestaat /privacyverklaring niet en toont de footer de link niet.",
      type: "richText",
      group: "legal",
    }),
    defineField({
      name: "returnPolicy",
      title: "Retourbeleid",
      description:
        "Zolang dit veld leeg is bestaat /retourbeleid niet en toont de footer de link niet.",
      type: "richText",
      group: "legal",
    }),
  ],
  preview: {
    select: {
      title: "siteName",
      media: "logo",
    },
  },
});
