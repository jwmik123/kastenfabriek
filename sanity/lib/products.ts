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

export interface PaxMaterialSurcharge {
  materialId: string;
  surchargeEur: number;
}

export interface PaxConfig {
  widths: number[];
  heights: number[];
  variants: PaxVariant[];
  allowedMaterialIds?: string[];
  materialSurcharges?: PaxMaterialSurcharge[];
  hingeSide?: "left" | "right";
}

export interface SampleConfig {
  maxSelections: number;
}

export interface ProductListItem {
  _id: string;
  title: string;
  slug: string;
  productType: ProductType;
  shortDescription: string;
  heroImage?: SanityImageRef;
  /** Lowest variant price for pax-doors; null for samples (free). */
  fromPrice: number | null;
  /** True when only one price exists, so no "vanaf" prefix is needed. */
  singlePrice: boolean;
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
  title,
  "slug": slug.current,
  productType,
  shortDescription,
  heroImage,
  "fromPrice": math::min(paxConfig.variants[].priceEur),
  "singlePrice": count(paxConfig.variants[].priceEur) == 1 ||
    math::min(paxConfig.variants[].priceEur) == math::max(paxConfig.variants[].priceEur)
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
