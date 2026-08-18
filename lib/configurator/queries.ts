import { groq } from "next-sanity";

export const pricingDataQuery = groq`{
  "config": *[_type == "pricingConfig"][0] {
    currency,
    lastUpdated,
    led,
    deliveryPrice,
    constraints,
    freeMontage,
    slopedBackWallSurcharge,
    slopedSideWallSurchargePerSide
  },
  "mainsElectricityNotice": *[_type == "siteSettings"][0].mainsElectricityNotice,
  "modules": *[_type == "moduleLayout"] | order(layoutId asc) {
    layoutId,
    name,
    description,
    contents,
    priceDouble,
    priceSingle,
    availableForTopCabinet,
    sectionType
  },
  "accessories": *[_type == "accessory"] {
    "id": accessoryId.current,
    name,
    nameNl,
    price,
    category,
    perUnit,
    maxPerCorpus,
    availableForLowSection
  },
  "doors": *[_type == "doorType"] {
    "id": doorId.current,
    name,
    price,
    variant,
    description
  },
  "installation": *[_type == "installationTier"] | order(minTotal asc) {
    name,
    minTotal,
    maxTotal,
    price,
    days,
    people
  },
  "handles": *[_type == "handle"] | order(handleId.current asc) {
    "id": handleId.current,
    name,
    nameNl,
    productCode,
    "imageUrl": image.asset->url,
    price,
    heightCm,
    allowedMaterials,
    bodyColor,
    meshId,
    fitsLowModule,
    noRotationOnDrawer
  }
}`;

export const moduleLayoutsQuery = groq`
  *[_type == "moduleLayout"] | order(layoutId asc) {
    layoutId,
    name,
    description,
    contents,
    priceDouble,
    priceSingle,
    availableForTopCabinet,
    sectionType
  }
`;

export const accessoriesQuery = groq`
  *[_type == "accessory"] {
    "id": accessoryId.current,
    name,
    nameNl,
    price,
    category,
    perUnit,
    maxPerCorpus,
    availableForLowSection
  }
`;

export const doorTypesQuery = groq`
  *[_type == "doorType"] {
    "id": doorId.current,
    name,
    price,
    variant,
    description
  }
`;

export const installationTiersQuery = groq`
  *[_type == "installationTier"] | order(minTotal asc) {
    name,
    minTotal,
    maxTotal,
    price,
    days,
    people
  }
`;

export const pricingConfigQuery = groq`
  *[_type == "pricingConfig"][0] {
    currency,
    lastUpdated,
    led,
    deliveryPrice,
    constraints,
    freeMontage,
    slopedBackWallSurcharge,
    slopedSideWallSurchargePerSide
  }
`;
