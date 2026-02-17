// --- Anchor types ---
type AnchorBottom = { type: 'bottom' }
type AnchorTop = { type: 'top' }
type AnchorFixed = { type: 'fixed'; fromBottom: number } // meters from module floor

type Anchor = AnchorBottom | AnchorTop | AnchorFixed

// --- Fill zone types ---
type FillShelves = { type: 'shelves'; spacing: number } // spacing in meters
type FillOpen = { type: 'open' }

type FillZoneConfig = FillShelves | FillOpen

// --- Module layout definition ---
export type ModuleLayoutConfig = {
  id: number
  label: string
  description: string

  specialElement: {
    glbPath: string | null // null = no GLB (e.g. full-shelves layout)
    height: number         // fixed height in meters
    anchor: Anchor
    baseWidth: number      // reference GLB X dimension for width scaling
    baseDepth: number      // reference GLB Z dimension for depth scaling
  }

  fillZone: {
    above: FillZoneConfig
    below: FillZoneConfig
  }
}

export type { Anchor, FillZoneConfig, FillShelves, FillOpen }

// Default shelf spacing and thickness
export const SHELF_SPACING = 0.30  // 30cm
export const SHELF_THICKNESS = 0.018 // 2.5cm

/**
 * Module layout registry.
 *
 * To add a new layout: create a GLB for the special element, measure its
 * dimensions, and add an entry here. The renderer handles everything else.
 *
 * NOTE: These entries use the existing GLBs as placeholders.
 * Replace glbPath, height, baseWidth, baseDepth with real measurements
 * once dedicated special-element GLBs are authored.
 */
export const MODULE_LAYOUTS: ModuleLayoutConfig[] = [
  {
    id: 1,
    label: 'Full shelves',
    description: 'Alleen planken, gelijkmatig verdeeld',
    specialElement: {
      glbPath: null,
      height: 0,
      anchor: { type: 'bottom' },
      baseWidth: 0.575,
      baseDepth: 0.6,
    },
    fillZone: {
      above: { type: 'shelves', spacing: SHELF_SPACING },
      below: { type: 'open' },
    },
  },
  {
    id: 2,
    label: 'Drawers + shelves',
    description: 'Laden onderin, planken erboven',
    specialElement: {
      glbPath: '/objects/ladesbinnen.glb',
      height: 0.8,
      anchor: { type: 'bottom' },
      baseWidth: 1.65,
      baseDepth: 1.94,
    },
    fillZone: {
      above: { type: 'shelves', spacing: SHELF_SPACING },
      below: { type: 'open' },
    },
  },
]

export function getLayoutById(id: number): ModuleLayoutConfig | undefined {
  return MODULE_LAYOUTS.find((l) => l.id === id)
}

/**
 * Compute vertical positions for special element and fill zones.
 */
export function computeModulePositions(
  layout: ModuleLayoutConfig,
  moduleHeight: number
) {
  const { specialElement } = layout
  const { anchor, height: seHeight } = specialElement

  let specialElementY = 0
  let fillAbove = { start: 0, end: 0 }
  let fillBelow = { start: 0, end: 0 }

  switch (anchor.type) {
    case 'bottom':
      specialElementY = 0
      fillAbove = { start: seHeight, end: moduleHeight }
      break

    case 'top':
      specialElementY = moduleHeight - seHeight
      fillBelow = { start: 0, end: moduleHeight - seHeight }
      break

    case 'fixed':
      specialElementY = anchor.fromBottom
      fillBelow = { start: 0, end: anchor.fromBottom }
      fillAbove = { start: anchor.fromBottom + seHeight, end: moduleHeight }
      break
  }

  return { specialElementY, fillAbove, fillBelow }
}
