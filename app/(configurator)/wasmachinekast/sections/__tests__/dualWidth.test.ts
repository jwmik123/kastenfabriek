import { describe, it, expect } from 'vitest'
import { inferRestPreference, splitDualWidth } from '../dualWidth'

const WASHER = 68.6
const MIN_VAK = 30
// High part owns two 1.8 cm side panels, the low part one (it shares the seam).
const high = (fixed: number[] = [], variableCount = 0) => ({ wallsCm: 3.6, fixedWidthsCm: fixed, variableCount })
const low = (fixed: number[] = [], variableCount = 0) => ({ wallsCm: 1.8, fixedWidthsCm: fixed, variableCount })
const split = (totalCm: number, h: ReturnType<typeof high>, l: ReturnType<typeof low>, preference: 'high' | 'low') =>
  splitDualWidth({ totalCm, high: h, low: l, minVarWidthCm: MIN_VAK, preference })

describe('splitDualWidth', () => {
  it('fits the low part around its washer and gives the rest to the high part', () => {
    const r = split(250, high([], 2), low([WASHER]), 'high')
    expect(r.lowWidthCm).toBe(70.4) // 1.8 + 68.6
    expect(r.highWidthCm).toBe(179.6)
    expect(r.fits).toBe(true)
  })

  it('gives the rest to the low part when the customer asks for that', () => {
    const r = split(250, high([WASHER]), low([WASHER], 1), 'low')
    expect(r.highWidthCm).toBe(72.2) // 3.6 + 68.6: the tower fits its machine exactly
    expect(r.lowWidthCm).toBe(177.8)
  })

  it('keeps a vak the customer added to the other part at minimum width', () => {
    const r = split(250, high([], 2), low([WASHER], 1), 'high')
    expect(r.lowWidthCm).toBe(100.4) // 1.8 + 68.6 + 30
    expect(r.highWidthCm).toBe(149.6)
  })

  it('always adds up to the total', () => {
    for (const preference of ['high', 'low'] as const) {
      const r = split(263.4, high([WASHER], 1), low([WASHER, WASHER]), preference)
      expect(r.highWidthCm + r.lowWidthCm).toBeCloseTo(263.4, 6)
    }
  })

  it('a part without machines keeps at least one vak', () => {
    const r = split(240, high([], 0), low([], 0), 'high')
    expect(r.lowWidthCm).toBe(31.8)
    expect(r.highWidthCm).toBe(208.2)
  })

  it("does not hold the chosen part's own vakken against the total", () => {
    // Four vakken in the high part: it simply sheds some when the total shrinks.
    const r = split(150, high([], 4), low([WASHER]), 'high')
    expect(r.fits).toBe(true)
    expect(r.highWidthCm).toBe(79.6)
  })

  it('reports an overflow and the narrowest total that fits', () => {
    const r = split(180, high([WASHER]), low([WASHER, WASHER]), 'high')
    expect(r.fits).toBe(false)
    expect(r.minTotalCm).toBe(211.2) // 72.2 + 139
  })
})

describe('inferRestPreference', () => {
  it('reads an old split by where the spare width sits', () => {
    expect(inferRestPreference(180, 70.4, high([], 2), low([WASHER]), MIN_VAK)).toBe('high')
    expect(inferRestPreference(72.2, 170, high([WASHER]), low([], 2), MIN_VAK)).toBe('low')
  })
})
