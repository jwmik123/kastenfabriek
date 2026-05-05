import { describe, it, expect } from 'vitest'
import { computeTriplanarSelection } from '../../_shared/materials/triplanar'

describe('computeTriplanarSelection', () => {
  describe('axis-aligned normals select the correct projection', () => {
    it('+X normal: weights collapse onto the X projection', () => {
      const r = computeTriplanarSelection(
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        0.6,
        1.8,
      )
      expect(r.weights.x).toBe(1)
      expect(r.weights.y).toBe(0)
      expect(r.weights.z).toBe(0)
    })

    it('-X normal: weights collapse onto the X projection (sign-independent)', () => {
      const r = computeTriplanarSelection(
        { x: 0, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
        0.6,
        1.8,
      )
      expect(r.weights.x).toBe(1)
      expect(r.weights.y).toBe(0)
      expect(r.weights.z).toBe(0)
    })

    it('+Y normal: weights collapse onto the Y projection', () => {
      const r = computeTriplanarSelection(
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        0.6,
        1.8,
      )
      expect(r.weights.x).toBe(0)
      expect(r.weights.y).toBe(1)
      expect(r.weights.z).toBe(0)
    })

    it('+Z normal: weights collapse onto the Z projection', () => {
      const r = computeTriplanarSelection(
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        0.6,
        1.8,
      )
      expect(r.weights.x).toBe(0)
      expect(r.weights.y).toBe(0)
      expect(r.weights.z).toBe(1)
    })
  })

  describe('near-45° normals blend (no single dominant projection)', () => {
    it('45° between X and Z splits weights evenly', () => {
      const s = 1 / Math.sqrt(2)
      const r = computeTriplanarSelection(
        { x: 0, y: 0, z: 0 },
        { x: s, y: 0, z: s },
        0.6,
        1.8,
      )
      expect(r.weights.x).toBeCloseTo(0.5, 6)
      expect(r.weights.z).toBeCloseTo(0.5, 6)
      expect(r.weights.y).toBe(0)
      expect(r.weights.x).toBeLessThan(0.99)
      expect(r.weights.z).toBeLessThan(0.99)
    })

    it('arbitrary tilted normal: weights sum to 1 and none dominates', () => {
      const r = computeTriplanarSelection(
        { x: 0, y: 0, z: 0 },
        { x: 0.6, y: 0.6, z: 0.6 },
        0.6,
        1.8,
      )
      const sum = r.weights.x + r.weights.y + r.weights.z
      expect(sum).toBeCloseTo(1, 6)
      expect(r.weights.x).toBeLessThan(0.99)
      expect(r.weights.y).toBeLessThan(0.99)
      expect(r.weights.z).toBeLessThan(0.99)
    })
  })

  describe('emitted UV equals position / tile per axis', () => {
    it('unit tiles: UVs match the position components per projection', () => {
      const r = computeTriplanarSelection(
        { x: 2, y: 3, z: 5 },
        { x: 1, y: 0, z: 0 },
        1,
        1,
      )
      // X-facing → (p.z, p.y)
      expect(r.uvX).toEqual({ u: 5, v: 3 })
      // Z-facing → (p.x, p.y)
      expect(r.uvZ).toEqual({ u: 2, v: 3 })
      // Y-facing → (p.x, p.z)
      expect(r.uvY).toEqual({ u: 2, v: 5 })
    })

    it('non-unit tiles: UVs scale by 1/tile per axis', () => {
      const r = computeTriplanarSelection(
        { x: 8, y: 4, z: 6 },
        { x: 0, y: 1, z: 0 },
        2, // tileU
        4, // tileV
      )
      expect(r.uvX).toEqual({ u: 6 / 2, v: 4 / 4 })
      expect(r.uvZ).toEqual({ u: 8 / 2, v: 4 / 4 })
      expect(r.uvY).toEqual({ u: 8 / 2, v: 6 / 4 })
    })
  })

  it('zero normal: returns zero weights without dividing by zero', () => {
    const r = computeTriplanarSelection(
      { x: 1, y: 1, z: 1 },
      { x: 0, y: 0, z: 0 },
      0.6,
      1.8,
    )
    expect(r.weights).toEqual({ x: 0, y: 0, z: 0 })
  })
})
