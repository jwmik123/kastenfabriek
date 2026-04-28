import { describe, it, expect } from 'vitest'
import { computeDebugGlobal } from '../hooks/useDebugPricing'
import type { FullPricingData } from '@/types/configurator-pricing'
import type { ModuleSlot } from '../store'

const constraints = {
  singleCorpus: { minWidth: 0, maxWidth: 200, minHeight: 0, maxHeight: 300, minDepth: 0, maxDepth: 100 },
  doubleCorpus: { minWidth: 0, maxWidth: 400, minHeight: 0, maxHeight: 300, minDepth: 0, maxDepth: 100 },
  topCabinet: { maxHeight: 50 },
}

const basePricingData: FullPricingData = {
  config: {
    currency: 'EUR',
    lastUpdated: '2026-01-01',
    led: { basePrice: 50, pricePerModule: 20 },
    deliveryPrice: 95,
    constraints,
  },
  modules: [
    { layoutId: 1, name: 'Open', description: '', contents: { shelves: 2, rods: 0, drawers: 0 }, priceSingle: 200, priceDouble: 350, availableForTopCabinet: false },
  ],
  doors: [
    { id: 'd1', name: 'Standard', price: 120, variant: 'standard' },
    { id: 'd2', name: 'Small', price: 80, variant: 'small' },
    { id: 'd3', name: 'Veneer', price: 180, variant: 'veneer' },
  ],
  accessories: [
    { id: 'push-to-open', name: 'Push-to-open', price: 15, category: 'mechanism', perUnit: true },
    { id: 'power-cable-holes', name: 'Power hole', price: 25, category: 'electrical', perUnit: true },
  ],
  handles: [
    { id: 'h1', name: 'Bar handle', productCode: 'H1', price: 10 },
  ],
  installation: [
    { name: 'Basis', minTotal: 0, maxTotal: 1000, price: 100 },
    { name: 'Premium', minTotal: 1000, maxTotal: 99999, price: 250 },
  ],
}

const emptyModules: ModuleSlot[] = [
  { slotIndex: 0, layoutId: null, hasDoor: false, span: 1 },
  { slotIndex: 1, layoutId: null, hasDoor: false, span: 1 },
  { slotIndex: 2, layoutId: null, hasDoor: false, span: 1 },
]

describe('computeDebugGlobal — LED', () => {
  it('ledCost is 0 when light strips disabled', () => {
    const result = computeDebugGlobal({
      pricingData: basePricingData,
      modules: emptyModules,
      moduleCount: 3,
      buitenkantMaterialId: 'premium-wit',
      doorHandleId: 'h1',
      lightStripsEnabled: false,
      hasTopCabinet: false,
    })
    expect(result.ledCost).toBe(0)
  })

  it('ledCost = basePrice + pricePerModule * moduleCount when enabled', () => {
    const result = computeDebugGlobal({
      pricingData: basePricingData,
      modules: emptyModules,
      moduleCount: 3,
      buitenkantMaterialId: 'premium-wit',
      doorHandleId: 'h1',
      lightStripsEnabled: true,
      hasTopCabinet: false,
    })
    // 50 + 20 * 3 = 110
    expect(result.ledCost).toBe(110)
    expect(result.ledModuleCount).toBe(3)
  })
})

describe('computeDebugGlobal — delivery', () => {
  it('deliveryCost matches pricingData.config.deliveryPrice', () => {
    const result = computeDebugGlobal({
      pricingData: basePricingData,
      modules: emptyModules,
      moduleCount: 3,
      buitenkantMaterialId: 'premium-wit',
      doorHandleId: 'h1',
      lightStripsEnabled: false,
      hasTopCabinet: false,
    })
    expect(result.deliveryCost).toBe(95)
  })
})

describe('computeDebugGlobal — installation tier', () => {
  it('selects Basis tier when subtotal < 1000', () => {
    // empty modules, no doors, no LED → subtotal = 0 + 95 delivery = 95
    const result = computeDebugGlobal({
      pricingData: basePricingData,
      modules: emptyModules,
      moduleCount: 3,
      buitenkantMaterialId: 'premium-wit',
      doorHandleId: 'h1',
      lightStripsEnabled: false,
      hasTopCabinet: false,
    })
    expect(result.installationTierName).toBe('Basis')
    expect(result.installationCost).toBe(100)
  })

  it('selects Premium tier when subtotal >= 1000', () => {
    // 5 modules each with layoutId=1 → 5*200 = 1000 + 95 delivery = 1095 → Premium
    const mods: ModuleSlot[] = Array.from({ length: 5 }, (_, i) => ({
      slotIndex: i, layoutId: 1, hasDoor: false, span: 1 as const,
    }))
    const result = computeDebugGlobal({
      pricingData: basePricingData,
      modules: mods,
      moduleCount: 5,
      buitenkantMaterialId: 'premium-wit',
      doorHandleId: 'h1',
      lightStripsEnabled: false,
      hasTopCabinet: false,
    })
    expect(result.subtotal).toBeGreaterThanOrEqual(1000)
    expect(result.installationTierName).toBe('Premium')
    expect(result.installationCost).toBe(250)
  })
})

describe('computeDebugGlobal — grandTotal', () => {
  it('grandTotal = subtotal + installationCost', () => {
    const result = computeDebugGlobal({
      pricingData: basePricingData,
      modules: emptyModules,
      moduleCount: 3,
      buitenkantMaterialId: 'premium-wit',
      doorHandleId: 'h1',
      lightStripsEnabled: false,
      hasTopCabinet: false,
    })
    expect(result.grandTotal).toBe(result.subtotal + result.installationCost)
  })

  it('grandTotal matches useCartPrice formula for a known configuration', () => {
    // 1 module layout 1 (priceSingle=200), 1 door (standard=120), handle h1 (10), delivery 95
    // subtotal = 200 + 120 + 10 + 0 + 0 + 95 = 425 → Basis tier → +100 = 525
    const mods: ModuleSlot[] = [{ slotIndex: 0, layoutId: 1, hasDoor: true, span: 1 }]
    const result = computeDebugGlobal({
      pricingData: basePricingData,
      modules: mods,
      moduleCount: 1,
      buitenkantMaterialId: 'premium-wit', // color → standard door variant
      doorHandleId: 'h1',
      lightStripsEnabled: false,
      hasTopCabinet: false,
    })
    expect(result.subtotal).toBe(425)
    expect(result.grandTotal).toBe(525)
  })
})
