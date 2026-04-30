import { describe, it, expect } from 'vitest'
import {
  WASHER_SINGLE,
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
  it('contains enkel, dubbel model, and met plank variants', () => {
    const ids = WASHER_LAYOUTS.map((l) => l.layoutId)
    expect(ids).toContain(11)
    expect(ids).toContain(13)
    expect(ids).toContain(14)
  })

  it('does not contain removed dubbel naast elkaar variant (id 12)', () => {
    const ids = WASHER_LAYOUTS.map((l) => l.layoutId)
    expect(ids).not.toContain(12)
  })

  it('has exactly 3 entries', () => {
    expect(WASHER_LAYOUTS).toHaveLength(3)
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

  it('does not include removed dubbel naast elkaar variant (id 12)', () => {
    const result = getWasmModuleLayouts([])
    expect(result.find((l) => l.layoutId === 12)).toBeUndefined()
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
    expect(entry.minSlotWidth).toBe(68.6)
    expect(entry.name).toBe('Wasmachine (enkel)')
  })
})
