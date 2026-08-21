import type { ModuleLayout } from '@/types/configurator-pricing'

export const WASHER_SINGLE: ModuleLayout = {
  layoutId: 11,
  name: '1 grote lade',
  description: '1 wasmachine — minimaal 68.6 cm breed',
  contents: { shelves: 2, rods: 0, drawers: 0, hasWashingMachineShelf: true },
  priceDouble: 0,
  priceSingle: 0,
  availableForTopCabinet: false,
  sectionType: 'high',
  minSlotWidth: 68.6,
}

export const WASHER_DOUBLE_GLB: ModuleLayout = {
  layoutId: 13,
  name: '2 lades',
  description: '2 wasmachines in één kast',
  contents: { shelves: 0, rods: 0, drawers: 0, hasWashingMachineShelf: true },
  priceDouble: 0,
  priceSingle: 0,
  availableForTopCabinet: false,
  sectionType: 'high',
  minSlotWidth: 68.6,
}

export const WASHER_PLANK: ModuleLayout = {
  layoutId: 14,
  name: 'Plank met lade',
  description: 'Wasmachine met een plank erboven',
  contents: { shelves: 1, rods: 0, drawers: 0, hasWashingMachineShelf: true },
  priceDouble: 0,
  priceSingle: 0,
  availableForTopCabinet: false,
  sectionType: 'high',
  minSlotWidth: 68.6,
}

export const WASHER_WMOPEN: ModuleLayout = {
  layoutId: 23,
  name: 'Wasmachine (lage kast)',
  description: 'Open vak voor wasmachine onder werkblad — minimaal 68.6 cm breed',
  contents: { shelves: 0, rods: 0, drawers: 0, hasWashingMachineShelf: true },
  priceDouble: 0,
  priceSingle: 0,
  availableForTopCabinet: false,
  sectionType: 'low',
  minSlotWidth: 68.6,
}

export const WASHER_LAYOUTS: ModuleLayout[] = [
  WASHER_SINGLE,
  WASHER_DOUBLE_GLB,
  WASHER_PLANK,
  WASHER_WMOPEN,
]

export const WASHER_LAYOUT_IDS: ReadonlySet<number> = new Set(
  WASHER_LAYOUTS.map((l) => l.layoutId),
)

export const WASM_LOW_PLANK: ModuleLayout = {
  layoutId: 20,
  name: 'Lage kast — plank',
  description: 'Lage kast module met plank',
  contents: { shelves: 1, rods: 0, drawers: 0 },
  priceDouble: 0,
  priceSingle: 0,
  availableForTopCabinet: false,
  sectionType: 'low',
}

export const WASM_LOW_SINGLE: ModuleLayout = {
  layoutId: 21,
  name: 'Lage kast — enkel vak',
  description: 'Lage kast module met één vak',
  contents: { shelves: 0, rods: 0, drawers: 0 },
  priceDouble: 0,
  priceSingle: 0,
  availableForTopCabinet: false,
  sectionType: 'low',
}

export const WASM_LOW_DOUBLE: ModuleLayout = {
  layoutId: 22,
  name: 'Lage kast — dubbel vak',
  description: 'Lage kast module met twee vakken',
  contents: { shelves: 0, rods: 0, drawers: 0 },
  priceDouble: 0,
  priceSingle: 0,
  availableForTopCabinet: false,
  sectionType: 'low',
}

export const WASM_LOW_MODULE_LAYOUTS: ModuleLayout[] = [
  WASM_LOW_PLANK,
  WASM_LOW_SINGLE,
  WASM_LOW_DOUBLE,
]

export function isLayoutAvailable(layout: ModuleLayout, moduleWidthCm: number): boolean {
  if (!layout.minSlotWidth) return true
  return moduleWidthCm >= layout.minSlotWidth
}

/**
 * Pull the price out of Sanity; name, description and contents stay code-owned
 * because they describe geometry the GLB fixes.
 *
 * A layoutId is not unique in the catalogue — 14 exists twice, once per
 * section. Match on the section as well so the right one wins, and fall back to
 * the id alone for layouts whose Sanity doc has no sectionType set.
 */
function mergeSanityPricing(hardcoded: ModuleLayout, sanityLayouts: ModuleLayout[]): ModuleLayout {
  const sameId = sanityLayouts.filter((l) => l.layoutId === hardcoded.layoutId)
  const sanity =
    sameId.find((l) => l.sectionType === hardcoded.sectionType) ?? sameId[0]
  return sanity
    ? { ...hardcoded, priceSingle: sanity.priceSingle, priceDouble: sanity.priceDouble }
    : hardcoded
}

export function getWasmModuleLayouts(sanityLayouts: ModuleLayout[]): ModuleLayout[] {
  const hardcodedIds = new Set([
    ...WASHER_LAYOUTS.map((l) => l.layoutId),
    ...WASM_LOW_MODULE_LAYOUTS.map((l) => l.layoutId),
  ])
  const nonHardcoded = sanityLayouts.filter((l) => !hardcodedIds.has(l.layoutId))
  const mergedWashers = WASHER_LAYOUTS.map((l) => mergeSanityPricing(l, sanityLayouts))
  const mergedLowModules = WASM_LOW_MODULE_LAYOUTS.map((l) => mergeSanityPricing(l, sanityLayouts))
  return [...nonHardcoded, ...mergedWashers, ...mergedLowModules]
}
