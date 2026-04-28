import { describe, it, expect } from 'vitest'
import {
  WASHER_SINGLE,
  WASHER_DOUBLE,
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
  it('has minSlotWidth of 75', () => {
    expect(WASHER_SINGLE.minSlotWidth).toBe(75)
  })

  it('is not available for top cabinet', () => {
    expect(WASHER_SINGLE.availableForTopCabinet).toBe(false)
  })
})

describe('WASHER_DOUBLE', () => {
  it('has minSlotWidth of 150', () => {
    expect(WASHER_DOUBLE.minSlotWidth).toBe(150)
  })

  it('is not available for top cabinet', () => {
    expect(WASHER_DOUBLE.availableForTopCabinet).toBe(false)
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
    expect(isLayoutAvailable(WASHER_SINGLE, 75)).toBe(true)
  })

  it('returns true for washer single when slot is wider', () => {
    expect(isLayoutAvailable(WASHER_SINGLE, 100)).toBe(true)
  })

  it('returns false for washer double when slot too narrow', () => {
    expect(isLayoutAvailable(WASHER_DOUBLE, 120)).toBe(false)
  })

  it('returns true for washer double when slot meets minimum', () => {
    expect(isLayoutAvailable(WASHER_DOUBLE, 150)).toBe(true)
  })
})

describe('getWasmModuleLayouts', () => {
  it('includes non-washer sanity layouts', () => {
    const result = getWasmModuleLayouts([baseLayout])
    expect(result.find((l) => l.layoutId === 1)).toBeDefined()
  })

  it('includes WASHER_SINGLE', () => {
    const result = getWasmModuleLayouts([])
    expect(result.find((l) => l.layoutId === WASHER_SINGLE.layoutId)).toBeDefined()
  })

  it('includes WASHER_DOUBLE', () => {
    const result = getWasmModuleLayouts([])
    expect(result.find((l) => l.layoutId === WASHER_DOUBLE.layoutId)).toBeDefined()
  })

  it('washer layouts come after non-washer sanity layouts', () => {
    const result = getWasmModuleLayouts([baseLayout])
    const sanityIdx = result.findIndex((l) => l.layoutId === 1)
    const washerIdx = result.findIndex((l) => l.layoutId === WASHER_SINGLE.layoutId)
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
    expect(entry.minSlotWidth).toBe(75)
    expect(entry.name).toBe('Wasmachine (enkel)')
  })
})
