/**
 * Seeds the "Kastdetails (hotspots)" singleton with the copy and images that
 * currently live in the code, so editors start from the live section instead
 * of an empty form.
 *
 *   npx tsx scripts/seed-hotspot-section.ts           # stops if it exists
 *   npx tsx scripts/seed-hotspot-section.ts --force   # overwrite it
 */
import { createClient } from "@sanity/client";
import * as dotenv from "dotenv";
import { createReadStream } from "node:fs";
import path from "node:path";

import { DEFAULT_HOTSPOT_CONTENT } from "../components/hotspot-content";

dotenv.config({ path: ".env.local" });

const DOC_ID = "hotspotSection";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2026-01-09",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const uploads = new Map<string, Promise<string>>();

/** Uploads a file from /public once and returns its asset id. */
function uploadPublicImage(publicPath: string): Promise<string> {
  const cached = uploads.get(publicPath);
  if (cached) return cached;

  const filePath = path.join(process.cwd(), "public", publicPath);
  const filename = path.basename(publicPath);
  const upload = client.assets
    .upload("image", createReadStream(filePath), { filename })
    .then((asset) => {
      console.log(`  geüpload: ${filename}`);
      return asset._id;
    });

  uploads.set(publicPath, upload);
  return upload;
}

const imageRef = (assetId: string) => ({
  _type: "image" as const,
  asset: { _type: "reference" as const, _ref: assetId },
});

async function main() {
  const force = process.argv.includes("--force");

  if (!process.env.SANITY_API_TOKEN) {
    throw new Error("SANITY_API_TOKEN ontbreekt in .env.local");
  }

  const existing = await client.getDocument(DOC_ID);
  if (existing && !force) {
    console.log(
      `Document "${DOC_ID}" bestaat al — draai met --force om het te overschrijven.`
    );
    return;
  }

  const content = DEFAULT_HOTSPOT_CONTENT;
  console.log("Afbeeldingen uploaden…");

  const baseAsset = await uploadPublicImage(content.baseImage);
  const points = await Promise.all(
    content.points.map(async (point) => ({
      _type: "point",
      _key: point.name,
      title: point.title,
      body: point.body,
      image: imageRef(await uploadPublicImage(point.image)),
      x: point.x,
      y: point.y,
      label: point.label,
      ...(point.href ? { href: point.href } : {}),
      ...(point.ctaLabel ? { ctaLabel: point.ctaLabel } : {}),
    }))
  );

  await client.createOrReplace({
    _id: DOC_ID,
    _type: "hotspotSection",
    eyebrow: content.eyebrow,
    heading: content.heading,
    headingAccent: content.headingAccent,
    intro: content.intro,
    baseImage: imageRef(baseAsset),
    baseImageAlt: content.baseImageAlt,
    points,
  });

  console.log(`Klaar — "${DOC_ID}" staat in Sanity onder Website › Kastdetails.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
