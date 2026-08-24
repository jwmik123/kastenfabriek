import { describe, it, expect } from 'vitest'
import { computeWasmPricing } from '../pricing/computeWasmPricing'
import type { WasmPricingInput } from '../pricing/computeWasmPricing'
import type { FullPricingData } from '@/types/configurator-pricing'
import type { ModuleSlot } from '../store'
import type { Section } from '../sections/types'

const constraints = {
  singleCorpus: { minWidth: 0, maxWidth: 200, minHeight: 0, maxHeight: 300, minDepth: 0, maxDepth: 100 },
  doubleCorpus: { minWidth: 0, maxWidth: 400, minHeight: 0, maxHeight: 300, minDepth: 0, maxDepth: 100 },
  topCabinet: { maxHeight: 50 },
}

const pricingData: FullPricingData = {
  config: {
    currency: 'EUR',
    lastUpdated: '2026-01-01',
    led: { basePrice: 50, pricePerModule: 20 },
    deliveryPrice: 95,
    constraints,
  },
  modules: [
    // 1 — a shared layout with a plain door.
    { layoutId: 1, name: 'Open', description: '', contents: { shelves: 2, rods: 0, drawers: 0 }, priceSingle: 200, priceDouble: 350, availableForTopCabinet: false },
    // 11 — washer, single. 20 — lage kast with 2 drawer fronts.
    { layoutId: 11, name: 'Wasmachine', description: '', contents: { shelves: 0, rods: 0, drawers: 0 }, priceSingle: 400, priceDouble: 600, availableForTopCabinet: false },
    { layoutId: 20, name: 'Lage plank', description: '', contents: { shelves: 1, rods: 0, drawers: 0 }, priceSingle: 150, priceDouble: 260, availableForTopCabinet: false },
  ],
  doors: [
    { id: 'd1', name: 'Standard', price: 120, variant: 'standard' },
    { id: 'd2', name: 'Small', price: 80, variant: 'small' },
    { id: 'd3', name: 'Veneer', price: 180, variant: 'veneer' },
  ],
  accessories: [
    { id: 'push-to-open', name: 'Push-to-open', price: 15, category: 'mechanism', perUnit: true },
    { id: 'power-outlet', name: 'Stekkerdoos', price: 25, category: 'electrical', perUnit: true },
    { id: 'side-panels-36mm', name: 'Zijpanelen 36mm', price: 300, category: 'upgrade', perUnit: false },
  ],
  handles: [
    { id: 'h1', name: 'Beugel', productCode: 'H1', price: 10 },
    { id: 'h2', name: 'Kom (niet op lades)', productCode: 'H2', price: 40, fitsLowModule: false },
  ],
  installation: [
    { name: 'Basis', minTotal: 0, maxTotal: 1000, price: 100 },
    { name: 'Premium', minTotal: 1000, maxTotal: 99999, price: 250 },
  ],
}

function slot(over: Partial<ModuleSlot> & { slotIndex: number }): ModuleSlot {
  return { layoutId: null, hasDoor: false, span: 1, ...over }
}

function lowSectionOf(modules: ModuleSlot[]): Section {
  return { width: 120, height: 90, moduleCount: modules.length, modules }
}

function input(over: Partial<WasmPricingInput> = {}): WasmPricingInput {
  return {
    pricingData,
    layout: 'high-only',
    modules: [],
    lowSection: null,
    moduleCount: 0,
    buitenkantMaterialId: 'premium-wit',
    doorHandleId: 'h1',
    lightStripsEnabled: false,
    hasTopCabinet: false,
    sidePanelThickness: '18mm',
    ...over,
  }
}

describe('computeWasmPricing — modules and doors', () => {
  it('prices a door module as interieur + deur + greep', () => {
    const result = computeWasmPricing(
      input({ modules: [slot({ slotIndex: 0, layoutId: 1, hasDoor: true })], moduleCount: 1 }),
    )
    const row = result.rows[0]
    expect(row.interiorCost).toBe(200)
    expect(row.doorCost).toBe(120)
    expect(row.handleCost).toBe(10)
    expect(row.subtotal).toBe(330)
    expect(result.totals.moduleCost).toBe(200)
    expect(result.totals.doorCost).toBe(120)
    expect(result.totals.mechanismCost).toBe(10)
  })

  it('charges a double-span module two doors at the double tier', () => {
    const result = computeWasmPricing(
      input({ modules: [slot({ slotIndex: 0, layoutId: 1, hasDoor: true, span: 2 })], moduleCount: 2 }),
    )
    expect(result.rows[0].pricingTier).toBe('double')
    expect(result.rows[0].interiorCost).toBe(350)
    expect(result.rows[0].doorCount).toBe(2)
    expect(result.rows[0].doorCost).toBe(240)
    expect(result.rows[0].handleCost).toBe(20)
  })

  it('gives the door above a washing machine push-to-open, not a handle', () => {
    const result = computeWasmPricing(
      input({ modules: [slot({ slotIndex: 0, layoutId: 11, hasDoor: true })], moduleCount: 1 }),
    )
    const row = result.rows[0]
    expect(row.isWasher).toBe(true)
    expect(row.handleId).toBe('none')
    expect(row.handleCost).toBe(15)
    // The single drawer under the machine carries the cabinet handle.
    expect(row.drawerFrontCount).toBe(1)
    expect(row.drawerHandleCost).toBe(10)
  })

  it('drops the handle of a push-to-open module, fronts included', () => {
    const result = computeWasmPricing(
      input({ modules: [slot({ slotIndex: 0, layoutId: 1, hasDoor: true, pushToOpen: true })], moduleCount: 1 }),
    )
    expect(result.rows[0].handleId).toBe('none')
    expect(result.rows[0].handleCost).toBe(15)
    expect(result.rows[0].drawerFrontCount).toBe(0)
  })

  it('falls back to push-to-open for fronts when the handle does not fit one', () => {
    const result = computeWasmPricing(
      input({
        doorHandleId: 'h2',
        modules: [slot({ slotIndex: 0, layoutId: 11, hasDoor: false })],
        moduleCount: 1,
      }),
    )
    expect(result.handles.drawerHandleId).toBe('none')
    expect(result.rows[0].drawerHandleCost).toBe(15)
  })

  it('prices veneer doors for a texture material override', () => {
    const result = computeWasmPricing(
      input({
        modules: [slot({ slotIndex: 0, layoutId: 1, hasDoor: true, buitenkantMaterialId: 'eiken-fineer' })],
        moduleCount: 1,
      }),
    )
    // Only a texture material flips the door to veneer; a colour keeps standard.
    const expected = result.rows[0].doorVariant === 'veneer' ? 180 : 120
    expect(result.rows[0].doorCost).toBe(expected)
  })

  it('flags a module Sanity has no price document for', () => {
    const result = computeWasmPricing(
      input({ modules: [slot({ slotIndex: 0, layoutId: 999, hasDoor: false })], moduleCount: 1 }),
    )
    expect(result.rows[0].hasPriceDoc).toBe(false)
    expect(result.rows[0].interiorCost).toBe(0)
  })
})

describe('computeWasmPricing — sections', () => {
  const highModules = [slot({ slotIndex: 0, layoutId: 1, hasDoor: true })]
  const lowModules = [slot({ slotIndex: 0, layoutId: 20, hasDoor: true })]

  it('counts high and low modules once each in a dual layout', () => {
    const result = computeWasmPricing(
      input({
        layout: 'low-left',
        modules: highModules,
        lowSection: lowSectionOf(lowModules),
        moduleCount: 1,
      }),
    )
    expect(result.rows.map((r) => r.section)).toEqual(['high', 'low'])
    expect(result.totals.moduleCost).toBe(200 + 150)
  })

  it('charges no door for a lage-kast fronts layout, only its drawer handles', () => {
    const result = computeWasmPricing(
      input({
        layout: 'low-left',
        modules: highModules,
        lowSection: lowSectionOf(lowModules),
        moduleCount: 1,
      }),
    )
    const low = result.rows.find((r) => r.section === 'low')!
    expect(low.hasDoor).toBe(false)
    expect(low.doorCost).toBe(0)
    expect(low.drawerFrontCount).toBe(2)
    expect(low.drawerHandleCost).toBe(20)
  })

  it('counts a low-only cabinet once, though lowSection mirrors the top level', () => {
    const modules = lowModules
    const result = computeWasmPricing(
      input({
        layout: 'low-only',
        modules,
        // The store keeps both in sync in low-only — the same modules twice.
        lowSection: lowSectionOf(modules),
        moduleCount: 1,
      }),
    )
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].section).toBe('low')
    expect(result.totals.moduleCost).toBe(150)
  })

  it('cannot light a low-only cabinet with LED strips', () => {
    const result = computeWasmPricing(
      input({ layout: 'low-only', modules: lowModules, moduleCount: 1, lightStripsEnabled: true }),
    )
    expect(result.totals.ledModuleCount).toBe(0)
    expect(result.totals.ledCost).toBe(0)
  })
})

describe('computeWasmPricing — cabinet-wide lines', () => {
  const modules = [
    slot({ slotIndex: 0, layoutId: 1, hasDoor: true }),
    slot({ slotIndex: 1, layoutId: 1, hasDoor: true, hasPowerHole: true }),
  ]

  it('prices LED strips over the high section modules', () => {
    const result = computeWasmPricing(input({ modules, moduleCount: 2, lightStripsEnabled: true }))
    expect(result.totals.ledCost).toBe(50 + 20 * 2)
  })

  it('counts one stekkerdoos per module that has one', () => {
    const result = computeWasmPricing(input({ modules, moduleCount: 2 }))
    expect(result.totals.powerHoleCount).toBe(1)
    expect(result.totals.powerHoleCost).toBe(25)
  })

  it('charges the 36mm side panels once, 18mm never', () => {
    expect(computeWasmPricing(input({ modules, moduleCount: 2 })).totals.sidePanelCost).toBe(0)
    expect(
      computeWasmPricing(input({ modules, moduleCount: 2, sidePanelThickness: '36mm' })).totals
        .sidePanelCost,
    ).toBe(300)
  })

  it('gives the top cabinet one push-to-open door per module', () => {
    const result = computeWasmPricing(input({ modules, moduleCount: 2, hasTopCabinet: true }))
    expect(result.topCabinet).toEqual({
      doorCount: 2,
      doorVariant: 'small',
      doorCost: 160,
      handleCost: 30,
      subtotal: 190,
    })
    expect(result.totals.doorCost).toBe(240 + 160)
    expect(result.totals.mechanismCost).toBe(20 + 30)
  })

  it('looks the montage tier up without delivery and LED', () => {
    const result = computeWasmPricing(input({ modules, moduleCount: 2, lightStripsEnabled: true }))
    const t = result.totals
    expect(t.installationBasis).toBe(t.subtotal - t.deliveryCost - t.ledCost)
    expect(t.subtotal).toBe(t.cabinetCost + t.deliveryCost)
    expect(t.grandTotal).toBe(t.subtotal + t.installationCost)
  })

  it('waives the montage price when the free-montage action runs', () => {
    const freeData: FullPricingData = {
      ...pricingData,
      config: { ...pricingData.config, freeMontage: true },
    }
    const result = computeWasmPricing(input({ pricingData: freeData, modules, moduleCount: 2 }))
    expect(result.totals.freeMontageApplied).toBe(true)
    expect(result.totals.installationCost).toBe(0)
    expect(result.totals.freeMontageDiscount).toBe(result.totals.installationTier?.price)
    expect(result.totals.grandTotal).toBe(result.totals.subtotal)
  })

  it('holds every line at zero until the pricing data loads', () => {
    const result = computeWasmPricing(input({ pricingData: null, modules, moduleCount: 2 }))
    expect(result.totals.cabinetCost).toBe(0)
    expect(result.totals.deliveryCost).toBe(95)
    expect(result.totals.grandTotal).toBe(95)
  })
})
