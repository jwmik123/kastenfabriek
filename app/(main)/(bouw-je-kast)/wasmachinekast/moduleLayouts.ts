import type { ModuleLayout } from '@/types/configurator-pricing'

export const WASHER_SINGLE: ModuleLayout = {
  layoutId: 100,
  name: 'Wasmachine (enkel)',
  description: '1 wasmachine — minimaal 75 cm breed',
  contents: { shelves: 0, rods: 0, drawers: 0, hasWashingMachineShelf: true },
  priceDouble: 0,
  priceSingle: 0,
  availableForTopCabinet: false,
  minSlotWidth: 75,
}

export const WASHER_DOUBLE: ModuleLayout = {
  layoutId: 101,
  name: 'Wasmachine (dubbel)',
  description: '2 wasmachines naast elkaar — minimaal 150 cm breed',
  contents: { shelves: 0, rods: 0, drawers: 0, hasWashingMachineShelf: true },
  priceDouble: 0,
  priceSingle: 0,
  availableForTopCabinet: false,
  minSlotWidth: 150,
}

export const WASHER_LAYOUTS: ModuleLayout[] = [WASHER_SINGLE, WASHER_DOUBLE]

export function isLayoutAvailable(layout: ModuleLayout, moduleWidthCm: number): boolean {
  if (!layout.minSlotWidth) return true
  return moduleWidthCm >= layout.minSlotWidth
}

export function getWasmModuleLayouts(sanityLayouts: ModuleLayout[]): ModuleLayout[] {
  return [...sanityLayouts, ...WASHER_LAYOUTS]
}
