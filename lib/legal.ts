/**
 * The legal documents editors write on the `siteSettings` document in Sanity.
 *
 * One entry per document: the Sanity field it comes from, the route that
 * renders it and the copy around it. The footer, the routes and the settings
 * query all read this list, so adding a document is a one-line change here
 * plus a `richText` field on `siteSettings`.
 */
export type LegalDocumentKey =
  | 'termsAndConditions'
  | 'privacyPolicy'
  | 'returnPolicy'

export interface LegalDocumentMeta {
  /** The `siteSettings` field holding the body. */
  key: LegalDocumentKey
  /** Route segment under the site root, no leading slash. */
  slug: string
  href: string
  title: string
  description: string
}

function legal(
  key: LegalDocumentKey,
  slug: string,
  title: string,
  description: string,
): LegalDocumentMeta {
  return { key, slug, href: `/${slug}`, title, description }
}

export const LEGAL_DOCUMENT: Record<LegalDocumentKey, LegalDocumentMeta> = {
  termsAndConditions: legal(
    'termsAndConditions',
    'algemene-voorwaarden',
    'Algemene voorwaarden',
    'De voorwaarden die gelden bij een bestelling bij Kasten Fabriek.',
  ),
  privacyPolicy: legal(
    'privacyPolicy',
    'privacyverklaring',
    'Privacyverklaring',
    'Hoe Kasten Fabriek omgaat met je persoonsgegevens.',
  ),
  returnPolicy: legal(
    'returnPolicy',
    'retourbeleid',
    'Retourbeleid',
    'Wanneer en hoe je een bestelling kunt retourneren.',
  ),
}

/** Every legal document, in the order the footer lists them. */
export const LEGAL_DOCUMENTS: LegalDocumentMeta[] = [
  LEGAL_DOCUMENT.termsAndConditions,
  LEGAL_DOCUMENT.privacyPolicy,
  LEGAL_DOCUMENT.returnPolicy,
]
