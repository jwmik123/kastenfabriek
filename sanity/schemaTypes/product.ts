import { defineField, defineType } from "sanity";

const MATERIAL_OPTIONS: { title: string; value: string }[] = [
  { title: "Thermo Eik Zwartbruin", value: "h1199-thermo-eik" },
  { title: "Vicenza Eik Licht", value: "h3165-vicenza-eik-licht" },
  { title: "Vicenza Eik Grijs", value: "h3158-vicenza-eik-grijs" },
  { title: "Lincoln Notelaar", value: "h1714-lincoln-notelaar" },
  { title: "Fineline Metallic Antraciet", value: "h3190-fineline-antraciet" },
  { title: "Zwart", value: "zwart" },
  { title: "Premium Wit", value: "premium-wit" },
  { title: "Zandbeige", value: "zandbeige" },
  { title: "Eucalyptus Groen", value: "eucalyptus-groen" },
  { title: "Amandelbeige", value: "amandelbeige" },
  { title: "Truffelbruin", value: "truffelbruin" },
  { title: "Donkertaupe", value: "donkertaupe" },
  { title: "Koolstofgrijs", value: "koolstofgrijs" },
  { title: "Mistblauw", value: "mistblauw" },
  { title: "Cosmosblauw", value: "cosmosblauw" },
  { title: "Granaatappelrood", value: "granaatappelrood" },
  { title: "Pistachegroen", value: "pistachegroen" },
  { title: "Olijfgroen", value: "olijfgroen" },
  { title: "Steengroen", value: "steengroen" },
];

const paxVariant = defineType({
  name: "paxVariant",
  title: "Variant",
  type: "object",
  fields: [
    defineField({
      name: "widthCm",
      title: "Breedte (cm)",
      type: "number",
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: "heightCm",
      title: "Hoogte (cm)",
      type: "number",
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: "priceEur",
      title: "Prijs (€)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
  ],
  preview: {
    select: { w: "widthCm", h: "heightCm", p: "priceEur" },
    prepare({ w, h, p }) {
      return { title: `${w} × ${h} cm`, subtitle: p != null ? `€${p}` : undefined };
    },
  },
});

const paxMaterialSurcharge = defineType({
  name: "paxMaterialSurcharge",
  title: "Materiaaltoeslag",
  type: "object",
  fields: [
    defineField({
      name: "materialId",
      title: "Materiaal",
      type: "string",
      options: { list: MATERIAL_OPTIONS },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "surchargeEur",
      title: "Toeslag (€)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
  ],
  preview: {
    select: { m: "materialId", s: "surchargeEur" },
    prepare({ m, s }) {
      return { title: m, subtitle: s != null ? `+ €${s}` : undefined };
    },
  },
});

const paxConfig = defineType({
  name: "paxConfig",
  title: "PAX Configuratie",
  type: "object",
  fields: [
    defineField({
      name: "widths",
      title: "Beschikbare breedtes (cm)",
      type: "array",
      of: [{ type: "number" }],
      validation: (Rule) => Rule.required().min(1).unique(),
    }),
    defineField({
      name: "heights",
      title: "Beschikbare hoogtes (cm)",
      type: "array",
      of: [{ type: "number" }],
      validation: (Rule) => Rule.required().min(1).unique(),
    }),
    defineField({
      name: "variants",
      title: "Varianten (prijsmatrix)",
      type: "array",
      of: [{ type: "paxVariant" }],
      description:
        "Eén entry per (breedte × hoogte) combinatie. Een waarschuwing verschijnt als niet alle combinaties zijn gedekt.",
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .custom((variants, context) => {
            const v = (variants ?? []) as { widthCm?: number; heightCm?: number }[];
            const parent = context.parent as
              | { widths?: number[]; heights?: number[] }
              | undefined;
            const widths = parent?.widths ?? [];
            const heights = parent?.heights ?? [];
            if (!widths.length || !heights.length) return true;
            const seen = new Set(
              v.map((x) => `${x.widthCm}x${x.heightCm}`),
            );
            const missing: string[] = [];
            for (const w of widths) {
              for (const h of heights) {
                if (!seen.has(`${w}x${h}`)) missing.push(`${w}×${h}`);
              }
            }
            if (missing.length) {
              return `Mist varianten voor: ${missing.join(", ")}`;
            }
            return true;
          }),
    }),
    defineField({
      name: "allowedMaterialIds",
      title: "Toegestane materialen",
      type: "array",
      of: [{ type: "string" }],
      description:
        "Beperk welke materialen beschikbaar zijn. Leeg laten = alle materialen toegestaan.",
      options: { layout: "grid", list: MATERIAL_OPTIONS },
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: "materialSurcharges",
      title: "Materiaaltoeslagen",
      type: "array",
      of: [{ type: "paxMaterialSurcharge" }],
      description: "Optionele toeslag per materiaal bovenop de variant prijs.",
    }),
    defineField({
      name: "hingeSide",
      title: "Scharnierzijde",
      type: "string",
      options: {
        list: [
          { title: "Links", value: "left" },
          { title: "Rechts", value: "right" },
        ],
      },
      description: "Optioneel. Niet getoond in v1 UI.",
    }),
  ],
});

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Titel",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "productType",
      title: "Producttype",
      type: "string",
      options: {
        list: [{ title: "PAX Deuren", value: "pax-doors" }],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "isActive",
      title: "Actief",
      type: "boolean",
      initialValue: true,
      description: "Inactieve producten verschijnen niet in de webshop listing.",
    }),
    defineField({
      name: "shortDescription",
      title: "Korte omschrijving",
      type: "text",
      rows: 2,
      validation: (Rule) => Rule.required().max(280),
    }),
    defineField({
      name: "longDescription",
      title: "Lange omschrijving",
      type: "array",
      of: [{ type: "block" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "heroImage",
      title: "Hero afbeelding",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "gallery",
      title: "Galerij",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "productInfo",
      title: "Product informatie",
      type: "array",
      of: [{ type: "block" }],
      description: "Extra productinformatie getoond onder de galerij.",
    }),
    defineField({
      name: "deliveryFee",
      title: "Bezorgkosten (€)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "paxConfig",
      title: "PAX Configuratie",
      type: "paxConfig",
      hidden: ({ document }) => document?.productType !== "pax-doors",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const productType = (context.document as { productType?: string } | undefined)
            ?.productType;
          if (productType === "pax-doors" && !value) {
            return "PAX Configuratie is vereist voor PAX Deuren producten.";
          }
          return true;
        }),
    }),
  ],
  preview: {
    select: {
      title: "title",
      productType: "productType",
      isActive: "isActive",
      media: "heroImage",
    },
    prepare({ title, productType, isActive, media }) {
      return {
        title,
        subtitle: `${productType ?? "?"}${isActive === false ? " — inactief" : ""}`,
        media,
      };
    },
  },
});

export const productSchemaTypes = [paxVariant, paxMaterialSurcharge, paxConfig, product];
