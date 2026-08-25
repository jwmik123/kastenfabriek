import "server-only";

import { groq } from "next-sanity";
import type { PortableTextBlock } from "@portabletext/react";

import { client } from "./client";

export type ProductType = "pax-doors" | "samples";

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
  /** Flat "tot plafond" (custom-height) price for hoekdeuren. Absent = option hidden for hoek. */
  verlengdeHoekPrice?: number;
  /** Rate for custom sizes: (widthOrDepth × height / 10 000) × this. Drives zijpanelen and verlengde deuren. */
  pricePerM2?: number;
  /** Floor under a custom-size price, for panels too small to pay for their own sawing. */
  minCustomPrice?: number;
  /** Bounds for the zijpaneel height input. Default 50–300. */
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
}

const productListProjection = groq`
  _id,
  _createdAt,
  title,
  "slug": slug.current,
  productType,
  shortDescription,
  heroImage,
  "fromPrice": math::min(paxConfig.variants[].priceEur),
  "singlePrice": count(paxConfig.variants[].priceEur) == 1 ||
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
  sampleConfig
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
