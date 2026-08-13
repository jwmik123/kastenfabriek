import { describe, it, expect } from 'vitest'
import { computeSlotWidthsM, canFitFixedWidth, fitVariableSlotCount } from '../slotWidths'

describe('fitVariableSlotCount', () => {
  const base = { minVarWidthCm: 30, maxVarWidthCm: 65 }

  it('keeps every variable slot when they all stay above the minimum', () => {
    // 250 - 68.6 = 181.4 over 5 slots = 36.3 each
    expect(
      fitVariableSlotCount({ ...base, sectionWidthCm: 250, totalFixedCm: 68.6, currentVariableCount: 5 }),
    ).toBe(5)
  })

  it('drops slots until the rest reach the minimum', () => {
    // 250 - 137.2 = 112.8; 4 slots would be 28.2 each, 3 slots are 37.6
    expect(
      fitVariableSlotCount({ ...base, sectionWidthCm: 250, totalFixedCm: 137.2, currentVariableCount: 4 }),
    ).toBe(3)
  })

  it('returns null when even one slot would exceed the maximum width', () => {
    // 200 - 0 = 200 left for a single slot: 200 > 65
    expect(
      fitVariableSlotCount({ ...base, sectionWidthCm: 200, totalFixedCm: 0, currentVariableCount: 1 }),
    ).toBeNull()
  })

  it('returns null when the fixed widths already overflow the section', () => {
    expect(
      fitVariableSlotCount({ ...base, sectionWidthCm: 100, totalFixedCm: 150, currentVariableCount: 1 }),
    ).toBeNull()
  })

  it('returns 0 when there are no variable slots left to place', () => {
    expect(
      fitVariableSlotCount({ ...base, sectionWidthCm: 150, totalFixedCm: 137.2, currentVariableCount: 0 }),
    ).toBe(0)
  })
})

describe('computeSlotWidthsM', () => {
  it('shares innerW equally among variable slots', () => {
    expect(computeSlotWidthsM([{}, {}, {}], 3)).toEqual([1, 1, 1])
  })

  it('pins fixed slots and flexes the rest', () => {
    // innerW 2m, one fixed 0.686m → remaining 1.314m over 1 var slot
    const [fixed, variable] = computeSlotWidthsM([{ fixedWidth: 68.6 }, {}], 2)
    expect(fixed).toBeCloseTo(0.686, 5)
    expect(variable).toBeCloseTo(1.314, 5)
  })
})

describe('canFitFixedWidth', () => {
  const vars = (n: number) => Array.from({ length: n }, () => ({} as { fixedWidth?: number }))

  it('returns true for non-fixed candidate (no minSlotWidth)', () => {
    expect(canFitFixedWidth(vars(3), 180, 1, undefined)).toBe(true)
  })

  it('allows a 68.6 module when total space fits by shrinking neighbours', () => {
    // 3 slots, 180cm section. Place 68.6 in slot 1 → 111.4cm over 2 vars = 55.7 each ≥ 15
    expect(canFitFixedWidth(vars(3), 180, 1, 68.6)).toBe(true)
  })

  it('rejects when even total section width cannot fit the fixed module', () => {
    // single slot, 50cm section, candidate 68.6 > 50
    expect(canFitFixedWidth(vars(1), 50, 0, 68.6)).toBe(false)
  })

  it('rejects when leftover would push a variable neighbour below the min', () => {
    // 2 slots, 80cm. 68.6 fixed → 11.4cm left for 1 var < 15
    expect(canFitFixedWidth(vars(2), 80, 0, 68.6)).toBe(false)
  })

  it('accounts for existing fixed neighbours', () => {
    // 3 slots, 150cm. slot0 already fixed 68.6, place 68.6 in slot1 →
    // 137.2 fixed, 12.8 left for 1 var < 15 → reject
    const mods = [{ fixedWidth: 68.6 }, {}, {}]
    expect(canFitFixedWidth(mods, 150, 1, 68.6)).toBe(false)
    // wider section leaves room
    expect(canFitFixedWidth(mods, 160, 1, 68.6)).toBe(true)
  })

  it('returns true when all slots become fixed and total fits', () => {
    expect(canFitFixedWidth([{ fixedWidth: 68.6 }, {}], 140, 1, 68.6)).toBe(true)
  })

  it('guards against out-of-range slot or empty/zero-width section', () => {
    expect(canFitFixedWidth(vars(2), 180, 5, 68.6)).toBe(false)
    expect(canFitFixedWidth([], 180, 0, 68.6)).toBe(false)
    expect(canFitFixedWidth(vars(2), 0, 0, 68.6)).toBe(false)
  })
})
