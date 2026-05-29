import { describe, it, expect } from 'vitest'
import { defaultLayoutFor } from '../defaultLayoutFor'

describe('defaultLayoutFor', () => {
  const STANDARD_WIDTH = 60
  const STANDARD_HEIGHT = 220 // cm — well above all minSlotHeight thresholds

  describe('determinism', () => {
    it('returns the same layoutId for identical inputs across repeated calls', () => {
      const results = Array.from({ length: 20 }, () =>
        defaultLayoutFor(0, STANDARD_WIDTH, STANDARD_HEIGHT, 3),
      )
      expect(new Set(results).size).toBe(1)
    })
  })

  describe('outer vs middle slot differentiation', () => {
    it('assigns rod-based layout (id 5) to first slot', () => {
      expect(defaultLayoutFor(0, STANDARD_WIDTH, STANDARD_HEIGHT, 3)).toBe(5)
    })

    it('assigns rod-based layout (id 5) to last slot', () => {
      expect(defaultLayoutFor(2, STANDARD_WIDTH, STANDARD_HEIGHT, 3)).toBe(5)
    })

    it('assigns drawer-based layout (id 2) to middle slot', () => {
      expect(defaultLayoutFor(1, STANDARD_WIDTH, STANDARD_HEIGHT, 3)).toBe(2)
    })

    it('treats all slots as outer when totalModules <= 2', () => {
      expect(defaultLayoutFor(0, STANDARD_WIDTH, STANDARD_HEIGHT, 2)).toBe(5)
      expect(defaultLayoutFor(1, STANDARD_WIDTH, STANDARD_HEIGHT, 2)).toBe(5)
    })
  })

  describe('fallback to shelves-only on low height', () => {
    it('falls back to shelves (id 1) when height below all candidate minSlotHeight', () => {
      expect(defaultLayoutFor(0, STANDARD_WIDTH, 30, 3)).toBe(1)
    })

    it('falls back to rod+plank (id 6) when height is 80 cm (below rod 140 threshold)', () => {
      expect(defaultLayoutFor(0, STANDARD_WIDTH, 80, 3)).toBe(6)
    })

    it('falls back to shelves for middle slot when height below drawer threshold (70 cm)', () => {
      expect(defaultLayoutFor(1, STANDARD_WIDTH, 50, 3)).toBe(1)
    })

    it('picks drawers+shelves for middle slot at 75 cm (above 70 cm threshold)', () => {
      expect(defaultLayoutFor(1, STANDARD_WIDTH, 75, 3)).toBe(2)
    })
  })

  describe('first/last slot symmetry', () => {
    it('first and last slot get the same layout for equal effective height', () => {
      for (const total of [3, 4, 5]) {
        const first = defaultLayoutFor(0, STANDARD_WIDTH, STANDARD_HEIGHT, total)
        const last = defaultLayoutFor(total - 1, STANDARD_WIDTH, STANDARD_HEIGHT, total)
        expect(first).toBe(last)
      }
    })
  })
})
