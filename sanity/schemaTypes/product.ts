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

const paxHoekVariant = defineType({
  name: "paxHoekVariant",
  title: "Hoekdeur variant",
  type: "object",
  fields: [
    defineField({
      name: "widthLabel",
      title: "Breedte (label)",
      type: "string",
      description:
        "Vrije tekst, bv. \"27cm & 50cm\". Hoekdeuren bestaan uit twee panelen.",
      validation: (Rule) => Rule.required(),
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
    select: { w: "widthLabel", h: "heightCm", p: "priceEur" },
    prepare({ w, h, p }) {
      return { title: `${w} — ${h} cm`, subtitle: p != null ? `€${p}` : undefined };
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

const paxVerlengdePrice = defineType({
  name: "paxVerlengdePrice",
  title: "Verlengde-deur prijs",
  type: "object",
  fields: [
    defineField({
      name: "widthCm",
      title: "Breedte (cm)",
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
    select: { w: "widthCm", p: "priceEur" },
    prepare({ w, p }) {
      return { title: `${w} cm`, subtitle: p != null ? `€${p}` : undefined };
    },
  },
});

const sampleConfig = defineType({
  name: "sampleConfig",
  title: "Stalen Configuratie",
  type: "object",
  fields: [
    defineField({
      name: "maxSelections",
      title: "Max aantal stalen",
      type: "number",
      initialValue: 3,
      description:
        "Maximum aantal materialen dat een klant gratis kan aanvragen.",
      validation: (Rule) => Rule.required().integer().min(1).max(10),
    }),
  ],
});

const paxConfig = defineType({
  name: "paxConfig",
  title: "PAX Configuratie",
  type: "object",
  fields: [
    defineField({
      name: "variants",
      title: "Varianten — Deuren (prijsmatrix)",
      type: "array",
      of: [{ type: "paxVariant" }],
      description:
        "Prijsmatrix voor type 'Deuren' (standaard). Eén entry per (breedte × hoogte) combinatie. De beschikbare breedtes/hoogtes worden hieruit afgeleid — voeg alleen combinaties toe die echt bestaan.",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "hoekVariants",
      title: "Varianten — Hoekdeuren",
      type: "array",
      of: [{ type: "paxHoekVariant" }],
      description:
        "Prijsmatrix voor type 'Hoekdeuren'. Leeg laten = type niet beschikbaar. Breedte is een vrij label (bv. \"27cm & 50cm\").",
    }),
    defineField({
      name: "afwerkVariants",
      title: "Varianten — Zijpaneel",
      type: "array",
      of: [{ type: "paxVariant" }],
      description:
        "Prijsmatrix voor type 'Zijpaneel'. Leeg laten = type niet beschikbaar. Eigen breedtes/hoogtes — hoeft niet gelijk te zijn aan Deuren.",
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
      name: "verlengdePrices",
      title: "Verlengde deuren — prijs per breedte",
      type: "array",
      of: [{ type: "paxVerlengdePrice" }],
      description:
        "Schakelt de optie 'Verlengde deuren' in (geldt voor alle types). De klant voert dan een eigen hoogte in; de stuksprijs komt uit deze lijst, op basis van de gekozen breedte. Leeg laten = optie verborgen. Eén entry per breedte.",
      validation: (Rule) =>
        Rule.custom((prices) => {
          const list = (prices ?? []) as { widthCm?: number }[];
          const widths = list.map((p) => p.widthCm);
          const dup = widths.filter((w, i) => widths.indexOf(w) !== i);
          return dup.length
            ? `Dubbele breedte(s): ${[...new Set(dup)].join(", ")} cm`
            : true;
        }),
    }),
    defineField({
      name: "verlengdeHoekPrice",
      title: "Verlengde deuren — prijs Hoekdeuren (vast)",
      type: "number",
      description:
        "Vaste verlengde-prijs voor Hoekdeuren (ongeacht breedte). Leeg laten = optie verborgen voor Hoekdeuren.",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "verlengdeMinHeightCm",
      title: "Verlengde deuren — min. hoogte (cm)",
      type: "number",
      description: "Ondergrens voor het hoogte-invoerveld. Standaard 200.",
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: "verlengdeMaxHeightCm",
      title: "Verlengde deuren — max. hoogte (cm)",
      type: "number",
      description: "Bovengrens voor het hoogte-invoerveld. Standaard 300.",
      validation: (Rule) => Rule.positive(),
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
        list: [
          { title: "PAX Deuren", value: "pax-doors" },
          { title: "Materiaalstalen", value: "samples" },
        ],
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
      description: "Vereist, behalve voor materiaalstalen.",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const productType = (context.document as { productType?: string } | undefined)
            ?.productType;
          if (productType !== "samples" && !value) {
            return "Hero afbeelding is vereist.";
          }
          return true;
        }),
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
      hidden: ({ document }) => document?.productType === "samples",
      description: "Niet van toepassing op materiaalstalen (altijd gratis).",
      validation: (Rule) =>
        Rule.min(0).custom((value, context) => {
          const productType = (context.document as { productType?: string } | undefined)
            ?.productType;
          if (productType !== "samples" && (value === undefined || value === null)) {
            return "Bezorgkosten zijn vereist.";
          }
          return true;
        }),
    }),
    defineField({
      name: "sampleConfig",
      title: "Stalen Configuratie",
      type: "sampleConfig",
      hidden: ({ document }) => document?.productType !== "samples",
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

export const productSchemaTypes = [
  paxVariant,
  paxHoekVariant,
  paxMaterialSurcharge,
  paxVerlengdePrice,
  paxConfig,
  sampleConfig,
  product,
];
