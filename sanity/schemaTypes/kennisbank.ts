import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * Kennisbank — one document type for every kind of knowledge item, split by
 * `mediaType`. Keeping articles, videos and PDFs in one type lets the overview
 * show a single grid with one sort order and one set of filters.
 */

export const kennisbankCategory = defineType({
  name: "kennisbankCategory",
  title: "Kennisbank categorie",
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
      name: "order",
      title: "Volgorde",
      type: "number",
      description: "Bepaalt de volgorde van de filterknoppen. Laag = eerst.",
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: "Volgorde",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "slug.current" },
  },
});

const MEDIA_TYPES = [
  { title: "Artikel", value: "artikel" },
  { title: "Video", value: "video" },
  { title: "PDF / handleiding", value: "pdf" },
] as const;

export const kennisbankItem = defineType({
  name: "kennisbankItem",
  title: "Kennisbank item",
  type: "document",
  groups: [
    { name: "content", title: "Inhoud", default: true },
    { name: "media", title: "Media" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "mediaType",
      title: "Soort",
      type: "string",
      group: "content",
      options: { list: [...MEDIA_TYPES], layout: "radio" },
      initialValue: "artikel",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      title: "Titel",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Samenvatting",
      type: "text",
      rows: 3,
      group: "content",
      description: "Korte tekst op de kaart in het overzicht en in zoekresultaten.",
      validation: (Rule) => Rule.required().max(280),
    }),
    defineField({
      name: "coverImage",
      title: "Omslagafbeelding",
      type: "image",
      group: "content",
      options: { hotspot: true },
      description:
        "Wordt gebruikt op de kaart en als poster van de video. Upload minimaal 1600 px breed; de site schaalt en comprimeert zelf.",
      fields: [
        defineField({
          name: "alt",
          title: "Alt-tekst",
          type: "string",
          description: "Beschrijving voor schermlezers en zoekmachines.",
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "categories",
      title: "Categorieën",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "reference", to: [{ type: "kennisbankCategory" }] })],
      description: "Bepaalt onder welke filters dit item verschijnt.",
    }),
    defineField({
      name: "publishedAt",
      title: "Publicatiedatum",
      type: "datetime",
      group: "content",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),

    // ── Artikel ──────────────────────────────────────────────────────────────
    defineField({
      name: "body",
      title: "Artikeltekst",
      type: "array",
      group: "content",
      hidden: ({ parent }) => parent?.mediaType !== "artikel",
      of: [
        defineArrayMember({ type: "block" }),
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", title: "Alt-tekst", type: "string" }),
            defineField({ name: "caption", title: "Bijschrift", type: "string" }),
          ],
        }),
      ],
      validation: (Rule) =>
        Rule.custom((body, ctx) => {
          const type = (ctx.parent as { mediaType?: string })?.mediaType;
          if (type !== "artikel") return true;
          return (body as unknown[] | undefined)?.length
            ? true
            : "Een artikel heeft tekst nodig.";
        }),
    }),

    // ── Video ────────────────────────────────────────────────────────────────
    defineField({
      name: "videoUrl",
      title: "Video-URL (YouTube of Vimeo)",
      type: "url",
      group: "media",
      hidden: ({ parent }) => parent?.mediaType !== "video",
      description:
        "Aanbevolen voor langere video's: de speler laadt pas als de bezoeker op play klikt.",
    }),
    defineField({
      name: "videoFile",
      title: "Video-bestand (MP4)",
      type: "file",
      group: "media",
      hidden: ({ parent }) => parent?.mediaType !== "video",
      options: { accept: "video/mp4,video/webm" },
      description:
        "Alleen voor korte clips: upload MP4 (H.264) of WebM van maximaal ~50 MB. Grotere video's beter via YouTube of Vimeo.",
    }),

    // ── PDF ──────────────────────────────────────────────────────────────────
    defineField({
      name: "pdfFile",
      title: "PDF-bestand",
      type: "file",
      group: "media",
      hidden: ({ parent }) => parent?.mediaType !== "pdf",
      options: { accept: "application/pdf" },
    }),

    defineField({
      name: "seoDescription",
      title: "SEO-omschrijving",
      type: "text",
      rows: 2,
      group: "seo",
      description: "Leeg laten = de samenvatting wordt gebruikt.",
      validation: (Rule) => Rule.max(200),
    }),
  ],

  // Media fields are conditionally hidden, so their "required" lives here —
  // one place that knows which combination is valid.
  validation: (Rule) =>
    Rule.custom((doc) => {
      const item = doc as {
        mediaType?: string;
        videoUrl?: string;
        videoFile?: { asset?: unknown };
        pdfFile?: { asset?: unknown };
      };
      if (item?.mediaType === "video" && !item.videoUrl && !item.videoFile?.asset) {
        return "Kies een video-URL of upload een videobestand.";
      }
      if (item?.mediaType === "pdf" && !item.pdfFile?.asset) {
        return "Upload een PDF-bestand.";
      }
      return true;
    }),

  orderings: [
    {
      title: "Nieuwste eerst",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],

  preview: {
    select: {
      title: "title",
      mediaType: "mediaType",
      publishedAt: "publishedAt",
      media: "coverImage",
    },
    prepare({ title, mediaType, publishedAt, media }) {
      const label =
        MEDIA_TYPES.find((t) => t.value === mediaType)?.title ?? mediaType;
      const date = publishedAt
        ? new Date(publishedAt).toLocaleDateString("nl-NL")
        : "geen datum";
      return { title, subtitle: `${label} · ${date}`, media };
    },
  },
});

export const kennisbankSchemaTypes = [kennisbankCategory, kennisbankItem];
