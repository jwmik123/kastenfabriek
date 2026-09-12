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
