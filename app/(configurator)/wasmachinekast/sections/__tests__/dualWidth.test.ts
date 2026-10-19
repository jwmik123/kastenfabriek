import { describe, it, expect } from 'vitest'
import { dualPartMinimumCm, splitDualWidth } from '../dualWidth'

const WASHER = 68.6
const MIN_VAK = 30
// High part owns two 1.8 cm side panels, the low part one (it shares the seam).
const high = (fixed: number[] = [], variableCount = 0) => ({ wallsCm: 3.6, fixedWidthsCm: fixed, variableCount })
const low = (fixed: number[] = [], variableCount = 0) => ({ wallsCm: 1.8, fixedWidthsCm: fixed, variableCount })
const split = (totalCm: number, lowWidthCm: number, h: ReturnType<typeof high>, l: ReturnType<typeof low>) =>
  splitDualWidth({ totalCm, lowWidthCm, high: h, low: l, minVarWidthCm: MIN_VAK })

describe('dualPartMinimumCm', () => {
  it('is the side panels plus the machines', () => {
    expect(dualPartMinimumCm(low([WASHER], 3), MIN_VAK)).toBeCloseTo(1.8 + WASHER, 6)
  })

  it('keeps one vak in a part without machines', () => {
    expect(dualPartMinimumCm(high([], 4), MIN_VAK)).toBeCloseTo(3.6 + MIN_VAK, 6)
  })
})

describe('splitDualWidth', () => {
  it('keeps the chosen lage-kast width and gives the hoge kast the rest', () => {
    const r = split(250, 160, high([], 2), low([WASHER], 1))
    expect(r.lowWidthCm).toBe(160)
    expect(r.highWidthCm).toBe(90)
    expect(r.fits).toBe(true)
  })

  it('does not depend on how many vakken the lage kast has', () => {
    const a = split(250, 160, high([], 2), low([WASHER], 1))
    const b = split(250, 160, high([], 2), low([WASHER], 0))
    expect(b.lowWidthCm).toBe(a.lowWidthCm)
  })

  it('widens the lage kast to what its machines need', () => {
    const r = split(250, 40, high([], 2), low([WASHER]))
    expect(r.lowWidthCm).toBe(70.4) // 1.8 + 68.6
    expect(r.highWidthCm).toBe(179.6)
  })

  it('narrows the lage kast so the hoge kast keeps its machines', () => {
    const r = split(250, 220, high([WASHER]), low([], 1))
    expect(r.highWidthCm).toBe(72.2) // 3.6 + 68.6
    expect(r.lowWidthCm).toBe(177.8)
  })

  it('reports the range the lage-kast width may take', () => {
    const r = split(250, 160, high([WASHER]), low([WASHER]))
    expect(r.minLowCm).toBe(70.4)
    expect(r.maxLowCm).toBe(250 - 72.2)
  })

  it('always adds up to the total', () => {
    for (const lowWidth of [10, 100, 200, 400]) {
      const r = split(263.4, lowWidth, high([WASHER], 1), low([WASHER, WASHER]))
      expect(r.highWidthCm + r.lowWidthCm).toBeCloseTo(263.4, 6)
    }
  })

  it('reports an overflow and the narrowest total that fits', () => {
    const r = split(180, 100, high([WASHER]), low([WASHER, WASHER]))
    expect(r.fits).toBe(false)
    expect(r.minTotalCm).toBe(211.2) // 72.2 + 139
  })
})
