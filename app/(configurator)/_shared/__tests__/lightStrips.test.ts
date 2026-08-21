import { describe, it, expect } from 'vitest'
import { computeStripInstances } from '../three/LightStrips'
import type { DiagParams } from '../../kledingkast/scene/diagonalUtils'
import type { BaseModuleSlot } from '../store/types'

const MODULE_FLOOR_Y = 0.118
const WALL = 0.018

const flatParams = (overrides: Partial<DiagParams> = {}): DiagParams => ({
  diagonalSide: 'none',
  leftDiagStartHeight: 0,
  rightDiagStartHeight: 0,
  leftDiagTopWidth: 0,
  rightDiagTopWidth: 0,
  outerWidth: 1.2,
  mainHeight: 2.25,
  closetHeight: 2.25,
  backDiagonal: false,
  backDiagKinkHeight: 0,
  backDiagFlatSectionDepth: 0,
  outerDepth: 0.6,
  moduleCapY: 2.25,
  sideWallThickness: 0.018,
  ...overrides,
})

const slot = (i: number, extra: Partial<BaseModuleSlot> = {}): BaseModuleSlot => ({
  slotIndex: i,
  layoutId: 1,
  hasDoor: true,
  span: 1,
  ...extra,
})

describe('computeStripInstances', () => {
  it('puts a strip on both walls of every module', () => {
    const strips = computeStripInstances({
      modules: [slot(0), slot(1)],
      widthM: 1.2,
      depthM: 0.6,
      diagParams: flatParams(),
    })
    expect(strips).toHaveLength(4)
  })

  it('hangs the strips inside the walls at full interior height', () => {
    const strips = computeStripInstances({
      modules: [slot(0), slot(1)],
      widthM: 1.2,
      depthM: 0.6,
      diagParams: flatParams(),
    })
    const interiorH = 2.25 - MODULE_FLOOR_Y - WALL
    // 1 cm margin at top and bottom.
    expect(strips[0].height).toBeCloseTo(interiorH - 0.02, 5)
    // Left wall of the first module: inner face of the side panel, plus the
    // module's own wall and the 1 mm offset that keeps it off the surface.
    expect(strips[0].position[0]).toBeCloseTo(-1.2 / 2 + 0.018 + 0.018 + 0.001, 5)
    expect(strips[0].position[1]).toBeCloseTo(MODULE_FLOOR_Y + 0.01 + (interiorH - 0.02) / 2, 5)
  })

  it('sits 10 cm behind the front edge', () => {
    const [strip] = computeStripInstances({
      modules: [slot(0)],
      widthM: 1.2,
      depthM: 0.6,
      diagParams: flatParams(),
    })
    const moduleDepth = 0.6 - WALL - 0.025
    expect(strip.position[2]).toBeCloseTo(WALL + moduleDepth - 0.10, 5)
  })

  it('follows a fixed-width slot instead of an even grid', () => {
    const strips = computeStripInstances({
      modules: [slot(0, { fixedWidth: 68.6 }), slot(1)],
      widthM: 1.3,
      depthM: 0.6,
      diagParams: flatParams({ outerWidth: 1.3 }),
    })
    // Second module starts where the fixed 68.6 cm slot ends.
    expect(strips[2].position[0]).toBeCloseTo(-1.3 / 2 + 0.018 + 0.686 + 0.018 + 0.001, 5)
  })

  it('gives a double module one pair across both slots', () => {
    const strips = computeStripInstances({
      modules: [slot(0, { span: 2 }), slot(1)],
      widthM: 1.2,
      depthM: 0.6,
      diagParams: flatParams(),
    })
    expect(strips).toHaveLength(2)
    const innerW = 1.2 - 0.018 * 2
    expect(strips[1].position[0]).toBeCloseTo(-1.2 / 2 + 0.018 + innerW - 0.018 - 0.001, 5)
  })

  it('drops the shared side wall from the interior', () => {
    const shared = computeStripInstances({
      modules: [slot(0)],
      widthM: 1.2,
      depthM: 0.6,
      diagParams: flatParams(),
      sharedSideWall: 'left',
    })
    expect(shared[0].position[0]).toBeCloseTo(-1.2 / 2 + 0.018 + 0.001, 5)
  })

  it('shortens the strips under a diagonal', () => {
    const strips = computeStripInstances({
      modules: [slot(0)],
      widthM: 1.2,
      depthM: 0.6,
      diagParams: flatParams({
        diagonalSide: 'left',
        leftDiagStartHeight: 1.0,
        leftDiagTopWidth: 1.164,
      }),
    })
    // Left wall sits at the low end of the slope, right wall higher up.
    expect(strips[0].height).toBeLessThan(strips[1].height)
    expect(strips[0].height).toBeCloseTo(1.0 - MODULE_FLOOR_Y - WALL - 0.02, 5)
  })

  it('returns nothing without modules', () => {
    expect(
      computeStripInstances({
        modules: [],
        widthM: 1.2,
        depthM: 0.6,
        diagParams: flatParams(),
      }),
    ).toEqual([])
  })
})
