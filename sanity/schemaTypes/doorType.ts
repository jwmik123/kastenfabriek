import { defineField, defineType } from "sanity";

export const doorType = defineType({
  name: "doorType",
  title: "Door Type",
  type: "document",
  fields: [
    defineField({
      name: "doorId",
      title: "Door ID",
      type: "slug",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price (€)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "variant",
      title: "Variant",
      type: "string",
      options: {
        list: [
          { title: "Standard (Large)", value: "standard" },
          { title: "Small", value: "small" },
          { title: "Veneer (Fineer)", value: "veneer" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
    }),
  ],
  preview: {
    select: {
      title: "name",
      price: "price",
      variant: "variant",
    },
    prepare({ title, price, variant }) {
      return {
        title: title,
        subtitle: `€${price} - ${variant}`,
      };
    },
  },
});
