import "server-only";

import { groq } from "next-sanity";
import type { PortableTextBlock } from "@portabletext/types";

import { client } from "./client";
import {
  LEGAL_DOCUMENTS,
  type LegalDocumentKey,
  type LegalDocumentMeta,
} from "@/lib/legal";

export interface SiteAddress {
  street?: string;
  postalCode?: string;
  city?: string;
  country?: string;
}

export interface SiteSocialMedia {
  instagram?: string;
  facebook?: string;
  pinterest?: string;
  linkedin?: string;
}

export interface PromoBanner {
  /** The strip above the navigation, on every page. */
  topBar?: PortableTextBlock[];
  /** The wider strip under the homepage hero. */
  homepage?: PortableTextBlock[];
}

export interface SiteSettings {
  siteName?: string;
  tagline?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: SiteAddress;
  socialMedia?: SiteSocialMedia;
  kvkNumber?: string;
  vatNumber?: string;
  promoBanner?: PromoBanner;
  /** Which legal documents an editor has actually written — see `lib/legal`. */
  legalFilled: Record<LegalDocumentKey, boolean>;
}

/**
 * The footer only needs to know *whether* a legal document exists, not its
 * body — projecting a boolean keeps the whole of the terms out of every page's
 * payload. `defined(field[0])` rather than a count, because counting a missing
 * field yields null instead of false.
 */
const legalPresenceProjection = LEGAL_DOCUMENTS.map(
  (doc) => `"${doc.key}": defined(${doc.key}[0])`,
).join(",\n    ");

const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0]{
    siteName,
    tagline,
    contactEmail,
    contactPhone,
    address,
    socialMedia,
    kvkNumber,
    vatNumber,
    promoBanner,
    "legalFilled": {
    ${legalPresenceProjection}
    }
  }
`;

/**
 * The settings document, or an empty shell when it doesn't exist yet — callers
 * fall back to their built-in defaults per field rather than branching on null.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const raw = await client.fetch<SiteSettings | null>(
    siteSettingsQuery,
    {},
    { next: { revalidate: 60 } },
  );

  return {
    ...raw,
    legalFilled: Object.fromEntries(
      LEGAL_DOCUMENTS.map((doc) => [
        doc.key,
        Boolean(raw?.legalFilled?.[doc.key]),
      ]),
    ) as Record<LegalDocumentKey, boolean>,
  };
}

/** The legal documents that have content, in the order of `LEGAL_DOCUMENTS`. */
export function filledLegalDocuments(
  settings: SiteSettings,
): LegalDocumentMeta[] {
  return LEGAL_DOCUMENTS.filter((doc) => settings.legalFilled[doc.key]);
}

/**
 * The body of one legal document, or null when the field is empty — the route
 * turns that into a 404 so an unwritten document is never a blank page.
 */
export async function getLegalDocumentBody(
  key: LegalDocumentKey,
): Promise<PortableTextBlock[] | null> {
  const blocks = await client.fetch<PortableTextBlock[] | null>(
    groq`*[_type == "siteSettings"][0].${key}`,
    {},
    { next: { revalidate: 60 } },
  );

  return blocks?.length ? blocks : null;
}
