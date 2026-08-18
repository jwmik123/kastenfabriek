import { describe, it, expect } from 'vitest'
import { priceWasmachinekast } from '../wasmSectionPricing'
import type { Section, WasmSectionsState } from '../types'
import type { FullPricingData, PricingConstraints } from '@/types/configurator-pricing'

const constraints: PricingConstraints = {
  singleCorpus: { minWidth: 15, maxWidth: 65, minHeight: 200, maxHeight: 275, minDepth: 85, maxDepth: 120 },
  doubleCorpus: { minWidth: 66, maxWidth: 250, minHeight: 200, maxHeight: 275, minDepth: 85, maxDepth: 120 },
  topCabinet: { maxHeight: 110 },
}

const pricingData: FullPricingData = {
  config: {
    currency: 'EUR',
    lastUpdated: '2026-01-01',
    led: { basePrice: 0, pricePerModule: 0 },
    deliveryPrice: 95,
    constraints,
  },
  modules: [
    {
      layoutId: 1, name: 'Planken', description: '',
      contents: { shelves: 3, rods: 0, drawers: 0 },
      priceSingle: 100, priceDouble: 200, availableForTopCabinet: true,
    },
    {
      layoutId: 2, name: 'Lade', description: '',
      contents: { shelves: 0, rods: 0, drawers: 3 },
      priceSingle: 150, priceDouble: 300, availableForTopCabinet: true,
    },
  ],
  accessories: [], doors: [], installation: [], handles: [],
}

const RATE = 0.01 // €/cm²
const DEPTH = 90

const mkModules = (layoutIds: (number | null)[]) =>
  layoutIds.map((layoutId, i) => ({
    slotIndex: i,
    layoutId,
    hasDoor: true,
    span: 1 as 1,
    hasPowerHole: false,
  }))

const high: Section = { width: 160, height: 240, moduleCount: 2, modules: mkModules([1, 2]) }
const low: Section = {
  width: 120, height: 90, moduleCount: 2, modules: mkModules([1, 2]),
  topPanelThicknessMm: 18, countertopMaterialId: 'antraciet',
}

describe('priceWasmachinekast', () => {
  it('high-only: prices high section, no werkblad', () => {
    const state: WasmSectionsState = {
      layout: 'high-only', highSection: high, lowSection: null,
    }
    const r = priceWasmachinekast({ state, depth: DEPTH, pricingData, buitenkantRatePerSqCm: RATE })
    // 160cm > 65 → double; 200 + 300 = 500
    expect(r.high).toBe(500)
    expect(r.low).toBe(0)
    expect(r.werkblad).toBe(0)
    expect(r.shared).toBe(95)
    expect(r.total).toBe(595)
  })

  it('low-only: prices low section + werkblad', () => {
    const state: WasmSectionsState = {
      layout: 'low-only', highSection: null, lowSection: low,
    }
    const r = priceWasmachinekast({ state, depth: DEPTH, pricingData, buitenkantRatePerSqCm: RATE })
    // 120cm > 65 → double; 200 + 300 = 500
    expect(r.high).toBe(0)
    expect(r.low).toBe(500)
    expect(r.werkblad).toBeCloseTo(120 * 90 * RATE, 10) // 108
    expect(r.total).toBeCloseTo(500 + 108 + 95, 10)
  })

  it('low-left: sums both sections + werkblad', () => {
    const state: WasmSectionsState = {
      layout: 'low-left', highSection: high, lowSection: low,
    }
    const r = priceWasmachinekast({ state, depth: DEPTH, pricingData, buitenkantRatePerSqCm: RATE })
    expect(r.high).toBe(500)
    expect(r.low).toBe(500)
    expect(r.werkblad).toBeCloseTo(108, 10)
    expect(r.total).toBeCloseTo(500 + 500 + 108 + 95, 10)
  })

  it('low-right: same totals as low-left (sections preserved)', () => {
    const stateL: WasmSectionsState = {
      layout: 'low-left', highSection: high, lowSection: low,
    }
    const stateR: WasmSectionsState = {
      layout: 'low-right', highSection: high, lowSection: low,
    }
    const rL = priceWasmachinekast({ state: stateL, depth: DEPTH, pricingData, buitenkantRatePerSqCm: RATE })
    const rR = priceWasmachinekast({ state: stateR, depth: DEPTH, pricingData, buitenkantRatePerSqCm: RATE })
    expect(rR.total).toBeCloseTo(rL.total, 10)
  })

  it('werkblad price is zero when no low section', () => {
    const state: WasmSectionsState = {
      layout: 'high-only', highSection: high, lowSection: null,
    }
    const r = priceWasmachinekast({ state, depth: DEPTH, pricingData, buitenkantRatePerSqCm: RATE })
    expect(r.werkblad).toBe(0)
  })

  it('18mm and 36mm werkblad produce identical totals', () => {
    const low18: Section = { ...low, topPanelThicknessMm: 18 }
    const low36: Section = { ...low, topPanelThicknessMm: 36 }
    const state18: WasmSectionsState = {
      layout: 'low-only', highSection: null, lowSection: low18,
    }
    const state36: WasmSectionsState = {
      layout: 'low-only', highSection: null, lowSection: low36,
    }
    const r18 = priceWasmachinekast({ state: state18, depth: DEPTH, pricingData, buitenkantRatePerSqCm: RATE })
    const r36 = priceWasmachinekast({ state: state36, depth: DEPTH, pricingData, buitenkantRatePerSqCm: RATE })
    expect(r36.total).toBeCloseTo(r18.total, 10)
  })
})
