import { defineField, defineType } from "sanity";

export const accessory = defineType({
  name: "accessory",
  title: "Accessory",
  type: "document",
  fields: [
    defineField({
      name: "accessoryId",
      title: "Accessory ID",
      type: "slug",
      description: 'Unique identifier (e.g., "extra-shelf", "drawer")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "nameNl",
      title: "Name (Dutch)",
      type: "string",
      description: "Dutch name for display",
    }),
    defineField({
      name: "price",
      title: "Price (€)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Interior", value: "interior" },
          { title: "Mechanism", value: "mechanism" },
          { title: "Electrical", value: "electrical" },
          { title: "Upgrade", value: "upgrade" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "perUnit",
      title: "Priced Per Unit",
      type: "boolean",
      description: "True = price per item, False = price per corpus",
      initialValue: true,
    }),
    defineField({
      name: "maxPerCorpus",
      title: "Max Per Corpus",
      type: "number",
      description: "Maximum quantity allowed per corpus (optional)",
    }),
  ],
  preview: {
    select: {
      title: "name",
      price: "price",
      category: "category",
    },
    prepare({ title, price, category }) {
      return {
        title: title,
        subtitle: `€${price} - ${category}`,
      };
    },
  },
});
