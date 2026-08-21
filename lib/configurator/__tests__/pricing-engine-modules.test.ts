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

describe('getModulePrice', () => {
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
