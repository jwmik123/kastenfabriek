import { defineField, defineType } from "sanity";

export const coupon = defineType({
  name: "coupon",
  title: "Coupon",
  type: "document",
  fields: [
    defineField({
      name: "code",
      title: "Code",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "discountType",
      title: "Discount Type",
      type: "string",
      options: {
        list: [
          { title: "Percentage (%)", value: "percent" },
          { title: "Fixed Amount (€)", value: "fixed" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "discountValue",
      title: "Discount Value",
      type: "number",
      description: "Percentage (0–100) or fixed euro amount",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "expiresAt",
      title: "Expires At",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "maxUses",
      title: "Maximum Uses",
      type: "number",
      validation: (Rule) => Rule.required().min(1).integer(),
    }),
    defineField({
      name: "currentUses",
      title: "Current Uses",
      type: "number",
      initialValue: 0,
      readOnly: true,
      validation: (Rule) => Rule.required().min(0).integer(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "string",
    }),
  ],
  preview: {
    select: {
      code: "code",
      discountType: "discountType",
      discountValue: "discountValue",
      currentUses: "currentUses",
      maxUses: "maxUses",
    },
    prepare({ code, discountType, discountValue, currentUses, maxUses }) {
      const discount =
        discountType === "percent"
          ? `${discountValue}%`
          : `€${discountValue}`;
      return {
        title: code,
        subtitle: `${discount} — ${currentUses ?? 0}/${maxUses} uses`,
      };
    },
  },
});
