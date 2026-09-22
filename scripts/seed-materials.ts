/**
 * Seeds the "Kleuren & materialen" documents with the materials that used to
 * live in the code (DEFAULT_MATERIALS), including decor photos and room
 * renders, so editors start from the live list. Ids stay the same, so saved
 * carts and orders keep resolving.
 *
 * Materials whose code already exists in Sanity are skipped; running it twice
 * is safe.
 *
 *   npx tsx scripts/seed-materials.ts
 */
import { createClient } from "@sanity/client";
import * as dotenv from "dotenv";
import { createReadStream } from "node:fs";
import path from "node:path";

import { DEFAULT_MATERIALS } from "../lib/materials";

dotenv.config({ path: ".env.local" });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2026-01-09",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

/** Uploads a file from /public and returns an image field value. */
async function uploadPublicImage(publicPath: string) {
  const filePath = path.join(process.cwd(), "public", publicPath);
  const filename = path.basename(publicPath);
  const asset = await client.assets.upload("image", createReadStream(filePath), { filename });
  console.log(`  geüpload: ${filename}`);
  return {
    _type: "image" as const,
    _key: asset._id.slice(-12),
    asset: { _type: "reference" as const, _ref: asset._id },
  };
}

async function main() {
  if (!process.env.SANITY_API_TOKEN) {
    throw new Error("SANITY_API_TOKEN ontbreekt in .env.local");
  }

  const existing = new Set(
    await client.fetch<string[]>(`*[_type == "material"].materialId.current`),
  );

  for (const [index, m] of DEFAULT_MATERIALS.entries()) {
    if (existing.has(m.id)) {
      console.log(`Overgeslagen (bestaat al): ${m.name}`);
      continue;
    }
    console.log(`Aanmaken: ${m.name}`);

    const roomImages = await Promise.all((m.roomImages ?? []).map(uploadPublicImage));
    const typeFields: Record<string, unknown> =
      m.type === "color"
        ? { materialType: "color", color: m.color }
        : {
            materialType: "texture",
            texture: await uploadPublicImage(m.maps.color).then(({ _key, ...img }) => img),
          };

    await client.create({
      _type: "material",
      name: m.name,
      materialId: { _type: "slug", current: m.id },
      ...typeFields,
      roomImages,
      outsideOnly: m.outsideOnly ?? false,
      active: m.active,
      sortOrder: (index + 1) * 10,
    });
  }

  console.log("Klaar — de materialen staan in Sanity onder Configurator › Kleuren & materialen.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
