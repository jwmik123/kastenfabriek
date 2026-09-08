import { describe, it, expect } from 'vitest'
import {
  DEFAULT_FLOOR_ID,
  FLOORS,
  FLOOR_IDS,
  getFloor,
  herringboneCell,
  planksCell,
  rowHash,
  worldToHerringbone,
} from '../floors'

describe('floor registry', () => {
  it('has unique ids and a valid default', () => {
    expect(new Set(FLOOR_IDS).size).toBe(FLOORS.length)
    expect(FLOOR_IDS).toContain(DEFAULT_FLOOR_ID)
  })

  it('default floor keeps the original white finish', () => {
    const floor = getFloor(DEFAULT_FLOOR_ID)
    expect(floor.kind).toBe('solid')
    expect(floor.color).toBe('#ffffff')
  })

  it('falls back to the default for unknown ids', () => {
    expect(getFloor('bestaat-niet').id).toBe(DEFAULT_FLOOR_ID)
  })

  it('every wood finish carries a palette and plank dimensions', () => {
    for (const f of FLOORS) {
      if (f.kind === 'solid') continue
      expect(f.palette, f.id).toBeDefined()
      expect(f.plankWidth, f.id).toBeGreaterThan(0)
      expect(f.plankRatio, f.id).toBeGreaterThan(1)
    }
  })

  it('offers the finishes the user asked for', () => {
    expect(FLOOR_IDS).toContain('lichthout-visgraat')
    expect(FLOORS.filter((f) => f.kind === 'solid').length).toBeGreaterThanOrEqual(4)
  })
})

describe('herringboneCell', () => {
  const n = 2 // 1×2 dominoes — small enough to reason about by hand

  it('groups cells into 1×n planks (horizontal)', () => {
    // Cells (0,0) and (1,0) share the horizontal plank at origin (0,0).
    const a = herringboneCell(0.5, 0.5, n)
    const b = herringboneCell(1.5, 0.5, n)
    expect(a.horizontal).toBe(true)
    expect(b.horizontal).toBe(true)
    expect([a.originX, a.originY]).toEqual([0, 0])
    expect([b.originX, b.originY]).toEqual([0, 0])
    expect(a.along).toBeCloseTo(0.25)
    expect(b.along).toBeCloseTo(0.75)
  })

  it('groups cells into 1×n planks (vertical)', () => {
    // Cells (3,0) and (3,1) share the vertical plank at origin (3,0).
    const a = herringboneCell(3.5, 0.5, n)
    const b = herringboneCell(3.5, 1.5, n)
    expect(a.horizontal).toBe(false)
    expect(b.horizontal).toBe(false)
    expect([a.originX, a.originY]).toEqual([3, 0])
    expect([b.originX, b.originY]).toEqual([3, 0])
    expect(a.along).toBeCloseTo(0.25)
    expect(b.along).toBeCloseTo(0.75)
  })

  it('tiles the plane: every cell belongs to exactly one plank of n cells', () => {
    const N = 5
    const counts = new Map<string, number>()
    for (let x = -12; x < 12; x++) {
      for (let y = -12; y < 12; y++) {
        const c = herringboneCell(x + 0.5, y + 0.5, N)
        const key = `${c.horizontal ? 'h' : 'v'}:${c.originX},${c.originY}`
        counts.set(key, (counts.get(key) ?? 0) + 1)
        expect(c.along).toBeGreaterThanOrEqual(0)
        expect(c.along).toBeLessThan(1)
        expect(c.across).toBeGreaterThanOrEqual(0)
        expect(c.across).toBeLessThan(1)
        // The origin cell of a plank must itself classify to the same plank.
        const o = herringboneCell(c.originX + 0.5, c.originY + 0.5, N)
        expect([o.horizontal, o.originX, o.originY]).toEqual([c.horizontal, c.originX, c.originY])
      }
    }
    // Planks fully inside the sampled window have all n cells present.
    for (const [key, count] of counts) {
      const [, xy] = key.split(':')
      const [ox, oy] = xy.split(',').map(Number)
      const horizontal = key.startsWith('h')
      const inside = horizontal
        ? ox >= -12 && ox + N <= 12 && oy >= -12 && oy < 12
        : oy >= -12 && oy + N <= 12 && ox >= -12 && ox < 12
      if (inside) expect(count).toBe(N)
    }
  })

  it('handles negative coordinates without a seam at the origin', () => {
    const a = herringboneCell(-0.5, -0.5, n)
    expect(a.along).toBeGreaterThanOrEqual(0)
    expect(a.across).toBeGreaterThanOrEqual(0)
  })
})

describe('worldToHerringbone', () => {
  it('rotates by 45° and scales by plank width', () => {
    const [qx, qy] = worldToHerringbone(0.12, 0, 0.12)
    expect(qx).toBeCloseTo(Math.SQRT1_2)
    expect(qy).toBeCloseTo(Math.SQRT1_2)
  })
})

describe('planksCell', () => {
  const w = 0.2
  const ratio = 10

  it('keeps along/across in [0,1) and rows stable across x', () => {
    for (let x = -5; x < 5; x += 0.37) {
      for (let z = -3; z < 8; z += 0.23) {
        const c = planksCell(x, z, w, ratio)
        expect(c.along).toBeGreaterThanOrEqual(0)
        expect(c.along).toBeLessThan(1)
        expect(c.across).toBeGreaterThanOrEqual(0)
        expect(c.across).toBeLessThan(1)
        expect(c.originY).toBe(Math.floor(z / w))
      }
    }
  })

  it('advances one plank per plank length along x', () => {
    const a = planksCell(0, 0.1, w, ratio)
    const b = planksCell(w * ratio, 0.1, w, ratio)
    expect(b.originX).toBe(a.originX + 1)
    expect(b.along).toBeCloseTo(a.along)
  })

  it('staggers seams between neighbouring rows', () => {
    const offsets = new Set([0, 1, 2, 3].map((row) => Math.round(rowHash(row) * 1000)))
    expect(offsets.size).toBeGreaterThan(1)
    for (const v of offsets) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1000)
    }
  })
})
