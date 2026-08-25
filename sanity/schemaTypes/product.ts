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
      name: "widthTotalCm",
      title: "Totale breedte (cm)",
      type: "number",
      description:
        "Samen genomen breedte van beide panelen, gebruikt om de prijs van verlengde hoekdeuren te berekenen. Leeg laten = de getallen uit het label worden opgeteld (\"27cm & 51cm\" → 78).",
      validation: (Rule) => Rule.positive(),
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

const simpleConfig = defineType({
  name: "simpleConfig",
  title: "Product Configuratie",
  type: "object",
  description:
    "Voor losse producten zonder configurator: een lade, een hanger, een deurstop.",
  fields: [
    defineField({
      name: "priceEur",
      title: "Prijs (\u20ac)",
      type: "number",
      description: "Stuksprijs, exclusief bezorgkosten.",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "sku",
      title: "Artikelnummer",
      type: "string",
      description: "Optioneel. Komt mee op de orderbon en pakbon.",
    }),
    defineField({
      name: "maxQuantity",
      title: "Max. aantal per bestelling",
      type: "number",
      initialValue: 10,
      description: "Bovengrens van de aantal-teller. Leeg laten = 10.",
      validation: (Rule) => Rule.integer().min(1),
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
      name: "afwerkEnabled",
      title: "Zijpaneel aanbieden",
      type: "boolean",
      initialValue: false,
      description:
        "Zet het type 'Zijpaneel' aan. Een zijpaneel heeft geen breedtekeuze: de klant kiest een standaardhoogte (of een eigen hoogte via 'Verlengde zijpanelen') en vult de diepte zelf in. De prijs volgt uit de maatwerkprijs per m² voor zijpanelen hieronder.",
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
        "Vaste prijs per breedte voor verlengde deuren. Alleen gebruikt als er geen maatwerkprijs per m² voor deuren is ingevuld. Beide leeg = optie verborgen bij Deuren. Eén entry per breedte.",
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
      title: "Verlengde hoekdeuren — prijs (vast)",
      type: "number",
      description:
        "Vaste prijs voor verlengde hoekdeuren, ongeacht maat. Alleen gebruikt als er geen maatwerkprijs per m² voor hoekdeuren is ingevuld. Beide leeg = optie verborgen bij Hoekdeuren.",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "pricePerM2Deuren",
      title: "Maatwerkprijs per m² — Deuren (€)",
      type: "number",
      description:
        "Rekenprijs voor verlengde deuren: prijs = (breedte × hoogte ÷ 10.000) × dit bedrag. Leeg laten = terugval op de vaste prijs per breedte hierboven.",
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: "pricePerM2Hoek",
      title: "Maatwerkprijs per m² — Hoekdeuren (€)",
      type: "number",
      description:
        "Rekenprijs voor verlengde hoekdeuren: prijs = (totale breedte × hoogte ÷ 10.000) × dit bedrag. Leeg laten = terugval op de vaste prijs hierboven.",
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: "pricePerM2Afwerk",
      title: "Maatwerkprijs per m² — Zijpaneel (€)",
      type: "number",
      description:
        "Rekenprijs voor zijpanelen: prijs = (diepte × hoogte ÷ 10.000) × dit bedrag. Een zijpaneel is altijd maatwerk, dus zonder dit bedrag is het type niet beschikbaar.",
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: "minCustomPrice",
      title: "Maatwerk — minimumprijs (€)",
      type: "number",
      description:
        "Ondergrens voor een maatwerkprijs, voor kleine panelen waar zagen en kantenband de kosten bepalen. Leeg laten = geen ondergrens.",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "afwerkHeightsCm",
      title: "Zijpaneel — standaardhoogtes (cm)",
      type: "array",
      of: [{ type: "number" }],
      description:
        "De hoogtes die een klant bij Zijpaneel kan aanklikken. Leeg laten = dezelfde hoogtes als bij Deuren.",
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: "afwerkMinHeightCm",
      title: "Verlengde zijpanelen — min. hoogte (cm)",
      type: "number",
      description:
        "Ondergrens voor de eigen hoogte bij verlengde zijpanelen. Standaard 200.",
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: "afwerkMaxHeightCm",
      title: "Verlengde zijpanelen — max. hoogte (cm)",
      type: "number",
      description:
        "Bovengrens voor de eigen hoogte bij verlengde zijpanelen. Standaard 300.",
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: "afwerkMinDepthCm",
      title: "Zijpaneel — min. diepte (cm)",
      type: "number",
      description:
        "Ondergrens voor het diepte-invoerveld bij Zijpaneel. Standaard 20. De diepte bepaalt de prijs niet.",
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: "afwerkMaxDepthCm",
      title: "Zijpaneel — max. diepte (cm)",
      type: "number",
      description: "Bovengrens voor het diepte-invoerveld bij Zijpaneel. Standaard 120.",
      validation: (Rule) => Rule.positive(),
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
          { title: "Los product", value: "simple" },
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
      name: "simpleConfig",
      title: "Product Configuratie",
      type: "simpleConfig",
      hidden: ({ document }) => document?.productType !== "simple",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const productType = (context.document as { productType?: string } | undefined)
            ?.productType;
          if (productType === "simple" && !value) {
            return "Product Configuratie is vereist voor losse producten.";
          }
          return true;
        }),
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
  simpleConfig,
  product,
];
