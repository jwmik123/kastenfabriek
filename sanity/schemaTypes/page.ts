import { defineField, defineType } from "sanity";

export const page = defineType({
  name: "page",
  title: "Pagina",
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
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta beschrijving",
      type: "text",
      description: "SEO beschrijving (max 160 karakters)",
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: "heroImage",
      title: "Hero afbeelding",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "content",
      title: "Inhoud",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "Quote", value: "blockquote" },
          ],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
            ],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Link",
                fields: [
                  {
                    name: "href",
                    type: "url",
                    title: "URL",
                  },
                ],
              },
            ],
          },
        },
        {
          type: "image",
          options: { hotspot: true },
        },
      ],
    }),
    defineField({
      name: "isPublished",
      title: "Gepubliceerd",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "heroImage",
    },
  },
});
