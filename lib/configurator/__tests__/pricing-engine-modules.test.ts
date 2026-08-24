import { describe, it, expect, vi, afterEach } from 'vitest'
import { PricingEngine } from '../pricing-engine'
import type { FullPricingData, ModuleLayout } from '@/types/configurator-pricing'

function engineWith(modules: ModuleLayout[]): PricingEngine {
  return new PricingEngine({
    config: {},
    modules,
    accessories: [],
    doors: [],
    handles: [],
    materials: [],
    installationTiers: [],
  } as unknown as FullPricingData)
}

const plank: ModuleLayout = {
  layoutId: 20,
  name: 'Lage kast — plank',
  description: '',
  contents: { shelves: 1, rods: 0, drawers: 0 },
  priceSingle: 340,
  priceDouble: 560,
  availableForTopCabinet: false,
}

afterEach(() => {
  vi.restoreAllMocks()
})

// The same layoutId exists once per section, priced apart — matching on the id
// alone would price a low module at the high module's rate.
const plankHigh: ModuleLayout = { ...plank, sectionType: 'high', priceSingle: 900, priceDouble: 1200 }
const plankLow: ModuleLayout = { ...plank, sectionType: 'low', priceSingle: 340, priceDouble: 560 }
const plankBoth: ModuleLayout = { ...plank, sectionType: 'both', priceSingle: 500, priceDouble: 700 }

describe('getModule — duplicate layoutIds', () => {
  it('picks the document for the section asked for, whatever the order', () => {
    expect(engineWith([plankHigh, plankLow]).getModule(20, 'low')?.priceSingle).toBe(340)
    expect(engineWith([plankLow, plankHigh]).getModule(20, 'low')?.priceSingle).toBe(340)
    expect(engineWith([plankLow, plankHigh]).getModule(20, 'high')?.priceSingle).toBe(900)
  })

  it('falls back to the shared document when the section has none', () => {
    expect(engineWith([plankHigh, plankBoth]).getModule(20, 'low')?.priceSingle).toBe(500)
  })

  it('falls back to a document without a section over an unrelated one', () => {
    expect(engineWith([plankHigh, plank]).getModule(20, 'low')?.priceSingle).toBe(340)
  })

  it('keeps the only document there is, section or not', () => {
    expect(engineWith([plankHigh]).getModule(20, 'low')?.priceSingle).toBe(900)
  })
})

describe('getModulePrice', () => {
  it('prices per section when the catalogue holds both', () => {
    const engine = engineWith([plankHigh, plankLow])
    expect(engine.getModulePrice(20, 'single', 'low')).toBe(340)
    expect(engine.getModulePrice(20, 'double', 'high')).toBe(1200)
  })

  it('returns the price for the corpus type', () => {
    const engine = engineWith([plank])
    expect(engine.getModulePrice(20, 'single')).toBe(340)
    expect(engine.getModulePrice(20, 'double')).toBe(560)
  })

  // A layout without a moduleLayout document used to disappear into a try/catch
  // at every call site, which is how an unpriced module ends up free in a quote.
  it('prices an unknown layout at 0 and says so', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const engine = engineWith([plank])
    expect(engine.getModulePrice(9001, 'single')).toBe(0)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('9001'))
  })

  it('warns once per layout, not once per render', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const engine = engineWith([plank])
    engine.getModulePrice(9002, 'single')
    engine.getModulePrice(9002, 'double')
    expect(error).toHaveBeenCalledTimes(1)
  })
})
