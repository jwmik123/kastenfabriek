import { MODULE_FLOOR_Y } from './closetConstants'

// --- Anchor types ---
type AnchorFromBottom = { type: 'fromBottom'; d: number } // bbox bottom at Y = d (module space)
type AnchorFromTop    = { type: 'fromTop';    d: number } // bbox top at Y = roofY - d

export type Anchor = AnchorFromBottom | AnchorFromTop

// --- Fill zone types ---
type FillShelves = { type: 'shelves'; spacing: number }
type FillOpen    = { type: 'open' }

export type FillZoneConfig = FillShelves | FillOpen

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
 * Default fill bounds (slice 1):
 *  - With elements: fillAbove = max(bboxTop) → roofY; fillBelow = 0 → min(bboxBottom).
 *  - No elements:   fillAbove = 0 → roofY;          fillBelow = empty (0 → 0).
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
  const elementYs: number[] = layout.elements.map((el, i) => {
    const bbox = bboxes[i] ?? { minY: 0, maxY: 0 }
    const height = bbox.maxY - bbox.minY
    switch (el.anchor.type) {
      case 'fromBottom':
        return el.anchor.d
      case 'fromTop':
        return roofY - el.anchor.d - height
    }
  })

  if (layout.elements.length === 0) {
    return {
      elementYs,
      fillAbove: { start: 0, end: roofY },
      fillBelow: { start: 0, end: 0 },
    }
  }

  let maxBboxTop = -Infinity
  let minBboxBottom = Infinity
  layout.elements.forEach((_, i) => {
    const bbox = bboxes[i] ?? { minY: 0, maxY: 0 }
    const height = bbox.maxY - bbox.minY
    const bot = elementYs[i]
    const top = bot + height
    if (top > maxBboxTop) maxBboxTop = top
    if (bot < minBboxBottom) minBboxBottom = bot
  })

  const fillAbove = { start: maxBboxTop, end: roofY }
  const fillBelow = {
    start: 0,
    end: Math.max(0, minBboxBottom),
  }

  return { elementYs, fillAbove, fillBelow }
}
