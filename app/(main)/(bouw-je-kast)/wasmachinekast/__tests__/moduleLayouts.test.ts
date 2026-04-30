import { describe, it, expect } from 'vitest'
import {
  WASHER_SINGLE,
  WASHER_DOUBLE,
  WASHER_STACKED,
  WASHER_LAYOUTS,
  isLayoutAvailable,
  getWasmModuleLayouts,
} from '../moduleLayouts'
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
    expect(WASHER_SINGLE.minSlotWidth).toBe(65)
  })

  it('has layoutId 11', () => {
    expect(WASHER_SINGLE.layoutId).toBe(11)
  })

  it('is not available for top cabinet', () => {
    expect(WASHER_SINGLE.availableForTopCabinet).toBe(false)
  })
})

describe('WASHER_DOUBLE', () => {
  it('has minSlotWidth of 130', () => {
    expect(WASHER_DOUBLE.minSlotWidth).toBe(130)
  })

  it('has layoutId 12', () => {
    expect(WASHER_DOUBLE.layoutId).toBe(12)
  })

  it('is not available for top cabinet', () => {
    expect(WASHER_DOUBLE.availableForTopCabinet).toBe(false)
  })
})

describe('WASHER_STACKED', () => {
  it('has layoutId 13', () => {
    expect(WASHER_STACKED.layoutId).toBe(13)
  })

  it('has minSlotWidth of 65', () => {
    expect(WASHER_STACKED.minSlotWidth).toBe(65)
  })

  it('is not available for top cabinet', () => {
    expect(WASHER_STACKED.availableForTopCabinet).toBe(false)
  })
})

describe('WASHER_LAYOUTS', () => {
  it('contains all three washer variants', () => {
    const ids = WASHER_LAYOUTS.map((l) => l.layoutId)
    expect(ids).toContain(11)
    expect(ids).toContain(12)
    expect(ids).toContain(13)
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
    expect(isLayoutAvailable(WASHER_SINGLE, 65)).toBe(true)
  })

  it('returns true for washer single when slot is wider', () => {
    expect(isLayoutAvailable(WASHER_SINGLE, 100)).toBe(true)
  })

  it('returns false for washer double when slot too narrow', () => {
    expect(isLayoutAvailable(WASHER_DOUBLE, 120)).toBe(false)
  })

  it('returns true for washer double when slot meets minimum', () => {
    expect(isLayoutAvailable(WASHER_DOUBLE, 130)).toBe(true)
  })

  it('returns false for washer stacked when slot too narrow', () => {
    expect(isLayoutAvailable(WASHER_STACKED, 60)).toBe(false)
  })

  it('returns true for washer stacked when slot exactly meets minimum', () => {
    expect(isLayoutAvailable(WASHER_STACKED, 65)).toBe(true)
  })
})

describe('getWasmModuleLayouts', () => {
  it('includes non-washer sanity layouts', () => {
    const result = getWasmModuleLayouts([baseLayout])
    expect(result.find((l) => l.layoutId === 1)).toBeDefined()
  })

  it('includes WASHER_SINGLE', () => {
    const result = getWasmModuleLayouts([])
    expect(result.find((l) => l.layoutId === 11)).toBeDefined()
  })

  it('includes WASHER_DOUBLE', () => {
    const result = getWasmModuleLayouts([])
    expect(result.find((l) => l.layoutId === 12)).toBeDefined()
  })

  it('includes WASHER_STACKED', () => {
    const result = getWasmModuleLayouts([])
    expect(result.find((l) => l.layoutId === 13)).toBeDefined()
  })

  it('washer layouts come after non-washer sanity layouts', () => {
    const result = getWasmModuleLayouts([baseLayout])
    const sanityIdx = result.findIndex((l) => l.layoutId === 1)
    const washerIdx = result.findIndex((l) => l.layoutId === 11)
    expect(washerIdx).toBeGreaterThan(sanityIdx)
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
    expect(entry.minSlotWidth).toBe(65)
    expect(entry.name).toBe('Wasmachine (enkel)')
  })
})
