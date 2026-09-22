/**
 * Cabinet materials — the colours and wood decors a customer picks for the
 * outside and inside of a closet. Editors manage them in Sanity (`material`
 * documents); this module holds the shared types, the built-in fallback list
 * and a small registry that non-React code (pricing, order specs, e-mails)
 * reads from.
 *
 * The registry is filled with the Sanity list on the server by
 * `getMaterials()` and on the client by `<MaterialsProvider>`. Until then it
 * serves `DEFAULT_MATERIALS`, so nothing breaks when Sanity is unreachable or
 * still empty.
 */

interface BaseMaterial {
  /** Stable key stored in carts, snapshots and orders — never renamed. */
  id: string
  name: string
  /** Only offered for the outside of a cabinet. */
  outsideOnly?: boolean
  /** Inactive materials are hidden from pickers but still resolve by id. */
  active: boolean
  /** Room renders of a cabinet in this material ("Bekijk in …"). */
  roomImages?: string[]
}

export interface ColorMaterial extends BaseMaterial {
  type: 'color'
  /** Hex colour, e.g. `#FBFDF5`. */
  color: string
}

export interface TextureMaps {
  /** Diffuse/colour photo, sRGB. */
  color: string
  normal?: string
  roughness?: string
}

export interface TextureMaterial extends BaseMaterial {
  type: 'texture'
  /** Image for swatches and thumbnails. */
  preview: string
  /** Images the 3D scene samples. */
  maps: TextureMaps
}

export type Material = ColorMaterial | TextureMaterial

const rooms = (slug: string) => [`/colorways/${slug}-1.webp`, `/colorways/${slug}-2.webp`]

const texture = (id: string, name: string, file: string, roomSlug: string): TextureMaterial => ({
  id,
  name,
  type: 'texture',
  active: true,
  roomImages: rooms(roomSlug),
  preview: `/materials/${file}`,
  maps: { color: `/materials/${file}` },
})

const color = (id: string, name: string, hex: string, outsideOnly?: boolean): ColorMaterial => ({
  id,
  name,
  type: 'color',
  color: hex,
  active: true,
  roomImages: rooms(id),
  ...(outsideOnly ? { outsideOnly } : {}),
})

/** Built-in list; used whenever Sanity has no (reachable) materials. */
export const DEFAULT_MATERIALS: readonly Material[] = [
  // Textures (outside & inside)
  texture('h1199-thermo-eik', 'Thermo Eik Zwartbruin', 'H1199 ST12 Thermo eik zwartbruin.jpg', 'thermo-eik-zwartbruin'),
  texture('h3165-vicenza-eik-licht', 'Vicenza Eik Licht', 'H3165 ST12 Vicenza eik licht.jpg', 'vicenza-eik-licht'),
  texture('h3158-vicenza-eik-grijs', 'Vicenza Eik Grijs', 'H3158 ST19 Vicenza eik grijs.jpg', 'vicenza-eik-grijs'),
  texture('h1714-lincoln-notelaar', 'Lincoln Notelaar', 'H1714 ST19 Lincoln notelaar.jpg', 'lincoln-notelaar'),
  texture('h3190-fineline-antraciet', 'Fineline Metallic Antraciet', 'H3190 ST19 Fineline metallic antraciet.jpg', 'fineline-metallic-antraciet'),
  // Colors — outside & inside
  color('zwart', 'Zwart', '#050407'),
  color('premium-wit', 'Premium Wit', '#FBFDF5'),
  color('zandbeige', 'Zandbeige', '#E7D6C2'),
  color('eucalyptus-groen', 'Eucalyptus Groen', '#747F74'),
  color('amandelbeige', 'Amandelbeige', '#B6A294'),
  color('truffelbruin', 'Truffelbruin', '#685A51'),
  color('donkertaupe', 'Donkertaupe', '#90877A'),
  color('koolstofgrijs', 'Koolstofgrijs', '#36383E'),
  color('mistblauw', 'Mistblauw', '#556F84'),
  // Colors — outside only
  color('cosmosblauw', 'Cosmosblauw', '#122744', true),
  color('granaatappelrood', 'Granaatappelrood', '#5f1e22', true),
  color('pistachegroen', 'Pistachegroen', '#c8d2c1', true),
  color('olijfgroen', 'Olijfgroen', '#9b9971', true),
  color('steengroen', 'Steengroen', '#526261', true),
]

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

let current: readonly Material[] = DEFAULT_MATERIALS
let byId = new Map(current.map((m) => [m.id, m]))
const defaultsById = new Map(DEFAULT_MATERIALS.map((m) => [m.id, m]))

/** Replace the registry contents. An empty list keeps the defaults. */
export function setMaterials(materials: readonly Material[]): void {
  if (materials === current) return
  current = materials.length > 0 ? materials : DEFAULT_MATERIALS
  byId = new Map(current.map((m) => [m.id, m]))
}

/** Every known material, including inactive ones, in editor order. */
export function getAllMaterials(): readonly Material[] {
  return current
}

/**
 * Look a material up by id. Falls back to the built-in list so an order that
 * references a material since removed from Sanity still shows a sensible name.
 */
export function findMaterial(id: string | null | undefined): Material | undefined {
  if (!id) return undefined
  return byId.get(id) ?? defaultsById.get(id)
}

export function getMaterialName(id: string): string {
  return findMaterial(id)?.name ?? id
}

export function isTextureMaterial(id: string | null | undefined): boolean {
  return findMaterial(id)?.type === 'texture'
}

/** Materials a customer can currently choose. */
export function selectableMaterials(materials: readonly Material[]): Material[] {
  return materials.filter((m) => m.active)
}
