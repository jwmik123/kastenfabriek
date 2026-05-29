import { describe, it, expect } from 'vitest'
import {
  WASHER_SINGLE,
  WASHER_DOUBLE_GLB,
  WASHER_PLANK,
  WASHER_WMOPEN,
  WASHER_LAYOUTS,
  WASM_LOW_MODULE_LAYOUTS,
  isLayoutAvailable,
  getWasmModuleLayouts,
} from '../moduleLayouts'
import { filterForSection } from '../sections/wasmModuleLayoutFilter'
import type { ModuleLayout } from '@/types/configurator-pricing'

const baseLayout: ModuleLayout = {
  layoutId: 1,
  name: 'Shelves',
  description: '',
  contents: { shelves: 3, rods: 0, drawers: 0 },
  priceDouble: 100,
  priceSingle: 50,
  availableForTopCabinet: true,
}

describe('WASHER_SINGLE', () => {
  it('has minSlotWidth of 65', () => {
    expect(WASHER_SINGLE.minSlotWidth).toBe(68.6)
  })

  it('has layoutId 11', () => {
    expect(WASHER_SINGLE.layoutId).toBe(11)
  })

  it('is not available for top cabinet', () => {
    expect(WASHER_SINGLE.availableForTopCabinet).toBe(false)
  })
})

describe('WASHER_LAYOUTS', () => {
  it('contains enkel, dubbel model, met plank, and lage kast variants', () => {
    const ids = WASHER_LAYOUTS.map((l) => l.layoutId)
    expect(ids).toContain(11)
    expect(ids).toContain(13)
    expect(ids).toContain(14)
    expect(ids).toContain(23)
  })

  it('does not contain removed dubbel naast elkaar variant (id 12)', () => {
    const ids = WASHER_LAYOUTS.map((l) => l.layoutId)
    expect(ids).not.toContain(12)
  })

  it('has exactly 4 entries', () => {
    expect(WASHER_LAYOUTS).toHaveLength(4)
  })

  it('high-section washers (11, 13, 14) have sectionType "high"', () => {
    expect(WASHER_SINGLE.sectionType).toBe('high')
    expect(WASHER_DOUBLE_GLB.sectionType).toBe('high')
    expect(WASHER_PLANK.sectionType).toBe('high')
  })

  it('lage kast washer (23) has sectionType "low"', () => {
    expect(WASHER_WMOPEN.sectionType).toBe('low')
  })

  it('all washers carry hasWashingMachineShelf: true', () => {
    for (const l of WASHER_LAYOUTS) {
      expect(l.contents.hasWashingMachineShelf).toBe(true)
    }
  })
})

describe('WASM_LOW_MODULE_LAYOUTS', () => {
  it('contains the three non-washer lage kast modules (20, 21, 22)', () => {
    const ids = WASM_LOW_MODULE_LAYOUTS.map((l) => l.layoutId)
    expect(ids).toEqual([20, 21, 22])
  })

  it('all entries have sectionType "low"', () => {
    for (const l of WASM_LOW_MODULE_LAYOUTS) {
      expect(l.sectionType).toBe('low')
    }
  })

  it('none are washer entries', () => {
    for (const l of WASM_LOW_MODULE_LAYOUTS) {
      expect(l.contents.hasWashingMachineShelf ?? false).toBe(false)
    }
  })
})

describe('WasherStep picker — filterForSection on WASHER_LAYOUTS', () => {
  it('low section yields only WASHER_WMOPEN (id 23)', () => {
    const ids = filterForSection(WASHER_LAYOUTS, 'low').map((l) => l.layoutId)
    expect(ids).toEqual([23])
  })

  it('high section yields the three tall washer variants', () => {
    const ids = filterForSection(WASHER_LAYOUTS, 'high').map((l) => l.layoutId).sort()
    expect(ids).toEqual([11, 13, 14])
  })
})

describe('isLayoutAvailable', () => {
  it('returns true for layouts without minSlotWidth', () => {
    expect(isLayoutAvailable(baseLayout, 30)).toBe(true)
  })

  it('returns false for washer single when slot too narrow', () => {
    expect(isLayoutAvailable(WASHER_SINGLE, 60)).toBe(false)
  })

  it('returns true for washer single when slot exactly meets minimum', () => {
    expect(isLayoutAvailable(WASHER_SINGLE, 68.6)).toBe(true)
  })

  it('returns true for washer single when slot is wider', () => {
    expect(isLayoutAvailable(WASHER_SINGLE, 100)).toBe(true)
  })
})

describe('getWasmModuleLayouts', () => {
  it('includes non-washer sanity layouts', () => {
    const result = getWasmModuleLayouts([baseLayout])
    expect(result.find((l) => l.layoutId === 1)).toBeDefined()
  })

  it('includes WASHER_SINGLE (id 11)', () => {
    const result = getWasmModuleLayouts([])
    expect(result.find((l) => l.layoutId === 11)).toBeDefined()
  })

  it('includes WASHER_DOUBLE_GLB (id 13)', () => {
    const result = getWasmModuleLayouts([])
    expect(result.find((l) => l.layoutId === 13)).toBeDefined()
  })

  it('includes WASHER_PLANK (id 14)', () => {
    const result = getWasmModuleLayouts([])
    expect(result.find((l) => l.layoutId === 14)).toBeDefined()
  })

  it('includes WASHER_WMOPEN (id 23)', () => {
    const result = getWasmModuleLayouts([])
    expect(result.find((l) => l.layoutId === 23)).toBeDefined()
  })

  it('includes the three low-section non-washer modules (20, 21, 22)', () => {
    const result = getWasmModuleLayouts([])
    expect(result.find((l) => l.layoutId === 20)).toBeDefined()
    expect(result.find((l) => l.layoutId === 21)).toBeDefined()
    expect(result.find((l) => l.layoutId === 22)).toBeDefined()
  })

  it('does not include removed dubbel naast elkaar variant (id 12)', () => {
    const result = getWasmModuleLayouts([])
    expect(result.find((l) => l.layoutId === 12)).toBeUndefined()
  })

  it('hardcoded layouts come after non-hardcoded sanity layouts', () => {
    const result = getWasmModuleLayouts([baseLayout])
    const sanityIdx = result.findIndex((l) => l.layoutId === 1)
    const washerIdx = result.findIndex((l) => l.layoutId === 11)
    const lowIdx = result.findIndex((l) => l.layoutId === 20)
    expect(washerIdx).toBeGreaterThan(sanityIdx)
    expect(lowIdx).toBeGreaterThan(sanityIdx)
  })

  it('merges Sanity pricing into non-washer low module when IDs match', () => {
    const sanityLow: ModuleLayout = {
      ...baseLayout,
      layoutId: 20,
      name: 'Sanity low plank',
      priceSingle: 77,
      priceDouble: 88,
    }
    const result = getWasmModuleLayouts([sanityLow])
    const entry = result.find((l) => l.layoutId === 20)!
    expect(entry.priceSingle).toBe(77)
    expect(entry.priceDouble).toBe(88)
    expect(entry.name).toBe('Lage kast — plank')
  })

  it('deduplicates: Sanity layout with same ID as low module is not included twice', () => {
    const sanityLow: ModuleLayout = {
      ...baseLayout,
      layoutId: 20,
      name: 'Sanity low plank',
    }
    const result = getWasmModuleLayouts([sanityLow])
    const matches = result.filter((l) => l.layoutId === 20)
    expect(matches).toHaveLength(1)
  })

  it('deduplicates: Sanity layout with same ID as washer is not included twice', () => {
    const sanityWasher: ModuleLayout = {
      ...baseLayout,
      layoutId: WASHER_SINGLE.layoutId,
      name: 'Sanity washer',
      priceSingle: 99,
      priceDouble: 150,
    }
    const result = getWasmModuleLayouts([sanityWasher])
    const matches = result.filter((l) => l.layoutId === WASHER_SINGLE.layoutId)
    expect(matches).toHaveLength(1)
  })

  it('merges Sanity pricing into washer layout when IDs match', () => {
    const sanityWasher: ModuleLayout = {
      ...baseLayout,
      layoutId: WASHER_SINGLE.layoutId,
      name: 'Sanity washer',
      priceSingle: 99,
      priceDouble: 150,
    }
    const result = getWasmModuleLayouts([sanityWasher])
    const entry = result.find((l) => l.layoutId === WASHER_SINGLE.layoutId)!
    expect(entry.priceSingle).toBe(99)
    expect(entry.minSlotWidth).toBe(68.6)
    expect(entry.name).toBe('Wasmachine (enkel)')
  })
})
