import "server-only";

import { groq } from "next-sanity";
import type { PortableTextBlock } from "@portabletext/react";

import { client } from "./client";
import { DEFAULT_MAX_SAMPLES } from "@/lib/products/samples";

export type ProductType = "pax-doors" | "samples" | "simple";

export interface SanityImageRef {
  asset: { _ref: string; _type: "reference" };
  hotspot?: unknown;
  crop?: unknown;
}

export interface PaxVariant {
  widthCm: number;
  heightCm: number;
  priceEur: number;
}

export interface PaxHoekVariant {
  widthLabel: string;
  /** Both panels together, in cm. Falls back to the numbers in `widthLabel` when absent. */
  widthTotalCm?: number;
  heightCm: number;
  priceEur: number;
}

export interface PaxMaterialSurcharge {
  materialId: string;
  surchargeEur: number;
}

export type PaxDoorType = "deuren" | "hoekdeuren" | "afwerkpaneel";

export interface PaxVerlengdePrice {
  widthCm: number;
  priceEur: number;
}

export interface PaxConfig {
  /** @deprecated UI now derives widths/heights from each type's variants. */
  widths?: number[];
  /** @deprecated UI now derives widths/heights from each type's variants. */
  heights?: number[];
  variants: PaxVariant[];
  /** Price matrix for the "hoekdeuren" type (width is a free label). Absent/empty = type unavailable. */
  hoekVariants?: PaxHoekVariant[];
  /** Offer the "afwerkpaneel" type. Its size is fully custom and priced from `pricePerM2`. */
  afwerkEnabled?: boolean;
  /** Per-width price for custom-height ("verlengde") deuren. Absent/empty = option hidden. */
  verlengdePrices?: PaxVerlengdePrice[];
  /** Flat verlengde (custom-height) price for hoekdeuren. Absent = fall back to the m² rate. */
  verlengdeHoekPrice?: number;
  /**
   * Rates for custom sizes: (widthOrDepth × height / 10 000) × the rate for the
   * type. Deuren and hoekdeuren fall back to their flat prices when unset; a
   * zijpaneel is unavailable without one, since it is always made to measure.
   */
  pricePerM2Deuren?: number;
  pricePerM2Hoek?: number;
  pricePerM2Afwerk?: number;
  /** Floor under a custom-size price, for panels too small to pay for their own sawing. */
  minCustomPrice?: number;
  /** Standard heights offered for a zijpaneel. Empty = fall back to the deuren heights. */
  afwerkHeightsCm?: number[];
  /** Bounds for a verlengd zijpaneel's own height. Default 200–300. */
  afwerkMinHeightCm?: number;
  afwerkMaxHeightCm?: number;
  verlengdeMinHeightCm?: number;
  verlengdeMaxHeightCm?: number;
  /** Bounds for the zijpaneel depth input. Depth is a production detail, not priced. */
  afwerkMinDepthCm?: number;
  afwerkMaxDepthCm?: number;
  allowedMaterialIds?: string[];
  materialSurcharges?: PaxMaterialSurcharge[];
  hingeSide?: "left" | "right";
}

export interface SampleConfig {
  maxSelections: number;
}

export interface SimpleOptionValue {
  _key: string;
  label: string;
  /** Added to the base price; may be negative. Absent = same price. */
  priceDeltaEur?: number;
  /** Swatch colour shown next to the label, e.g. "#1f2a20". */
  colorHex?: string;
  /** Replaces the hero image while this value is selected. */
  image?: SanityImageRef;
}

/** One choice a customer makes on a simple product, e.g. "Kleur" or "Maat". */
export interface SimpleOptionGroup {
  _key: string;
  name: string;
  values: SimpleOptionValue[];
}

/** A plain webshop article or service — no configurator, a base price, optional choices. */
export interface SimpleConfig {
  /** A service (montage, inmeten): ordered once, no delivery fee. */
  isService?: boolean;
  priceEur: number;
  sku?: string;
  /** Ceiling for the quantity stepper. Absent = 10. */
  maxQuantity?: number;
  optionGroups?: SimpleOptionGroup[];
}

export interface ProductListItem {
  _id: string;
  _createdAt: string;
  title: string;
  slug: string;
  productType: ProductType;
  /** Title of the Sanity productCategory, when one is set. */
  category: string | null;
  shortDescription: string;
  heroImage?: SanityImageRef;
  /** Lowest variant price for pax-doors; null for samples (free). */
  fromPrice: number | null;
  /** True when only one price exists, so no "vanaf" prefix is needed. */
  singlePrice: boolean;
  /** Samples only: how many swatches a customer may pick. */
  maxSamples: number | null;
  /** Simple products flagged as a service — nothing to keep in stock. */
  isService: boolean;
}

export interface Product {
  _id: string;
  title: string;
  slug: string;
  productType: ProductType;
  isActive: boolean;
  shortDescription: string;
  longDescription: PortableTextBlock[];
  heroImage: SanityImageRef;
  gallery?: SanityImageRef[];
  productInfo?: PortableTextBlock[];
  deliveryFee?: number;
  paxConfig?: PaxConfig;
  sampleConfig?: SampleConfig;
  simpleConfig?: SimpleConfig;
}

const productListProjection = groq`
  _id,
  _createdAt,
  title,
  "slug": slug.current,
  productType,
  shortDescription,
  heroImage,
  "category": category->title,
  "fromPrice": coalesce(simpleConfig.priceEur, math::min(paxConfig.variants[].priceEur)),
  "singlePrice": defined(simpleConfig.priceEur) ||
    count(paxConfig.variants[].priceEur) == 1 ||
    math::min(paxConfig.variants[].priceEur) == math::max(paxConfig.variants[].priceEur),
  "maxSamples": sampleConfig.maxSelections,
  "isService": productType == "simple" && simpleConfig.isService == true,
  "optionDeltas": simpleConfig.optionGroups[]{ "deltas": values[].priceDeltaEur }
`;

const productProjection = groq`
  _id,
  title,
  "slug": slug.current,
  productType,
  isActive,
  shortDescription,
  longDescription,
  heroImage,
  gallery,
  productInfo,
  deliveryFee,
  paxConfig{
    ...,
    "allowedMaterialIds": allowedMaterials[]->materialId.current,
    "materialSurcharges": materialSurcharges[]{
      "materialId": material->materialId.current,
      surchargeEur
    }
  },
  sampleConfig,
  simpleConfig
`;

export const activeProductsQuery = groq`
  *[_type == "product" && isActive == true] | order(title asc) {
    ${productListProjection}
  }
`;

export const productBySlugQuery = groq`
  *[_type == "product" && slug.current == $slug && isActive == true][0] {
    ${productProjection}
  }
`;

type ProductListRow = ProductListItem & {
  optionDeltas: { deltas: (number | null)[] | null }[] | null;
};

export async function getActiveProducts(): Promise<ProductListItem[]> {
  const rows = await client.fetch<ProductListRow[]>(activeProductsQuery);
  // Simple products with priced options start at the cheapest pick per option,
  // and are only a single price when no option moves it.
  return rows.map(({ optionDeltas, ...p }) => {
    if (p.productType !== "simple" || p.fromPrice == null || !optionDeltas?.length) return p;
    const perGroup = optionDeltas.map((g) => (g.deltas ?? []).map((d) => d ?? 0));
    const fromPrice =
      p.fromPrice + perGroup.reduce((sum, ds) => sum + (ds.length ? Math.min(...ds) : 0), 0);
    const singlePrice = perGroup.every((ds) => ds.every((d) => d === ds[0]));
    return { ...p, fromPrice, singlePrice };
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return client.fetch<Product | null>(productBySlugQuery, { slug });
}

const maxSampleSelectionsQuery = groq`
  *[_type == "product" && productType == "samples" && isActive == true][0].sampleConfig.maxSelections
`;

/** "Max aantal stalen" from the samples product — the same number the page enforces. */
export async function getMaxSampleSelections(): Promise<number> {
  const max = await client.fetch<number | null>(maxSampleSelectionsQuery);
  return max ?? DEFAULT_MAX_SAMPLES;
}
