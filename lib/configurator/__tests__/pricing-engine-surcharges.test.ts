import { describe, it, expect } from 'vitest'
import { PricingEngine } from '../pricing-engine'
import type { FullPricingData } from '@/types/configurator-pricing'

function makeEngine(overrides: Partial<FullPricingData['config']> = {}) {
  const data = {
    config: {
      currency: 'EUR',
      lastUpdated: '2026-01-01',
      led: { basePrice: 0, pricePerModule: 0 },
      deliveryPrice: 0,
      constraints: {
        singleCorpus: { minWidth: 0, maxWidth: 0, minHeight: 0, maxHeight: 0, minDepth: 0, maxDepth: 0 },
        doubleCorpus: { minWidth: 0, maxWidth: 0, minHeight: 0, maxHeight: 0, minDepth: 0, maxDepth: 0 },
        topCabinet: { maxHeight: 0 },
      },
      slopedBackWallSurcharge: 1100,
      slopedSideWallSurchargePerSide: 1100,
      ...overrides,
    },
    modules: [],
    accessories: [],
    doors: [],
    installation: [],
    handles: [],
  } as unknown as FullPricingData
  return new PricingEngine(data)
}

describe('PricingEngine.calculateSurchargesFromSnapshot', () => {
  const engine = makeEngine()

  it('diagonalSide none → 0', () => {
    expect(engine.calculateSurchargesFromSnapshot({ diagonalSide: 'none' }).total).toBe(0)
  })

  it('diagonalSide left → 1100', () => {
    const r = engine.calculateSurchargesFromSnapshot({ diagonalSide: 'left' })
    expect(r.slopedSideWallSurcharge).toBe(1100)
    expect(r.total).toBe(1100)
  })

  it('diagonalSide right → 1100', () => {
    expect(engine.calculateSurchargesFromSnapshot({ diagonalSide: 'right' }).total).toBe(1100)
  })

  it('diagonalSide both → 2200 (per side × 2)', () => {
    const r = engine.calculateSurchargesFromSnapshot({ diagonalSide: 'both' })
    expect(r.slopedSideWallSurcharge).toBe(2200)
    expect(r.total).toBe(2200)
  })

  it('backDiagonal only → 1100', () => {
    const r = engine.calculateSurchargesFromSnapshot({ backDiagonal: true, diagonalSide: 'none' })
    expect(r.slopedBackWallSurcharge).toBe(1100)
    expect(r.slopedSideWallSurcharge).toBe(0)
    expect(r.total).toBe(1100)
  })

  it('backDiagonal + both → 3300', () => {
    const r = engine.calculateSurchargesFromSnapshot({ backDiagonal: true, diagonalSide: 'both' })
    expect(r.slopedBackWallSurcharge).toBe(1100)
    expect(r.slopedSideWallSurcharge).toBe(2200)
    expect(r.total).toBe(3300)
  })

  it('backDiagonal + left → 2200', () => {
    const r = engine.calculateSurchargesFromSnapshot({ backDiagonal: true, diagonalSide: 'left' })
    expect(r.total).toBe(2200)
  })

  it('falls back to defaults when config missing values', () => {
    const e = makeEngine({ slopedBackWallSurcharge: undefined, slopedSideWallSurchargePerSide: undefined })
    expect(e.slopedBackWallSurcharge).toBe(1100)
    expect(e.slopedSideWallSurchargePerSide).toBe(1100)
    expect(e.calculateSurchargesFromSnapshot({ backDiagonal: true, diagonalSide: 'both' }).total).toBe(3300)
  })

  it('honours custom config values', () => {
    const e = makeEngine({ slopedBackWallSurcharge: 500, slopedSideWallSurchargePerSide: 250 })
    const r = e.calculateSurchargesFromSnapshot({ backDiagonal: true, diagonalSide: 'both' })
    expect(r.slopedBackWallSurcharge).toBe(500)
    expect(r.slopedSideWallSurcharge).toBe(500)
    expect(r.total).toBe(1000)
  })
})
