import type { ModuleLayout } from '@/types/configurator-pricing'

export const WASHER_SINGLE: ModuleLayout = {
  layoutId: 11,
  name: 'Wasmachine (enkel)',
  description: '1 wasmachine — minimaal 68.6 cm breed',
  contents: { shelves: 2, rods: 0, drawers: 0, hasWashingMachineShelf: true },
  priceDouble: 0,
  priceSingle: 0,
  availableForTopCabinet: false,
  sectionType: 'both',
  minSlotWidth: 68.6,
}

export const WASHER_DOUBLE_GLB: ModuleLayout = {
  layoutId: 13,
  name: 'Wasmachine (dubbel model)',
  description: '2 wasmachines in één kast',
  contents: { shelves: 0, rods: 0, drawers: 0, hasWashingMachineShelf: true },
  priceDouble: 0,
  priceSingle: 0,
  availableForTopCabinet: false,
  sectionType: 'both',
  minSlotWidth: 68.6,
}

export const WASHER_PLANK: ModuleLayout = {
  layoutId: 14,
  name: 'Wasmachine met plank',
  description: 'Wasmachine met een plank erboven',
  contents: { shelves: 1, rods: 0, drawers: 0, hasWashingMachineShelf: true },
  priceDouble: 0,
  priceSingle: 0,
  availableForTopCabinet: false,
  sectionType: 'high',
  minSlotWidth: 68.6,
}

export const WASHER_LAYOUTS: ModuleLayout[] = [WASHER_SINGLE, WASHER_DOUBLE_GLB, WASHER_PLANK]

export const WASHER_LAYOUT_IDS: ReadonlySet<number> = new Set(
  WASHER_LAYOUTS.map((l) => l.layoutId),
)

export function isLayoutAvailable(layout: ModuleLayout, moduleWidthCm: number): boolean {
  if (!layout.minSlotWidth) return true
  return moduleWidthCm >= layout.minSlotWidth
}

export function getWasmModuleLayouts(sanityLayouts: ModuleLayout[]): ModuleLayout[] {
  const washerIds = new Set(WASHER_LAYOUTS.map((l) => l.layoutId))
  // Non-washer Sanity layouts first, then washer entries (merged with Sanity pricing if available)
  const nonWasher = sanityLayouts.filter((l) => !washerIds.has(l.layoutId))
  const merged = WASHER_LAYOUTS.map((washer) => {
    const sanity = sanityLayouts.find((l) => l.layoutId === washer.layoutId)
    return sanity
      ? { ...washer, priceSingle: sanity.priceSingle, priceDouble: sanity.priceDouble }
      : washer
  })
  return [...nonWasher, ...merged]
}
