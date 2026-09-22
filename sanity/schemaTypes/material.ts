import { createElement } from "react";
import { defineField, defineType } from "sanity";

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

type MaterialDoc = { materialType?: "color" | "texture" } | undefined;
const isColor = (doc: unknown) => (doc as MaterialDoc)?.materialType !== "texture";
const isTexture = (doc: unknown) => (doc as MaterialDoc)?.materialType === "texture";

export const material = defineType({
  name: "material",
  title: "Materiaal",
  type: "document",
  description:
    "Een kleur of houtdecor voor de kasten. Verschijnt in de configurators, de stalenaanvraag en de webshop.",
  fieldsets: [
    {
      name: "advanced",
      title: "Extra texturen (optioneel)",
      description: "Alleen invullen als de leverancier deze beelden aanlevert.",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Naam",
      type: "string",
      description: "Zoals de klant hem ziet, bv. \"Eucalyptus Groen\".",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "materialId",
      title: "Code",
      type: "slug",
      description:
        "Vaste sleutel voor bestellingen en winkelwagens. Wordt automatisch gemaakt uit de naam. Niet meer wijzigen zodra het materiaal gebruikt is: bestaande bestellingen verwijzen ernaar.",
      options: { source: "name", maxLength: 64 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "materialType",
      title: "Soort",
      type: "string",
      options: {
        list: [
          { title: "Effen kleur", value: "color" },
          { title: "Houtdecor (foto)", value: "texture" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "color",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "color",
      title: "Kleur (hex)",
      type: "string",
      description: "Bv. #747F74. Deze kleur krijgt de kast in de 3D-weergave.",
      hidden: ({ document }) => !isColor(document),
      validation: (Rule) =>
        Rule.custom((value, { document }) => {
          if (!isColor(document)) return true;
          if (!value) return "Vul een kleur in.";
          return HEX.test(value as string) || "Gebruik een hex-kleur, bv. #747F74.";
        }),
    }),
    defineField({
      name: "texture",
      title: "Decorfoto",
      type: "image",
      description:
        "Naadloze, rechte foto van het decor met de nerf verticaal (liefst 768 px breed of meer). Wordt gebruikt voor de staaltjes en op de kast in 3D.",
      hidden: ({ document }) => !isTexture(document),
      validation: (Rule) =>
        Rule.custom((value, { document }) =>
          !isTexture(document) || (value as { asset?: unknown } | undefined)?.asset
            ? true
            : "Upload een decorfoto.",
        ),
    }),
    defineField({
      name: "normalMap",
      title: "Normal map",
      type: "image",
      fieldset: "advanced",
      description: "Geeft reliëf aan de nerf in 3D.",
      hidden: ({ document }) => !isTexture(document),
    }),
    defineField({
      name: "roughnessMap",
      title: "Roughness map",
      type: "image",
      fieldset: "advanced",
      description: "Bepaalt welke delen van het decor meer of minder glanzen.",
      hidden: ({ document }) => !isTexture(document),
    }),
    defineField({
      name: "roomImages",
      title: "Sfeerfoto's",
      type: "array",
      of: [{ type: "image" }],
      description:
        "Twee foto's van een kast in dit materiaal, voor \"Bekijk in …\" onder de configurator. Zonder foto's staat het materiaal daar niet tussen.",
      validation: (Rule) => Rule.max(2),
    }),
    defineField({
      name: "outsideOnly",
      title: "Alleen voor de buitenkant",
      type: "boolean",
      description: "Aan = niet te kiezen voor de binnenkant van de kast.",
      initialValue: false,
    }),
    defineField({
      name: "active",
      title: "Beschikbaar",
      type: "boolean",
      description:
        "Uit = verborgen voor klanten. Gebruik dit in plaats van verwijderen, zodat oude bestellingen de naam blijven tonen.",
      initialValue: true,
    }),
    defineField({
      name: "sortOrder",
      title: "Volgorde",
      type: "number",
      description: "Lager = eerder in de lijst. Houtdecors en kleuren worden in de configurator apart gegroepeerd.",
      initialValue: 100,
    }),
  ],
  orderings: [
    {
      title: "Volgorde",
      name: "sortOrderAsc",
      by: [
        { field: "sortOrder", direction: "asc" },
        { field: "name", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: {
      name: "name",
      type: "materialType",
      color: "color",
      texture: "texture",
      active: "active",
      outsideOnly: "outsideOnly",
    },
    prepare({ name, type, color, texture, active, outsideOnly }) {
      const tags = [
        type === "texture" ? "Houtdecor" : "Kleur",
        outsideOnly ? "alleen buiten" : null,
        active === false ? "niet beschikbaar" : null,
      ].filter(Boolean);
      return {
        title: name,
        subtitle: tags.join(" · "),
        media:
          type === "texture"
            ? texture
            : createElement("span", {
                style: {
                  display: "block",
                  width: "100%",
                  height: "100%",
                  background: color ?? "transparent",
                },
              }),
      };
    },
  },
});
