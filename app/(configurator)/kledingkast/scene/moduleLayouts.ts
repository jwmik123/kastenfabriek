// --- Anchor types ---
type AnchorFromBottom = { type: 'fromBottom'; d: number } // bbox bottom at Y = d (module space)
type AnchorFromTop    = { type: 'fromTop';    d: number } // bbox top at Y = roofY - d
type AnchorBboxTopAt  = { type: 'bboxTopAt';  d: number } // bbox top at Y = d
type AnchorMidpoint   = { type: 'midpoint';   refIndex: number } // bbox top at midpoint(0, ref bbox top)

export type Anchor = AnchorFromBottom | AnchorFromTop | AnchorBboxTopAt | AnchorMidpoint

// --- Fill zone types ---
type FillShelves      = { type: 'shelves'; spacing: number; startY?: number; endY?: number }
type FillFixedShelves = { type: 'fixedShelves'; positions: number[] }
type FillOpen         = { type: 'open' }

export type FillZoneConfig = FillShelves | FillFixedShelves | FillOpen

// --- Module element ---
export type ModuleElement = {
  glbPath: string
  anchor: Anchor
  // Visual / material flags (washer-only today, generic shape).
  centered?: boolean
  noDoorDepthOffset?: number
  placeholderDimensions?: { w: number; h: number; d: number }
  glbMaterialMeshes?: string[]
  chromeMaterialMeshes?: string[]
  glassMaterialMeshes?: string[]
  /**
   * Meshes that stretch with the slot width, for GLBs whose nodes lack the
   * `_ws` suffix. Unlike the suffix (which scales the mesh proportionally
   * towards the module's inner width), each listed mesh grows by exactly the
   * slot's growth over `nativeSlotWidth` with its left edge pinned, so fronts,
   * drawer bottoms and side panels keep the spacing the modeller gave them.
   * Requires `nativeSlotWidth`.
   */
  widthScaleMeshes?: string[]
  /**
   * Slot width in meters the GLB was modelled for. The element's fronts span
   * the whole slot, wider than the corpus opening, so growth is measured
   * against this rather than against the element's own bbox.
   */
  nativeSlotWidth?: number
}

// --- Module layout ---
export type ModuleLayoutConfig = {
  id: number
  label: string
  description: string
  elements: ModuleElement[]
  fillZone: {
    above: FillZoneConfig
    below: FillZoneConfig
  }
  // Optional metadata: minimum slot height required (used for layout filter UX).
  minSlotHeight?: number
  // When true, the slot sits directly on the floor (no plinth under it) and
  // its module corpus (walls/back/roof/floor) is suppressed — the GLB itself
  // provides the cabinet body. Used by lage kast washer (15_WMOpen).
  floorMount?: boolean
  // Kitchen-style fronts (lage kast layouts 20/21/22): the GLB's Front*
  // meshes are the visible front — no door renders, fronts sit flush with
  // the door plane and carry the horizontal drawer handle.
  lowFronts?: boolean
  // Number of handle-bearing fronts in the GLB (drives handle pricing).
  lowFrontCount?: number
}

export type ElementBbox = { minY: number; maxY: number }

export const SHELF_SPACING = 0.368
export const SHELF_THICKNESS = 0.018
// Min gap between top shelf and roof. Below this, drop the last shelf.
export const MIN_TOP_CLEARANCE = 0.30

const DRAWER_GLB = '/objects/mainmodules/DrawerModule.glb'
const ROD_GLB    = '/objects/mainmodules/RodModule.glb'
const SPLIT_GLB  = '/objects/mainmodules/SplitModule.glb'
const DESK_GLB   = '/objects/mainmodules/DeskModule.glb'

const shelvesAbove = {
  above: { type: 'shelves', spacing: SHELF_SPACING } as const,
  below: { type: 'open' } as const,
}
const bothOpen = {
  above: { type: 'open' } as const,
  below: { type: 'open' } as const,
}

export const MODULE_LAYOUTS: ModuleLayoutConfig[] = [
  {
    id: 1,
    label: 'Full shelves',
    description: 'Alleen planken, gelijkmatig verdeeld',
    elements: [],
    fillZone: shelvesAbove,
    minSlotHeight: 0,
  },
  {
    id: 2,
    label: 'Drawers + shelves',
    description: 'Laden onderin, planken erboven',
    elements: [
      { glbPath: DRAWER_GLB, anchor: { type: 'fromBottom', d: 0 } },
    ],
    fillZone: shelvesAbove,
    minSlotHeight: 0.70,
  },
  {
    id: 3,
    label: 'Double Rod',
    description: 'Twee roeden boven elkaar',
    elements: [
      { glbPath: ROD_GLB, anchor: { type: 'fromTop',   d: 0.368 } },
      { glbPath: ROD_GLB, anchor: { type: 'midpoint',  refIndex: 0 } },
    ],
    fillZone: bothOpen,
    minSlotHeight: 1.20,
  },
  {
    id: 4,
    label: 'Split + shelves',
    description: 'Split-vak onderin, planken erboven',
    // Sit on module floor (was bboxTopAt(1.472) — that pushed bbox bottom into
    // the plinth when the GLB exceeded 1.472m). The split GLB should be authored
    // ~1.472m tall so its top still aligns with the L5 rod-at-147.2.
    elements: [
      { glbPath: SPLIT_GLB, anchor: { type: 'fromBottom', d: 0 } },
    ],
    fillZone: shelvesAbove,
    minSlotHeight: 1.472,
  },
  {
    id: 5,
    label: 'Single Rod 140',
    description: 'Roede op 140 cm, planken erboven',
    elements: [
      { glbPath: ROD_GLB, anchor: { type: 'bboxTopAt', d: 1.472 } },
    ],
    fillZone: shelvesAbove,
    minSlotHeight: 1.472,
  },
  {
    id: 6,
    label: 'Rod + plank',
    description: 'Roede 35 cm onder plafond, plank op 35 cm',
    elements: [
      { glbPath: ROD_GLB, anchor: { type: 'fromTop', d: 0.368 } },
    ],
    fillZone: {
      above: { type: 'open' } as const,
      below: { type: 'fixedShelves', positions: [0.368] } as const,
    },
    minSlotHeight: 0.736,
  },
  {
    id: 7,
    label: 'Drawer + rod',
    description: 'Laden onderin, roede onder plafond',
    elements: [
      { glbPath: DRAWER_GLB, anchor: { type: 'fromBottom', d: 0 } },
      { glbPath: ROD_GLB,    anchor: { type: 'fromTop',    d: 0.368 } },
    ],
    fillZone: bothOpen,
    minSlotHeight: 1.20,
  },
  {
    id: 8,
    label: 'Desk',
    description: 'Bureau onderin, planken vanaf 175 cm',
    elements: [
      { glbPath: DESK_GLB, anchor: { type: 'fromBottom', d: 0 } },
    ],
    fillZone: {
      above: { type: 'shelves', spacing: SHELF_SPACING, startY: 1.84 } as const,
      below: { type: 'open' } as const,
    },
    minSlotHeight: 1.84,
  },
]

export function getLayoutById(id: number): ModuleLayoutConfig | undefined {
  return MODULE_LAYOUTS.find((l) => l.id === id)
}

/**
 * Pure resolver for element positions and fill-zone bounds.
 *
 * `elementYs[i]` is the Y in module-group space where element i's bbox bottom sits.
 * SpecialElement subtracts `box.min.y` so passing this Y as `positionY` puts the
 * bbox bottom exactly there.
 *
 * Two-pass resolution: independent anchors (fromBottom, fromTop, bboxTopAt) first,
 * then midpoint anchors that depend on already-resolved siblings.
 *
 * Default fill bounds:
 *  - With elements: fillAbove = max(bboxTop) → roofY; fillBelow = 0 → min(bboxBottom).
 *  - No elements:   fillAbove = 0 → roofY;          fillBelow = empty (0 → 0).
 *  - FillShelves.startY / endY override the corresponding default.
 */
export function resolveElementPositions(
  layout: ModuleLayoutConfig,
  roofY: number,
  bboxes: ElementBbox[],
): {
  elementYs: number[]
  fillAbove: { start: number; end: number }
  fillBelow: { start: number; end: number }
} {
  const heightOf = (i: number): number => {
    const b = bboxes[i] ?? { minY: 0, maxY: 0 }
    return b.maxY - b.minY
  }

  const elementYs: number[] = new Array(layout.elements.length).fill(NaN)

  // Pass 1: independent anchors.
  layout.elements.forEach((el, i) => {
    switch (el.anchor.type) {
      case 'fromBottom':
        elementYs[i] = el.anchor.d
        return
      case 'fromTop':
        elementYs[i] = roofY - el.anchor.d - heightOf(i)
        return
      case 'bboxTopAt':
        elementYs[i] = el.anchor.d - heightOf(i)
        return
      case 'midpoint':
        return
    }
  })

  // Pass 2: midpoint anchors — bbox top sits at midpoint(0, ref bbox top).
  layout.elements.forEach((el, i) => {
    if (el.anchor.type !== 'midpoint') return
    const refIdx = el.anchor.refIndex
    const refY = elementYs[refIdx]
    if (Number.isNaN(refY)) {
      throw new Error(
        `midpoint anchor on element ${i} references unresolved element ${refIdx}`,
      )
    }
    const refBboxTop = refY + heightOf(refIdx)
    const myBboxTop = refBboxTop / 2
    elementYs[i] = myBboxTop - heightOf(i)
  })

  if (layout.elements.length === 0) {
    return {
      elementYs,
      fillAbove: applyOverrides(layout.fillZone.above, { start: 0, end: roofY }),
      fillBelow: applyOverrides(layout.fillZone.below, { start: 0, end: 0 }),
    }
  }

  let maxBboxTop = -Infinity
  let minBboxBottom = Infinity
  layout.elements.forEach((_, i) => {
    const bot = elementYs[i]
    const top = bot + heightOf(i)
    if (top > maxBboxTop) maxBboxTop = top
    if (bot < minBboxBottom) minBboxBottom = bot
  })

  const fillAbove = applyOverrides(layout.fillZone.above, {
    start: maxBboxTop,
    end: roofY,
  })
  const fillBelow = applyOverrides(layout.fillZone.below, {
    start: 0,
    end: Math.max(0, minBboxBottom),
  })

  return { elementYs, fillAbove, fillBelow }
}

function applyOverrides(
  config: FillZoneConfig,
  defaults: { start: number; end: number },
): { start: number; end: number } {
  if (config.type !== 'shelves') return defaults
  return {
    start: config.startY ?? defaults.start,
    end: config.endY ?? defaults.end,
  }
}

/**
 * Pure shelf-position computer. Returns Y values (module-space) where the TOP
 * surface of each shelf sits. Shelf bottom = Y - SHELF_THICKNESS.
 *
 * Top-anchored so a 70 cm drawer's top edge lines up exactly with the second
 * shelf top in a full-shelves module (both at Y = 0.70).
 *
 * Behavior by config type:
 *  - `open`: returns [].
 *  - `fixedShelves`: returns the authored positions verbatim (each entry is
 *    the shelf top).
 *  - `shelves` with explicit `startY`: first shelf top at startY, step by spacing.
 *  - `shelves` without explicit `startY`: shelf tops snap to multiples of
 *    spacing strictly above startY.
 *
 * `fillToTop` only matters for `shelves`. When false, drops the last shelf if
 * its gap to endY is below `spacing`.
 */
export function computeShelfPositions(
  config: FillZoneConfig,
  startY: number,
  endY: number,
  fillToTop: boolean,
): number[] {
  if (config.type === 'open') return []
  if (config.type === 'fixedShelves') return [...config.positions]

  const zoneHeight = endY - startY
  if (zoneHeight <= SHELF_THICKNESS * 2) return []

  const positions: number[] = []
  const explicitStart = config.startY !== undefined

  let y: number
  if (explicitStart) {
    y = startY
  } else {
    // Snap to the nearest grid line, then step one full spacing up. Guarantees
    // at least ~half a spacing of clearance above startY, so a slightly-undersized
    // drawer (~0.685m) doesn't get a shelf 1cm above it — first shelf lands at
    // the next "real" grid slot (e.g. 1.05).
    const firstIndex = Math.round(startY / config.spacing) + 1
    y = firstIndex * config.spacing
  }

  while (y < endY) {
    positions.push(y)
    y += config.spacing
  }

  if (!fillToTop && positions.length > 0) {
    const lastY = positions[positions.length - 1]
    const gapAbove = endY - lastY
    if (gapAbove < MIN_TOP_CLEARANCE) {
      positions.pop()
    }
  }

  return positions
}
