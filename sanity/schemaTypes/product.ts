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

/** A simple product flagged as a service: no quantity, no delivery. */
const isServiceDoc = (document: unknown) => {
  const d = document as { productType?: string; simpleConfig?: { isService?: boolean } } | undefined;
  return d?.productType === "simple" && Boolean(d.simpleConfig?.isService);
};

// Nested config objects are validated even when hidden (other productType),
// so required-checks inside them must only fire for their own productType.
const requiredFor =
  (productType: string, message: string) =>
  (value: unknown, context: { document?: unknown }) => {
    const current = (context.document as { productType?: string } | undefined)
      ?.productType;
    if (current !== productType) return true;
    const empty =
      value === undefined || value === null || (Array.isArray(value) && value.length === 0);
    return empty ? message : true;
  };

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
      validation: (Rule) =>
        Rule.integer()
          .min(1)
          .max(10)
          .custom(requiredFor("samples", "Max aantal stalen is vereist.")),
    }),
  ],
});

const simpleOptionValue = defineType({
  name: "simpleOptionValue",
  title: "Keuze",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Naam",
      type: "string",
      description: "Wat de klant ziet, bv. \"Zwart\" of \"120 cm\".",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "priceDeltaEur",
      title: "Meerprijs (\u20ac)",
      type: "number",
      description:
        "Komt bovenop de basisprijs. Leeg laten = zelfde prijs. Negatief mag, voor een goedkopere uitvoering.",
    }),
    defineField({
      name: "colorHex",
      title: "Kleurstaal (hex)",
      type: "string",
      description: "Optioneel, bv. #1f2a20. Toont een rondje in deze kleur naast de naam.",
      validation: (Rule) =>
        Rule.regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, { name: "hex-kleur" }),
    }),
    defineField({
      name: "image",
      title: "Foto",
      type: "image",
      options: { hotspot: true },
      description: "Optioneel. Wordt de hoofdfoto zodra de klant deze keuze maakt.",
    }),
  ],
  preview: {
    select: { title: "label", delta: "priceDeltaEur", media: "image" },
    prepare({ title, delta, media }) {
      return {
        title,
        subtitle: delta ? `${delta > 0 ? "+" : ""}\u20ac${delta}` : undefined,
        media,
      };
    },
  },
});

const simpleOptionGroup = defineType({
  name: "simpleOptionGroup",
  title: "Optie",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Naam",
      type: "string",
      description: "Bv. \"Kleur\" of \"Maat\".",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "values",
      title: "Keuzes",
      type: "array",
      of: [{ type: "simpleOptionValue" }],
      description: "De eerste keuze staat standaard geselecteerd.",
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .custom((values) => {
            const labels = ((values ?? []) as { label?: string }[]).map((v) =>
              v.label?.trim().toLowerCase(),
            );
            const dup = labels.filter((l, i) => l && labels.indexOf(l) !== i);
            return dup.length ? `Dubbele keuze(s): ${[...new Set(dup)].join(", ")}` : true;
          }),
    }),
  ],
  preview: {
    select: { title: "name", values: "values" },
    prepare({ title, values }) {
      const labels = ((values ?? []) as { label?: string }[]).map((v) => v.label);
      return { title, subtitle: labels.filter(Boolean).join(", ") };
    },
  },
});

const simpleConfig = defineType({
  name: "simpleConfig",
  title: "Product Configuratie",
  type: "object",
  description:
    "Voor losse producten en diensten zonder configurator: een lade, een hanger, montage. Optioneel met keuzes zoals kleur of maat.",
  fields: [
    defineField({
      name: "isService",
      title: "Dienst",
      type: "boolean",
      initialValue: false,
      description:
        "Aan = een dienst (bv. montage of inmeten): geen aantal-teller en geen bezorgkosten. De klant bestelt hem één keer.",
    }),
    defineField({
      name: "priceEur",
      title: "Prijs (\u20ac)",
      type: "number",
      description: "Stuksprijs, exclusief bezorgkosten.",
      validation: (Rule) =>
        Rule.min(0).custom(requiredFor("simple", "Prijs is vereist.")),
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
      hidden: ({ parent }) => Boolean((parent as { isService?: boolean } | undefined)?.isService),
      validation: (Rule) => Rule.integer().min(1),
    }),
    defineField({
      name: "optionGroups",
      title: "Opties",
      type: "array",
      of: [{ type: "simpleOptionGroup" }],
      description:
        "Keuzes die de klant maakt, zoals kleur of maat. Leeg laten = geen keuzes. Per keuze kan een meerprijs en een eigen foto.",
      validation: (Rule) =>
        Rule.custom((groups) => {
          const names = ((groups ?? []) as { name?: string }[]).map((g) =>
            g.name?.trim().toLowerCase(),
          );
          const dup = names.filter((n, i) => n && names.indexOf(n) !== i);
          return dup.length ? `Dubbele optie(s): ${[...new Set(dup)].join(", ")}` : true;
        }),
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
      validation: (Rule) =>
        Rule.custom(
          requiredFor("pax-doors", "Minimaal één variant in de prijsmatrix is vereist."),
        ),
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

export const productCategory = defineType({
  name: "productCategory",
  title: "Productcategorie",
  type: "document",
  description:
    "Groepering in de webshop, bv. \"Diensten\" of \"Accessoires\". Een product zonder categorie valt terug op zijn producttype.",
  fields: [
    defineField({
      name: "title",
      title: "Naam",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Volgorde",
      type: "number",
      description: "Lager = eerder in het filter. Leeg = achteraan.",
    }),
  ],
  orderings: [
    { title: "Volgorde", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
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
          { title: "Los product / dienst", value: "simple" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Categorie",
      type: "reference",
      to: [{ type: "productCategory" }],
      description:
        "Waar het product in de webshop onder valt. Leeg laten = standaard bij het producttype (bv. \"Losse producten\"). Voor een dienst: maak een categorie \"Diensten\" en kies producttype \"Los product / dienst\".",
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
      hidden: ({ document }) => document?.productType === "samples" || isServiceDoc(document),
      description: "Niet van toepassing op materiaalstalen (altijd gratis) en diensten.",
      validation: (Rule) =>
        Rule.min(0).custom((value, context) => {
          const productType = (context.document as { productType?: string } | undefined)
            ?.productType;
          if (
            productType !== "samples" &&
            !isServiceDoc(context.document) &&
            (value === undefined || value === null)
          ) {
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
  simpleOptionValue,
  simpleOptionGroup,
  simpleConfig,
  productCategory,
  product,
];
