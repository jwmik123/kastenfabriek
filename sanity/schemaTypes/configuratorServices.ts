import { defineArrayMember, defineField, defineType } from "sanity";

import { SERVICE_ICONS } from "@/lib/configurator/services";

/**
 * The services strip under both configurators. A singleton rather than a field
 * on `siteSettings`, because it is configurator copy and not a company detail.
 *
 * Keep the prices out of these texts — delivery and montage come from
 * `pricingConfig` and the montage tiers, so a number typed here goes stale
 * silently.
 */
export const configuratorServices = defineType({
  name: "configuratorServices",
  title: "Servicesbalk (configurator)",
  type: "document",
  fields: [
    defineField({
      name: "services",
      title: "Services",
      type: "array",
      description:
        "Wat we leveren, in de balk onder de configurator. Maximaal vier — ze staan naast elkaar op één regel.",
      of: [
        defineArrayMember({
          type: "object",
          name: "service",
          fields: [
            defineField({
              name: "icon",
              title: "Icoon",
              type: "string",
              options: { list: [...SERVICE_ICONS] },
              initialValue: "wrench",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "title",
              title: "Titel",
              type: "string",
              validation: (Rule) =>
                Rule.required().max(40).warning("Kort houden — dit is één regel."),
            }),
            defineField({
              name: "description",
              title: "Toelichting",
              type: "string",
              validation: (Rule) =>
                Rule.required().max(90).warning("Kort houden — dit zijn twee regels."),
            }),
          ],
          preview: {
            select: { title: "title", subtitle: "description" },
          },
        }),
      ],
      validation: (Rule) => Rule.min(1).max(4),
    }),
  ],
  preview: {
    select: { services: "services" },
    prepare({ services }) {
      const count = Array.isArray(services) ? services.length : 0;
      return {
        title: "Servicesbalk",
        subtitle: count === 1 ? "1 service" : `${count} services`,
      };
    },
  },
});
