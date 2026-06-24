import { describe, it, expect } from 'vitest'
import { diagonalSegments } from '../diagonalSegments'
import type { DiagParams } from '../../../kledingkast/scene/diagonalUtils'

const base: DiagParams = {
  diagonalSide: 'none',
  leftDiagStartHeight: 1.8,
  rightDiagStartHeight: 1.8,
  leftDiagTopWidth: 0.5,
  rightDiagTopWidth: 0.5,
  outerWidth: 2.0,
  mainHeight: 2.25,
  closetHeight: 2.4,
  backDiagonal: false,
  backDiagKinkHeight: 1.8,
  backDiagFlatSectionDepth: 0.1,
  outerDepth: 0.6,
  moduleCapY: 2.25,
  sideWallThickness: 0.018,
}

const byId = (specs: ReturnType<typeof diagonalSegments>, id: string) =>
  specs.find((s) => s.id === id)

describe('diagonalSegments', () => {
  it('returns nothing when no slope is configured', () => {
    expect(diagonalSegments(base, 0.62)).toEqual([])
  })

  it('builds left-slope edge, start height and top width', () => {
    const specs = diagonalSegments({ ...base, diagonalSide: 'left' }, 0.62)

    const slope = byId(specs, 'diag-left-slope')!
    expect(slope.p1).toEqual({ x: -1.0 + 0.018, y: 1.8, z: 0.62 })
    expect(slope.p2.x).toBeCloseTo(-1.0 + 0.018 + 0.5, 6)
    expect(slope.p2.y).toBe(2.25)
    expect(slope.label).toBe(Math.round(Math.hypot(0.5, 0.45) * 100)) // 67

    expect(byId(specs, 'diag-left-start')!.label).toBe(180)
    expect(byId(specs, 'diag-left-width')!.label).toBe(50)
  })

  it('mirrors the right slope onto the right edge', () => {
    const specs = diagonalSegments({ ...base, diagonalSide: 'right' }, 0.62)
    const slope = byId(specs, 'diag-right-slope')!
    expect(slope.p1.x).toBeCloseTo(1.0 - 0.018, 6)
    expect(slope.p2.x).toBeCloseTo(1.0 - 0.018 - 0.5, 6)
    expect(slope.p2.y).toBe(2.25)
  })

  it('emits both slopes for diagonalSide both', () => {
    const specs = diagonalSegments({ ...base, diagonalSide: 'both' }, 0.62)
    expect(byId(specs, 'diag-left-slope')).toBeDefined()
    expect(byId(specs, 'diag-right-slope')).toBeDefined()
    expect(specs).toHaveLength(6)
  })

  it('builds a back-slope edge in the Z–Y plane', () => {
    const specs = diagonalSegments({ ...base, backDiagonal: true }, 0.62)
    const back = byId(specs, 'diag-back-slope')!
    const flatStartZ = base.outerDepth - base.backDiagFlatSectionDepth // 0.5
    expect(back.p1).toEqual({ x: -1.0, y: 1.8, z: 0 })
    expect(back.p2).toEqual({ x: -1.0, y: 2.4, z: flatStartZ })
    expect(back.label).toBe(Math.round(Math.hypot(flatStartZ, 2.4 - 1.8) * 100))
  })
})
