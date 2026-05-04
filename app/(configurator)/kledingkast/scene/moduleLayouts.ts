import { MODULE_FLOOR_Y } from './closetConstants'

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
}

export type ElementBbox = { minY: number; maxY: number }

export const SHELF_SPACING = 0.35
export const SHELF_THICKNESS = 0.018

// Kledingkast layouts use legacy "GLB origin lands at scene floor" convention.
// In the new bbox-bottom-anchored model that is fromBottom(-MODULE_FLOOR_Y).
const LEGACY_BOTTOM = -MODULE_FLOOR_Y

const sharedAboveShelvesBelowOpen = {
  above: { type: 'shelves', spacing: SHELF_SPACING } as const,
  below: { type: 'open' } as const,
}

export const MODULE_LAYOUTS: ModuleLayoutConfig[] = [
  {
    id: 1,
    label: 'Full shelves',
    description: 'Alleen planken, gelijkmatig verdeeld',
    elements: [],
    fillZone: sharedAboveShelvesBelowOpen,
    minSlotHeight: 0,
  },
  {
    id: 2,
    label: 'Drawers + shelves',
    description: 'Laden onderin, planken erboven',
    elements: [
      {
        glbPath: '/objects/ModuleDrawer.glb',
        anchor: { type: 'fromBottom', d: LEGACY_BOTTOM },
      },
    ],
    fillZone: sharedAboveShelvesBelowOpen,
    minSlotHeight: 0.70,
  },
  {
    id: 3,
    label: 'Double Rod + shelves',
    description: 'Laden onderin, planken erboven',
    elements: [
      {
        glbPath: '/objects/ModuleDoubleRod.glb',
        anchor: { type: 'fromBottom', d: LEGACY_BOTTOM },
      },
    ],
    fillZone: sharedAboveShelvesBelowOpen,
    minSlotHeight: 1.75,
  },
  {
    id: 4,
    label: 'Split shelves + rod',
    description: 'Laden onderin, planken erboven',
    elements: [
      {
        glbPath: '/objects/ModuleSplit.glb',
        anchor: { type: 'fromBottom', d: LEGACY_BOTTOM },
      },
    ],
    fillZone: sharedAboveShelvesBelowOpen,
    minSlotHeight: 1.75,
  },
  {
    id: 5,
    label: 'Single Rod',
    description: 'Laden onderin, planken erboven',
    elements: [
      {
        glbPath: '/objects/ModuleSingleRod.glb',
        anchor: { type: 'fromBottom', d: LEGACY_BOTTOM },
      },
    ],
    fillZone: sharedAboveShelvesBelowOpen,
    minSlotHeight: 1.05,
  },
  {
    id: 6,
    label: 'Shelf Rod',
    description: 'Laden onderin, planken erboven',
    elements: [
      {
        glbPath: '/objects/ModuleShelfRod.glb',
        anchor: { type: 'fromBottom', d: LEGACY_BOTTOM },
      },
    ],
    fillZone: sharedAboveShelvesBelowOpen,
    minSlotHeight: 1.75,
  },
  {
    id: 7,
    label: 'Drawer Rod',
    description: 'Laden onderin, planken erboven',
    elements: [
      {
        glbPath: '/objects/ModuleDrawerRod.glb',
        anchor: { type: 'fromBottom', d: LEGACY_BOTTOM },
      },
    ],
    fillZone: sharedAboveShelvesBelowOpen,
    minSlotHeight: 1.75,
  },
  {
    id: 8,
    label: 'Desk',
    description: 'Laden onderin, planken erboven',
    elements: [
      {
        glbPath: '/objects/ModuleDesk.glb',
        anchor: { type: 'fromBottom', d: LEGACY_BOTTOM },
      },
    ],
    fillZone: sharedAboveShelvesBelowOpen,
    minSlotHeight: 1.75,
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
 * Pure shelf-position computer. Returns Y values (module-space) where shelves sit.
 *
 * Behavior by config type:
 *  - `open`: returns [].
 *  - `fixedShelves`: returns the authored positions verbatim.
 *  - `shelves` with explicit `startY`: first shelf at startY, step by spacing.
 *  - `shelves` without explicit `startY`: floor-aligned past startY (today's behavior).
 *
 * `fillToTop` only matters for `shelves`. When false, drops the last shelf if its
 * gap to endY is below `spacing`.
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
    const firstIndex = Math.round(startY / config.spacing) + 1
    y = firstIndex * config.spacing
  }

  while (y + SHELF_THICKNESS < endY) {
    positions.push(y)
    y += config.spacing
  }

  if (!fillToTop && positions.length > 0) {
    const lastY = positions[positions.length - 1]
    const gapAbove = endY - (lastY + SHELF_THICKNESS / 2)
    if (gapAbove < config.spacing) {
      positions.pop()
    }
  }

  return positions
}
