export const TOUR_STORAGE_KEY = 'kf-tour-seen-v1'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function getStorage(override?: StorageLike): StorageLike | null {
  if (override) return override
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function hasSeenTour(key: string = TOUR_STORAGE_KEY, storage?: StorageLike): boolean {
  const s = getStorage(storage)
  if (!s) return false
  try {
    return s.getItem(key) === '1'
  } catch {
    return false
  }
}

export function markTourSeen(key: string = TOUR_STORAGE_KEY, storage?: StorageLike): void {
  const s = getStorage(storage)
  if (!s) return
  try {
    s.setItem(key, '1')
  } catch {
    // ignore quota / disabled storage
  }
}

export function resetTourSeen(key: string = TOUR_STORAGE_KEY, storage?: StorageLike): void {
  const s = getStorage(storage)
  if (!s) return
  try {
    s.removeItem(key)
  } catch {
    // ignore
  }
}
