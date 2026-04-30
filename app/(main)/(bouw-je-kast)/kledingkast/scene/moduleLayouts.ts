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
    height: number         // height in meters — used for fill zone placement; should match GLB
    anchor: Anchor
    placeholderDimensions?: { w: number; h: number; d: number } // shown when glbPath is null but height > 0
    centered?: boolean          // center GLB in slot interior (X and Z); default: left/back-aligned
    stacked?: boolean           // render two GLB instances stacked vertically; height/2 per unit
    double?: boolean            // render two GLB instances side by side; each centered in half the slot
    glbMaterialMeshes?: string[]    // mesh names that keep their baked GLB material (not overridden by closet material)
    chromeMaterialMeshes?: string[] // mesh names that get chrome material regardless of naming convention
    glassMaterialMeshes?: string[]  // mesh names that get opaque glass material (reflective, not transparent)
    noDoorDepthOffset?: number      // extra Z offset applied when hasDoor is false (washer modules need this)
  }

  fillZone: {
    above: FillZoneConfig
    below: FillZoneConfig
  }
}

export type { Anchor, FillZoneConfig, FillShelves, FillOpen }

// Default shelf spacing and thickness
// Heights of special elements must be multiples of SHELF_SPACING for clean alignment
export const SHELF_SPACING = 0.35  // 35cm
export const SHELF_THICKNESS = 0.018 // 2.5cm

//TODO: afwerk 18 36

/**
 * Module layout registry.
 *
 * To add a new layout: drop in a GLB and add an entry here.
 * Width and depth are measured automatically at runtime from the GLB bounding box.
 * Only `height` needs to be set manually — it drives fill zone placement.
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
      glbPath: '/objects/ModuleDrawer.glb',
      height: 0.70,  // 2 × 0.35
      anchor: { type: 'bottom' },
    },
    fillZone: {
      above: { type: 'shelves', spacing: SHELF_SPACING },
      below: { type: 'open' },
    },
  },
  {
    id: 3,
    label: 'Double Rod + shelves',
    description: 'Laden onderin, planken erboven',
    specialElement: {
      glbPath: '/objects/ModuleDoubleRod.glb',
      height: 1.75,  // 5 × 0.35
      anchor: { type: 'bottom' },
    },
    fillZone: {
      above: { type: 'shelves', spacing: SHELF_SPACING },
      below: { type: 'open' },
    },
  },
  {
    id: 4,
    label: 'Split shelves + rod',
    description: 'Laden onderin, planken erboven',
    specialElement: {
      glbPath: '/objects/ModuleSplit.glb',
      height: 1.75,  // 5 × 0.35 — GLB top (~1.742) clears this
      anchor: { type: 'bottom' },
    },
    fillZone: {
      above: { type: 'shelves', spacing: SHELF_SPACING },
      below: { type: 'open' },
    },
  },
  {
    id: 5,
    label: 'Single Rod',
    description: 'Laden onderin, planken erboven',
    specialElement: {
      glbPath: '/objects/ModuleSingleRod.glb',
      height: 1.05,  // 3 × 0.35
      anchor: { type: 'bottom' },
    },
    fillZone: {
      above: { type: 'shelves', spacing: SHELF_SPACING },
      below: { type: 'open' },
    },
  },
  {
    id: 6,
    label: 'Shelf Rod',
    description: 'Laden onderin, planken erboven',
    specialElement: {
      glbPath: '/objects/ModuleShelfRod.glb',
      height: 1.75,  // 5 × 0.35 — GLB top (~1.742) clears this
      anchor: { type: 'bottom' },
    },
    fillZone: {
      above: { type: 'shelves', spacing: SHELF_SPACING },
      below: { type: 'open' },
    },
  },
  {
    id: 7,
    label: 'Drawer Rod',
    description: 'Laden onderin, planken erboven',
    specialElement: {
      glbPath: '/objects/ModuleDrawerRod.glb',
      height: 1.75,  // 5 × 0.35
      anchor: { type: 'bottom' },
    },
    fillZone: {
      above: { type: 'shelves', spacing: SHELF_SPACING },
      below: { type: 'open' },
    },
  },
  {
    id: 8,
    label: 'Desk',
    description: 'Laden onderin, planken erboven',
    specialElement: {
      glbPath: '/objects/ModuleDesk.glb',
      height: 1.75,  // 5 × 0.35
      anchor: { type: 'bottom' },
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
      specialElementY = -0.118
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
