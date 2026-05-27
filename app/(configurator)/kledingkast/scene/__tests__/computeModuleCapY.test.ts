import { describe, it, expect } from 'vitest'
import { computeModuleCapY, getBackDiagHeightAtZ } from '../diagonalUtils'
import type { DiagParams } from '../diagonalUtils'

function makeParams(overrides: Partial<DiagParams> = {}): DiagParams {
  return {
    diagonalSide: 'none',
    leftDiagStartHeight: 0,
    rightDiagStartHeight: 0,
    leftDiagTopWidth: 0,
    rightDiagTopWidth: 0,
    outerWidth: 2.0,
    mainHeight: 2.4,
    closetHeight: 2.4,
    backDiagonal: false,
    backDiagKinkHeight: 2.0,
    backDiagFlatSectionDepth: 0,
    outerDepth: 0.6,
    moduleCapY: 2.4,
    sideWallThickness: 0.018,
    ...overrides,
  }
}

describe('computeModuleCapY', () => {
  it('returns mainHeight when back-diagonal is off', () => {
    const p = makeParams({ backDiagonal: false, mainHeight: 2.4 })
    expect(computeModuleCapY(p, false)).toBe(2.4)
  })

  it('returns fillerBottomY when back-diag on and flatSec = 0 (no TC)', () => {
    const p = makeParams({
      backDiagonal: true,
      backDiagKinkHeight: 2.0,
      backDiagFlatSectionDepth: 0,
      outerDepth: 0.6,
      closetHeight: 2.4,
      mainHeight: 2.4,
    })
    const expected = getBackDiagHeightAtZ(0.6 - 0.15, p)
    expect(computeModuleCapY(p, false)).toBeCloseTo(expected, 6)
    expect(computeModuleCapY(p, false)).toBeLessThan(p.mainHeight)
  })

  it('returns fillerBottomY when flatSec just below 10cm (no TC)', () => {
    const p = makeParams({
      backDiagonal: true,
      backDiagKinkHeight: 2.0,
      backDiagFlatSectionDepth: 0.09,
      outerDepth: 0.6,
      closetHeight: 2.4,
      mainHeight: 2.4,
    })
    const expected = getBackDiagHeightAtZ(0.6 - 0.15, p)
    expect(computeModuleCapY(p, false)).toBeCloseTo(expected, 6)
  })

  it('returns mainHeight when flatSec exactly at 10cm', () => {
    const p = makeParams({
      backDiagonal: true,
      backDiagFlatSectionDepth: 0.10,
      mainHeight: 2.4,
    })
    expect(computeModuleCapY(p, false)).toBe(2.4)
  })

  it('returns mainHeight when flatSec above 10cm', () => {
    const p = makeParams({
      backDiagonal: true,
      backDiagFlatSectionDepth: 0.15,
      mainHeight: 2.4,
    })
    expect(computeModuleCapY(p, false)).toBe(2.4)
  })

  it('returns mainHeight when needsTop=true even with back-diag and small flatSec', () => {
    const p = makeParams({
      backDiagonal: true,
      backDiagFlatSectionDepth: 0,
      mainHeight: 2.25,
      closetHeight: 2.7,
      backDiagKinkHeight: 2.3,
      outerDepth: 0.6,
    })
    expect(computeModuleCapY(p, true)).toBe(2.25)
  })
})
