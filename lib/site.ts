/**
 * Shared site identity used for metadata, share previews (WhatsApp, LinkedIn,
 * X, Facebook) and canonical URLs.
 *
 * Set NEXT_PUBLIC_SITE_URL per environment (production, preview) so the
 * generated Open Graph URLs point at the right host.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kasten-fabriek.nl"
).replace(/\/$/, "");

export const SITE_NAME = "Kastenfabriek";

export const SITE_TITLE = "Kastenfabriek — kasten op maat, tot de millimeter";

export const SITE_DESCRIPTION =
  "Kledingkasten, wasmachinekasten en IKEA PAX-deuren volledig op maat. Ontwerp je kast zelf in 3D, kies uit onze kleuren en fineers en zie direct wat het kost.";

/** 1200x630 share image; kept as a static file so scrapers can always fetch it. */
export const OG_IMAGE = {
  url: "/og/kastenfabriek.jpg",
  width: 1200,
  height: 630,
  alt: "Kledingkast op maat met open indeling in een lichte slaapkamer",
} as const;
