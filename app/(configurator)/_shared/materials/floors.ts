/**
 * Floor registry — the floor finishes a user can pick under the cabinet.
 *
 * Purely visual: the choice never reaches the cart or the order. Solid
 * finishes are plain colours; wood finishes are procedural TSL materials
 * (see ../shaders/woodFloor.ts) so no texture download is needed and the
 * pattern is stable in world units regardless of floor size.
 *
 * The set follows what Dutch floor retailers report as most chosen for
 * 2025–2026: naturel/licht eiken first, warm earth tones (zand, beige,
 * taupe) over cool grey, visgraat / walvisgraat / brede planken as patterns,
 * plus warm betonlook for gietvloer and tiles.
 */

export type FloorKind = 'solid' | 'planks' | 'herringbone'

export interface WoodPalette {
  /** Lightest plank tint (sRGB hex). */
  light: string
  /** Darkest plank tint (sRGB hex). */
  dark: string
  /** Colour of the seams between planks (sRGB hex). */
  gap: string
}

export interface FloorOption {
  id: string
  label: string
  kind: FloorKind
  /** Representative colour, used for the solid material and the UI swatch. */
  color: string
  roughness: number
  /** Wood finishes only. */
  palette?: WoodPalette
  /** Wood finishes only: plank width in metres. */
  plankWidth?: number
  /** Wood finishes only: plank length as a multiple of the width. */
  plankRatio?: number
}

export const DEFAULT_FLOOR_ID = 'wit'

const OAK_LIGHT: WoodPalette = { light: '#e6cfab', dark: '#c9a97e', gap: '#a88a63' }
const OAK_NATUREL: WoodPalette = { light: '#d9b98c', dark: '#b8925f', gap: '#8f6d45' }
const OAK_SMOKED: WoodPalette = { light: '#8a6a4e', dark: '#5e4430', gap: '#3d2b1d' }
const WALNUT: WoodPalette = { light: '#7d5a42', dark: '#563a29', gap: '#35231a' }

export const FLOORS: readonly FloorOption[] = [
  // ── Egaal ────────────────────────────────────────────────────────────────
  { id: 'wit',        label: 'Wit',            kind: 'solid', color: '#ffffff', roughness: 0.9 },
  { id: 'lichtgrijs', label: 'Lichtgrijs',     kind: 'solid', color: '#d4d4d1', roughness: 0.85 },
  { id: 'betonlook',  label: 'Warm betonlook', kind: 'solid', color: '#b5aea4', roughness: 0.8 },
  { id: 'antraciet',  label: 'Antraciet',      kind: 'solid', color: '#4a4a4c', roughness: 0.75 },
  { id: 'zand',       label: 'Zand',           kind: 'solid', color: '#d8c8ae', roughness: 0.85 },
  { id: 'taupe',      label: 'Taupe',          kind: 'solid', color: '#a99a89', roughness: 0.85 },
  // ── Planken ──────────────────────────────────────────────────────────────
  {
    id: 'eiken-planken',
    label: 'Eiken planken',
    kind: 'planks',
    color: '#c9a678',
    roughness: 0.55,
    palette: OAK_NATUREL,
    plankWidth: 0.22,
    plankRatio: 10,
  },
  {
    id: 'walnoot-planken',
    label: 'Walnoot planken',
    kind: 'planks',
    color: '#6e4e39',
    roughness: 0.5,
    palette: WALNUT,
    plankWidth: 0.19,
    plankRatio: 10,
  },
  // ── Visgraat ─────────────────────────────────────────────────────────────
  {
    id: 'lichthout-visgraat',
    label: 'Lichthout visgraat',
    kind: 'herringbone',
    color: '#dcc09a',
    roughness: 0.55,
    palette: OAK_LIGHT,
    plankWidth: 0.12,
    plankRatio: 5,
  },
  {
    id: 'walvisgraat',
    label: 'Walvisgraat naturel',
    kind: 'herringbone',
    color: '#cfae82',
    roughness: 0.55,
    palette: OAK_NATUREL,
    plankWidth: 0.2,
    plankRatio: 5,
  },
  {
    id: 'gerookt-eiken-visgraat',
    label: 'Gerookt visgraat',
    kind: 'herringbone',
    color: '#6f5039',
    roughness: 0.5,
    palette: OAK_SMOKED,
    plankWidth: 0.12,
    plankRatio: 5,
  },
] as const

export const FLOOR_IDS: readonly string[] = FLOORS.map((f) => f.id)

export function getFloor(id: string): FloorOption {
  return FLOORS.find((f) => f.id === id) ?? FLOORS[0]
}

// ---------------------------------------------------------------------------
// Plank geometry (pure, mirrored by the TSL graph — unit-tested here)
// ---------------------------------------------------------------------------

/** Default plank width in metres. Length = width × HERRINGBONE_PLANK_RATIO. */
export const HERRINGBONE_PLANK_WIDTH_M = 0.12
/** Default plank length as a whole multiple of the plank width. */
export const HERRINGBONE_PLANK_RATIO = 5

export interface PlankCell {
  /** True when the plank runs along the (rotated) x axis. */
  horizontal: boolean
  /** Integer corner of the plank in the pattern grid. */
  originX: number
  originY: number
  /** Position along the plank length, 0..1. */
  along: number
  /** Position across the plank width, 0..1. */
  across: number
}

/** @deprecated alias, kept for readability in tests */
export type HerringboneCell = PlankCell

/**
 * Classify a point in the 45°-rotated plank grid (units = plank width).
 *
 * A herringbone tiling of 1×n rectangles: with d = (i − j) mod 2n for cell
 * (i, j), cells with d < n form horizontal planks starting at (i − d, j),
 * the rest form vertical planks starting at (i, j − (2n − 1 − d)).
 */
export function herringboneCell(qx: number, qy: number, n = HERRINGBONE_PLANK_RATIO): PlankCell {
  const i = Math.floor(qx)
  const j = Math.floor(qy)
  const m = 2 * n
  const d = (((i - j) % m) + m) % m
  if (d < n) {
    const originX = i - d
    return { horizontal: true, originX, originY: j, along: (qx - originX) / n, across: qy - j }
  }
  const originY = j - (m - 1 - d)
  return { horizontal: false, originX: i, originY, along: (qy - originY) / n, across: qx - i }
}

/** World XZ (metres) → rotated plank-grid coordinates (plank-width units). */
export function worldToHerringbone(x: number, z: number, plankWidth = HERRINGBONE_PLANK_WIDTH_M): [number, number] {
  const px = x / plankWidth
  const pz = z / plankWidth
  return [(px - pz) * Math.SQRT1_2, (px + pz) * Math.SQRT1_2]
}

/** Deterministic 0..1 hash of an integer row, same formula as the shader. */
export function rowHash(row: number): number {
  const v = Math.sin(row * 127.1 + 311.7) * 43758.5453
  return v - Math.floor(v)
}

/**
 * Straight planks running along world X (parallel to the cabinet front),
 * rows stacked along Z, each row shifted by a random fraction of a plank
 * length so seams don't line up. Coordinates in metres.
 */
export function planksCell(x: number, z: number, plankWidth: number, ratio: number): PlankCell {
  const length = plankWidth * ratio
  const row = Math.floor(z / plankWidth)
  const across = z / plankWidth - row
  const u = (x + rowHash(row) * length) / length
  const col = Math.floor(u)
  return { horizontal: true, originX: col, originY: row, along: u - col, across }
}
