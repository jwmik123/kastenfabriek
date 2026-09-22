import "server-only";

import { groq } from "next-sanity";

import { client } from "./client";
import { DEFAULT_MATERIALS, setMaterials, type Material } from "@/lib/materials";

const materialsQuery = groq`
  *[_type == "material" && defined(materialId.current)]
    | order(coalesce(sortOrder, 100) asc, name asc) {
      "id": materialId.current,
      name,
      "type": materialType,
      color,
      "outsideOnly": outsideOnly == true,
      "active": active != false,
      "texture": texture.asset->url,
      "normal": normalMap.asset->url,
      "roughness": roughnessMap.asset->url,
      "roomImages": roomImages[].asset->url
    }
`;

interface MaterialRow {
  id: string;
  name: string | null;
  type: "color" | "texture" | null;
  color: string | null;
  outsideOnly: boolean;
  active: boolean;
  texture: string | null;
  normal: string | null;
  roughness: string | null;
  roomImages: (string | null)[] | null;
}

/** Sanity CDN image, resized for swatches and thumbnails. */
const sized = (url: string, width: number) => `${url}?w=${width}&fm=jpg&q=85`;

/**
 * 3D texture, served through Next's image optimizer. The scene loads textures
 * with CORS, and the Sanity CDN only answers origins on the project's CORS
 * list — going through our own origin keeps previews and new domains working.
 */
const sameOrigin = (url: string) => `/_next/image?url=${encodeURIComponent(url)}&w=2048&q=75`;

function toMaterial(row: MaterialRow): Material | null {
  const base = {
    id: row.id,
    name: row.name ?? row.id,
    active: row.active,
    ...(row.outsideOnly ? { outsideOnly: true } : {}),
    roomImages: (row.roomImages ?? []).filter((u): u is string => !!u),
  };
  if (row.type === "texture") {
    if (!row.texture) return null;
    return {
      ...base,
      type: "texture",
      preview: sized(row.texture, 800),
      maps: {
        color: sameOrigin(row.texture),
        ...(row.normal ? { normal: sameOrigin(row.normal) } : {}),
        ...(row.roughness ? { roughness: sameOrigin(row.roughness) } : {}),
      },
    };
  }
  if (!row.color) return null;
  return { ...base, type: "color", color: row.color };
}

/**
 * Every material from Sanity, including inactive ones (saved carts and orders
 * still resolve them). Incomplete documents are skipped. Falls back to the
 * built-in list when Sanity is empty or unreachable. Also refreshes the shared
 * registry, so server code that follows (pricing, specs, e-mails) sees the
 * same list.
 */
export async function getMaterials(): Promise<readonly Material[]> {
  let materials: readonly Material[] = DEFAULT_MATERIALS;
  try {
    const rows = await client.fetch<MaterialRow[]>(
      materialsQuery,
      {},
      { next: { revalidate: 60, tags: ["material"] } },
    );
    const parsed = rows.map(toMaterial).filter((m): m is Material => m !== null);
    if (parsed.length > 0) materials = parsed;
  } catch (error) {
    console.error("[materials] Sanity fetch failed, using built-in list", error);
  }
  setMaterials(materials);
  return materials;
}
