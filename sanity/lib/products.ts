import "server-only";

import { groq } from "next-sanity";
import type { PortableTextBlock } from "@portabletext/react";

import { client } from "./client";

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

/** A plain webshop article — no configurator, one price, pick a quantity. */
export interface SimpleConfig {
  priceEur: number;
  sku?: string;
  /** Ceiling for the quantity stepper. Absent = 10. */
  maxQuantity?: number;
}

export interface ProductListItem {
  _id: string;
  _createdAt: string;
  title: string;
  slug: string;
  productType: ProductType;
  shortDescription: string;
  heroImage?: SanityImageRef;
  /** Lowest variant price for pax-doors; null for samples (free). */
  fromPrice: number | null;
  /** True when only one price exists, so no "vanaf" prefix is needed. */
  singlePrice: boolean;
  /** Samples only: how many swatches a customer may pick. */
  maxSamples: number | null;
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
  "fromPrice": coalesce(simpleConfig.priceEur, math::min(paxConfig.variants[].priceEur)),
  "singlePrice": defined(simpleConfig.priceEur) ||
    count(paxConfig.variants[].priceEur) == 1 ||
    math::min(paxConfig.variants[].priceEur) == math::max(paxConfig.variants[].priceEur),
  "maxSamples": sampleConfig.maxSelections
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
  paxConfig,
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

export async function getActiveProducts(): Promise<ProductListItem[]> {
  return client.fetch<ProductListItem[]>(activeProductsQuery);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return client.fetch<Product | null>(productBySlugQuery, { slug });
}
