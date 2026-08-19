import "server-only";

import { groq } from "next-sanity";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { client } from "./client";
import { urlFor } from "./image";
import type { HotspotContent, HotspotPoint } from "@/components/hotspot-content";

interface RawPoint {
  _key: string;
  title?: string;
  body?: string;
  image?: SanityImageSource;
  x?: number;
  y?: number;
  label?: string;
  href?: string;
  ctaLabel?: string;
}

interface RawHotspotSection {
  eyebrow?: string;
  heading?: string;
  headingAccent?: string;
  intro?: string;
  baseImage?: SanityImageSource;
  baseImageAlt?: string;
  baseImageAspectRatio?: number;
  points?: RawPoint[];
}

const hotspotSectionQuery = groq`
  *[_type == "hotspotSection"][0]{
    eyebrow,
    heading,
    headingAccent,
    intro,
    baseImage,
    baseImageAlt,
    "baseImageAspectRatio": baseImage.asset->metadata.dimensions.aspectRatio,
    points[]{
      _key,
      title,
      body,
      image,
      x,
      y,
      label,
      href,
      ctaLabel
    }
  }
`;

/**
 * Returns the CMS version of the hotspot section, or null when the document
 * doesn't exist yet or is missing the parts the section can't render without —
 * the caller then falls back to the built-in content.
 */
export async function getHotspotSection(): Promise<HotspotContent | null> {
  const raw = await client.fetch<RawHotspotSection | null>(
    hotspotSectionQuery,
    {},
    { next: { revalidate: 60 } }
  );

  if (!raw?.heading || !raw.baseImage) return null;

  const points: HotspotPoint[] = (raw.points ?? [])
    .filter(
      (point): point is RawPoint & { image: SanityImageSource } =>
        Boolean(point.title && point.body && point.image) &&
        typeof point.x === "number" &&
        typeof point.y === "number"
    )
    .map((point) => ({
      name: point._key,
      label: point.label || point.title || "dit onderdeel",
      x: point.x as number,
      y: point.y as number,
      image: urlFor(point.image).width(1200).auto("format").url(),
      title: point.title as string,
      body: point.body as string,
      href: point.href || undefined,
      ctaLabel: point.ctaLabel || undefined,
    }));

  if (!points.length) return null;

  return {
    eyebrow: raw.eyebrow ?? "",
    heading: raw.heading,
    headingAccent: raw.headingAccent,
    intro: raw.intro,
    baseImage: urlFor(raw.baseImage).width(2400).auto("format").url(),
    baseImageAlt: raw.baseImageAlt ?? "",
    baseImageAspectRatio: raw.baseImageAspectRatio || 16 / 9,
    points,
  };
}
