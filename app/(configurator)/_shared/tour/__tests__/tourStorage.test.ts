import { describe, it, expect } from 'vitest'
import { hasSeenTour, markTourSeen, resetTourSeen, TOUR_STORAGE_KEY } from '../tourStorage'

function makeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial }
  return {
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v
    },
    removeItem: (k: string) => {
      delete data[k]
    },
    _data: data,
  }
}

function makeThrowingStorage() {
  return {
    getItem: () => {
      throw new Error('blocked')
    },
    setItem: () => {
      throw new Error('blocked')
    },
    removeItem: () => {
      throw new Error('blocked')
    },
  }
}

describe('tourStorage', () => {
  it('returns false on fresh client', () => {
    const s = makeStorage()
    expect(hasSeenTour(TOUR_STORAGE_KEY, s)).toBe(false)
  })

  it('returns true after markTourSeen', () => {
    const s = makeStorage()
    markTourSeen(TOUR_STORAGE_KEY, s)
    expect(hasSeenTour(TOUR_STORAGE_KEY, s)).toBe(true)
  })

  it('version bump invalidates prior consent', () => {
    const s = makeStorage()
    markTourSeen('kf-tour-seen-v1', s)
    expect(hasSeenTour('kf-tour-seen-v1', s)).toBe(true)
    expect(hasSeenTour('kf-tour-seen-v2', s)).toBe(false)
  })

  it('returns false again after resetTourSeen', () => {
    const s = makeStorage()
    markTourSeen(TOUR_STORAGE_KEY, s)
    resetTourSeen(TOUR_STORAGE_KEY, s)
    expect(hasSeenTour(TOUR_STORAGE_KEY, s)).toBe(false)
  })

  it('tolerates throwing storage (returns false, no throw)', () => {
    const s = makeThrowingStorage()
    expect(() => hasSeenTour(TOUR_STORAGE_KEY, s)).not.toThrow()
    expect(hasSeenTour(TOUR_STORAGE_KEY, s)).toBe(false)
    expect(() => markTourSeen(TOUR_STORAGE_KEY, s)).not.toThrow()
    expect(() => resetTourSeen(TOUR_STORAGE_KEY, s)).not.toThrow()
  })

  it('tolerates corrupt value (non-"1" treated as not seen)', () => {
    const s = makeStorage({ [TOUR_STORAGE_KEY]: 'garbage' })
    expect(hasSeenTour(TOUR_STORAGE_KEY, s)).toBe(false)
  })
})
