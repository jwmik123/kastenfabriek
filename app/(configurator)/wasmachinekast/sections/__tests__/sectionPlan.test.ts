import { describe, it, expect } from 'vitest'
import { planSectionWidths, fillerWidthCm, reconcileSlots } from '../sectionPlan'
import type { BaseModuleSlot } from '../../../_shared/store/types'

const bounds = { minVarWidthCm: 30, maxVarWidthCm: 65 }

function slot(i: number, fixedWidth?: number): BaseModuleSlot {
  return { slotIndex: i, layoutId: fixedWidth ? 11 : null, hasDoor: true, span: 1, hasPowerHole: false, fixedWidth }
}

describe('planSectionWidths', () => {
  it('leaves a filler panel when the rest is too narrow for a module', () => {
    // 150 outer − 3.6 walls − 137.2 machines = 9.2 cm left
    const plan = planSectionWidths({ innerWidthCm: 146.4, fixedWidthsCm: [68.6, 68.6], ...bounds })
    expect(plan.fits).toBe(true)
    expect(plan.minVariable).toBe(0)
    expect(plan.maxVariable).toBe(0)
    expect(plan.fillerWidthCm).toBeCloseTo(9.2, 5)
  })

  it('has no filler once the rest holds a module', () => {
    const plan = planSectionWidths({ innerWidthCm: 176.4, fixedWidthsCm: [68.6, 68.6], ...bounds })
    expect(plan.minVariable).toBe(1)
    expect(plan.maxVariable).toBe(1)
    expect(plan.fillerWidthCm).toBe(0)
  })

  it('reports overflow when the machines do not fit', () => {
    const plan = planSectionWidths({ innerWidthCm: 126.4, fixedWidthsCm: [68.6, 68.6], ...bounds })
    expect(plan.fits).toBe(false)
    expect(plan.fillerWidthCm).toBe(0)
  })

  it('bounds the variable count like before when nothing is fixed', () => {
    const plan = planSectionWidths({ innerWidthCm: 196.4, fixedWidthsCm: [], ...bounds })
    expect(plan.minVariable).toBe(4) // ceil(196.4 / 65)
    expect(plan.maxVariable).toBe(6) // floor(196.4 / 30)
  })

  it('treats an exact fit as no filler', () => {
    const plan = planSectionWidths({ innerWidthCm: 137.2, fixedWidthsCm: [68.6, 68.6], ...bounds })
    expect(plan.fits).toBe(true)
    expect(plan.fillerWidthCm).toBe(0)
  })
})

describe('fillerWidthCm', () => {
  it('is the free width when every slot is fixed', () => {
    expect(fillerWidthCm([slot(0, 68.6), slot(1, 68.6)], 146.4)).toBeCloseTo(9.2, 5)
  })

  it('is zero as soon as a variable slot exists', () => {
    expect(fillerWidthCm([slot(0, 68.6), slot(1)], 146.4)).toBe(0)
  })

  it('never goes negative', () => {
    expect(fillerWidthCm([slot(0, 68.6), slot(1, 68.6)], 126.4)).toBe(0)
  })
})

describe('reconcileSlots', () => {
  it('drops the variable slots when the rest is too narrow, keeping the machines', () => {
    // washer, empty, washer at 150 cm: the empty vak between them goes.
    const result = reconcileSlots({
      modules: [slot(0, 68.6), slot(1), slot(2, 68.6)],
      innerWidthCm: 146.4,
      ...bounds,
    })
    expect(result.modules.map((m) => m.fixedWidth)).toEqual([68.6, 68.6])
    expect(result.modules.map((m) => m.slotIndex)).toEqual([0, 1])
    expect(result.indexMap.get(2)).toBe(1)
    expect(result.indexMap.has(1)).toBe(false)
  })

  it('adds a variable slot when the rest grew wide enough for one', () => {
    const result = reconcileSlots({
      modules: [slot(0, 68.6), slot(1, 68.6)],
      innerWidthCm: 176.4,
      ...bounds,
    })
    expect(result.modules).toHaveLength(3)
    expect(result.modules[2].fixedWidth).toBeUndefined()
    expect(result.modules[2].layoutId).toBeNull()
  })

  it('drops the last machine when the fixed widths overflow', () => {
    const result = reconcileSlots({
      modules: [slot(0, 68.6), slot(1, 68.6)],
      innerWidthCm: 126.4,
      ...bounds,
    })
    expect(result.modules.map((m) => m.fixedWidth)).toEqual([68.6, undefined])
    expect(result.droppedFixed).toEqual([1])
  })

  it('keeps narrow vakken from an older width limit when restoring leniently', () => {
    // Five 23 cm vakken in a 116.4 cm interior: below today's 30 cm, but built.
    const modules = [0, 1, 2, 3, 4].map((i) => slot(i))
    const result = reconcileSlots({ modules, innerWidthCm: 116.4, mode: 'lenient', ...bounds })
    expect(result.modules).toBe(modules)
  })

  it('keeps one vak in a machine-less section too narrow for a module when restoring leniently', () => {
    // A 30 cm cabinet saved with its single vak: the vak stays, empty or not.
    const modules = [slot(0)]
    const result = reconcileSlots({ modules, innerWidthCm: 26.4, mode: 'lenient', ...bounds })
    expect(result.modules).toBe(modules)
  })

  it('still corrects an overflow when restoring leniently', () => {
    const result = reconcileSlots({
      modules: [slot(0, 68.6), slot(1), slot(2, 68.6)],
      innerWidthCm: 146.4,
      mode: 'lenient',
      ...bounds,
    })
    expect(result.modules.map((m) => m.fixedWidth)).toEqual([68.6, 68.6])
  })

  it('leaves a fitting section untouched', () => {
    const modules = [slot(0, 68.6), slot(1), slot(2)]
    const result = reconcileSlots({ modules, innerWidthCm: 176.4, ...bounds })
    expect(result.modules).toBe(modules)
  })
})

import {
  absorbedRestCm,
  canSplitFiller,
  fillerInsetsCm,
  fillerPieces,
  resolveFillerSide,
} from '../sectionPlan'

describe('minimum panel width — a rest too narrow for a panel', () => {
  it('reports a real rest as a panel and nothing absorbed', () => {
    const plan = planSectionWidths({ innerWidthCm: 146.4, fixedWidthsCm: [68.6, 68.6], ...bounds, minFillerCm: 3 })
    expect(plan.fillerWidthCm).toBeCloseTo(9.2, 5)
    expect(plan.absorbedRestCm).toBe(0)
  })

  it('turns a rest below the minimum into absorbed side-panel thickness', () => {
    // 0.8 cm rest: the client's "plint van een paar millimeter"
    const plan = planSectionWidths({ innerWidthCm: 138, fixedWidthsCm: [68.6, 68.6], ...bounds, minFillerCm: 3 })
    expect(plan.fillerWidthCm).toBe(0)
    expect(plan.absorbedRestCm).toBeCloseTo(0.8, 5)
    expect(plan.minVariable).toBe(0)
    expect(plan.maxVariable).toBe(0)
  })

  it('exactly the minimum is still a panel', () => {
    const plan = planSectionWidths({ innerWidthCm: 140.2, fixedWidthsCm: [68.6, 68.6], ...bounds, minFillerCm: 3 })
    expect(plan.fillerWidthCm).toBeCloseTo(3, 5)
    expect(plan.absorbedRestCm).toBe(0)
  })

  it('fillerWidthCm / absorbedRestCm agree with the plan', () => {
    const modules = [slot(0, 68.6), slot(1, 68.6)]
    expect(fillerWidthCm(modules, 138, 3)).toBe(0)
    expect(absorbedRestCm(modules, 138, 3)).toBeCloseTo(0.8, 5)
    expect(fillerWidthCm(modules, 146.4, 3)).toBeCloseTo(9.2, 5)
    expect(absorbedRestCm(modules, 146.4, 3)).toBe(0)
    // A variable slot present: no rest at all.
    expect(absorbedRestCm([slot(0, 68.6), slot(1)], 138, 3)).toBe(0)
  })

  it('keeps every rest a panel when no minimum is given', () => {
    expect(fillerWidthCm([slot(0, 68.6), slot(1, 68.6)], 138)).toBeCloseTo(0.8, 5)
  })
})

describe('beide zijden', () => {
  it('may split only when each half is at least the minimum', () => {
    expect(canSplitFiller(9.2, 3)).toBe(true)
    expect(canSplitFiller(6, 3)).toBe(true)
    expect(canSplitFiller(5, 3)).toBe(false)
  })

  it("'both' falls back to the right side when it no longer splits", () => {
    expect(resolveFillerSide('both', 9.2, 3)).toBe('both')
    expect(resolveFillerSide('both', 5, 3)).toBe('right')
    expect(resolveFillerSide('left', 5, 3)).toBe('left')
  })

  it('resolves into two equal pieces', () => {
    expect(fillerPieces({ side: 'both', widthCm: 9.2 })).toEqual([
      { side: 'left', widthCm: 4.6 },
      { side: 'right', widthCm: 4.6 },
    ])
    expect(fillerPieces({ side: 'left', widthCm: 9.2 })).toEqual([{ side: 'left', widthCm: 9.2 }])
    expect(fillerPieces(null)).toEqual([])
  })

  it('insets combine the pieces and half the absorbed rest per side', () => {
    expect(fillerInsetsCm({ side: 'both', widthCm: 9.2 })).toEqual({ left: 4.6, right: 4.6 })
    expect(fillerInsetsCm({ side: 'right', widthCm: 9.2 })).toEqual({ left: 0, right: 9.2 })
    expect(fillerInsetsCm(null, 0.8)).toEqual({ left: 0.4, right: 0.4 })
  })
})
