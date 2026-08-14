import "server-only";

import { groq } from "next-sanity";
import type { PortableTextBlock } from "@portabletext/react";

import { client } from "./client";
import type { SanityImageRef } from "./products";

export type KennisbankMediaType = "artikel" | "video" | "pdf";

export interface KennisbankCategory {
  _id: string;
  title: string;
  slug: string;
}

export interface KennisbankFile {
  url: string;
  /** Bytes; used to show the download size next to a PDF. */
  size?: number;
  extension?: string;
  originalFilename?: string;
}

export interface KennisbankItem {
  _id: string;
  title: string;
  slug: string;
  mediaType: KennisbankMediaType;
  excerpt: string;
  coverImage: SanityImageRef & { alt?: string };
  categories: KennisbankCategory[];
  publishedAt: string;
  body?: PortableTextBlock[];
  videoUrl?: string;
  videoFile?: KennisbankFile;
  pdfFile?: KennisbankFile;
  seoDescription?: string;
}

/** Card data — no body, so the overview stays a small payload. */
export type KennisbankCardItem = Omit<KennisbankItem, "body">;

const CATEGORY_FIELDS = groq`
  _id,
  title,
  "slug": slug.current
`;

const FILE_FIELDS = groq`
  "url": asset->url,
  "size": asset->size,
  "extension": asset->extension,
  "originalFilename": asset->originalFilename
`;

const CARD_FIELDS = groq`
  _id,
  title,
  "slug": slug.current,
  mediaType,
  excerpt,
  coverImage,
  publishedAt,
  seoDescription,
  videoUrl,
  videoFile { ${FILE_FIELDS} },
  pdfFile { ${FILE_FIELDS} },
  "categories": categories[]->{ ${CATEGORY_FIELDS} }
`;

const itemsQuery = groq`
  *[_type == "kennisbankItem" && defined(slug.current)]
    | order(publishedAt desc) { ${CARD_FIELDS} }
`;

const itemBySlugQuery = groq`
  *[_type == "kennisbankItem" && slug.current == $slug][0] {
    ${CARD_FIELDS},
    body
  }
`;

const relatedQuery = groq`
  *[_type == "kennisbankItem" && slug.current != $slug && defined(slug.current)
    && count((categories[]->_id)[@ in $categoryIds]) > 0]
    | order(publishedAt desc)[0...3] { ${CARD_FIELDS} }
`;

const latestQuery = groq`
  *[_type == "kennisbankItem" && slug.current != $slug && defined(slug.current)]
    | order(publishedAt desc)[0...3] { ${CARD_FIELDS} }
`;

const categoriesQuery = groq`
  *[_type == "kennisbankCategory"] | order(order asc, title asc) { ${CATEGORY_FIELDS} }
`;

export async function getKennisbankItems(): Promise<KennisbankCardItem[]> {
  return client.fetch(itemsQuery);
}

export async function getKennisbankCategories(): Promise<KennisbankCategory[]> {
  return client.fetch(categoriesQuery);
}

export async function getKennisbankItem(
  slug: string,
): Promise<KennisbankItem | null> {
  return client.fetch(itemBySlugQuery, { slug });
}

/** Items sharing a category, topped up with the newest items when too few. */
export async function getRelatedKennisbankItems(
  item: Pick<KennisbankItem, "slug" | "categories">,
): Promise<KennisbankCardItem[]> {
  const categoryIds = (item.categories ?? []).map((c) => c._id);
  const related: KennisbankCardItem[] = categoryIds.length
    ? await client.fetch(relatedQuery, { slug: item.slug, categoryIds })
    : [];
  if (related.length >= 3) return related;

  const latest: KennisbankCardItem[] = await client.fetch(latestQuery, {
    slug: item.slug,
  });
  const seen = new Set(related.map((r) => r._id));
  return [...related, ...latest.filter((l) => !seen.has(l._id))].slice(0, 3);
}

export async function getKennisbankSlugs(): Promise<string[]> {
  return client.fetch(
    groq`*[_type == "kennisbankItem" && defined(slug.current)].slug.current`,
  );
}
