import { describe, it, expect } from 'vitest'
import { resolveRodMeasurements, ROD_GLB } from '../rodMeasurements'
import { getLayoutById, type ModuleLayoutConfig } from '../../../kledingkast/scene/moduleLayouts'

const roofY = 2.0

const layout = (id: number): ModuleLayoutConfig => {
  const l = getLayoutById(id)
  if (!l) throw new Error(`layout ${id} missing`)
  return l
}

describe('resolveRodMeasurements', () => {
  it('returns no rails for a rail-free layout (full shelves, id 1)', () => {
    expect(resolveRodMeasurements(layout(1), roofY)).toEqual([])
    // Drawers + shelves (id 2) — drawer is not a rail.
    expect(resolveRodMeasurements(layout(2), roofY)).toEqual([])
  })

  it('places a bboxTopAt rail (Single Rod 140, id 5) at its anchor and classifies it upper', () => {
    const rods = resolveRodMeasurements(layout(5), roofY)
    expect(rods).toHaveLength(1)
    expect(rods[0].topY).toBeCloseTo(1.472, 6)
    expect(rods[0].half).toBe('upper') // 1.472 > roofY/2 (1.0)
  })

  it('places a fromTop rail (Rod + plank, id 6) below the roof', () => {
    const rods = resolveRodMeasurements(layout(6), roofY)
    expect(rods).toHaveLength(1)
    expect(rods[0].topY).toBeCloseTo(roofY - 0.368, 6) // 1.632
    expect(rods[0].half).toBe('upper')
  })

  it('resolves both rails of a double rail (id 3): upper fromTop + lower midpoint', () => {
    const rods = resolveRodMeasurements(layout(3), roofY)
    expect(rods).toHaveLength(2)

    const upper = rods[0]
    expect(upper.topY).toBeCloseTo(roofY - 0.368, 6) // 1.632
    expect(upper.half).toBe('upper')

    // midpoint rail sits at half the upper rail's top → lower half.
    const lower = rods[1]
    expect(lower.topY).toBeCloseTo((roofY - 0.368) / 2, 6) // 0.816
    expect(lower.half).toBe('lower')
  })

  it('measures only the rail in a drawer + rail layout (id 7)', () => {
    const rods = resolveRodMeasurements(layout(7), roofY)
    expect(rods).toHaveLength(1)
    // Both elements present, but only the ROD_GLB one is returned.
    expect(layout(7).elements[rods[0].elementIndex].glbPath).toBe(ROD_GLB)
    expect(rods[0].topY).toBeCloseTo(roofY - 0.368, 6)
  })

  it('reflects a reduced roofY (rail under a slope) in the rail top', () => {
    const lowRoof = 1.0
    const rods = resolveRodMeasurements(layout(6), lowRoof)
    expect(rods[0].topY).toBeCloseTo(lowRoof - 0.368, 6) // 0.632
    expect(rods[0].half).toBe('upper') // 0.632 > 0.5
  })
})
