import "server-only";

import { groq } from "next-sanity";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { client } from "./client";
import { urlFor } from "./image";

/** The cards under the homepage hero, in the order they're rendered. */
export type HomeProductOptionKey =
  | "kledingkast"
  | "wasmachinekast"
  | "ikeaPax"
  | "alleProducten";

export interface HomeProductOptionImage {
  src: string;
  /** Base64 blur placeholder from Sanity, when the asset has one. */
  blurDataURL?: string;
}

export type HomeProductOptionImages = Partial<
  Record<HomeProductOptionKey, HomeProductOptionImage>
>;

interface RawImage {
  asset?: unknown;
  lqip?: string;
}

type RawHomeProductOptions = Partial<Record<HomeProductOptionKey, RawImage>>;

const KEYS: HomeProductOptionKey[] = [
  "kledingkast",
  "wasmachinekast",
  "ikeaPax",
  "alleProducten",
];

/** The three cards are square; the bottom banner is a wide strip. */
const DIMENSIONS: Record<HomeProductOptionKey, { width: number; height: number }> = {
  kledingkast: { width: 900, height: 900 },
  wasmachinekast: { width: 900, height: 900 },
  ikeaPax: { width: 900, height: 900 },
  alleProducten: { width: 1800, height: 600 },
};

const imageProjection = KEYS.map(
  (key) => `${key}{ ..., "lqip": asset->metadata.lqip }`,
).join(",\n    ");

const query = groq`
  *[_type == "homeProductOptions"][0]{
    ${imageProjection}
  }
`;

/**
 * The editor-chosen photos for the homepage cards. Keys without an image are
 * simply absent, so the page keeps its built-in file for that card instead of
 * rendering a hole.
 */
export async function getHomeProductOptionImages(): Promise<HomeProductOptionImages> {
  const raw = await client.fetch<RawHomeProductOptions | null>(
    query,
    {},
    { next: { revalidate: 60 } },
  );

  if (!raw) return {};

  const images: HomeProductOptionImages = {};

  for (const key of KEYS) {
    const field = raw[key];
    if (!field?.asset) continue;

    const { width, height } = DIMENSIONS[key];
    images[key] = {
      src: urlFor(field as SanityImageSource)
        .width(width)
        .height(height)
        .fit("crop")
        .auto("format")
        .url(),
      blurDataURL: field.lqip,
    };
  }

  return images;
}
