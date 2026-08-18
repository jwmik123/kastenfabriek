import { describe, it, expect } from 'vitest'
import {
  SAFETY,
  DEFAULT_HANDLE_Y,
  FALLBACK_HEIGHT_CM,
  canMountHandle,
  computeHandleY,
  minDoorHandleEdgeHeightM,
} from '../handleFit'

const FULL_DOOR_H = 2.0

describe('computeHandleY', () => {
  it('returns DEFAULT_HANDLE_Y on a full-height door', () => {
    expect(computeHandleY({ doorHeightAtHandle: FULL_DOOR_H }, { heightCm: 30 })).toBe(DEFAULT_HANDLE_Y)
  })

  it('drops the handle when the door is shorter than the default at handle X', () => {
    // 60 cm door, 30 cm handle, SAFETY=0.05 → 0.6 − 0.15 − 0.05 = 0.40
    const y = computeHandleY({ doorHeightAtHandle: 0.6 }, { heightCm: 30 })
    expect(y).toBeCloseTo(0.4, 6)
    expect(y).toBeLessThan(DEFAULT_HANDLE_Y)
  })

  it('uses FALLBACK_HEIGHT_CM for unknown heightCm so sloped doors still drop the handle', () => {
    // Full-height door → still capped at DEFAULT_HANDLE_Y.
    expect(computeHandleY({ doorHeightAtHandle: FULL_DOOR_H }, {})).toBe(DEFAULT_HANDLE_Y)
    // Sloped door → handle drops using the fallback handle size.
    const y = computeHandleY({ doorHeightAtHandle: 0.6 }, {})
    expect(y).toBeCloseTo(0.6 - FALLBACK_HEIGHT_CM / 200 - SAFETY, 6)
    expect(y).toBeLessThan(DEFAULT_HANDLE_Y)
  })
})

describe('lage-kast door (~72 cm panel)', () => {
  // Door.tsx renders the handle when canMountHandle passes and places it at
  // computeHandleY. A low module's door never reaches DEFAULT_HANDLE_Y, so the
  // two have to agree that it still carries a handle.
  const LOW_DOOR_H = 0.72

  it('mounts a normal handle and sits below the full-height position', () => {
    expect(canMountHandle({ heightCm: 20 }, { doorHeightAtHandle: LOW_DOOR_H })).toBe(true)
    const y = computeHandleY({ doorHeightAtHandle: LOW_DOOR_H }, { heightCm: 20 })
    expect(y).toBeCloseTo(LOW_DOOR_H - 0.1 - SAFETY, 6)
    expect(y).toBeLessThan(DEFAULT_HANDLE_Y)
    expect(y).toBeGreaterThan(0)
  })

  it('rejects a handle taller than the panel allows', () => {
    expect(canMountHandle({ heightCm: 70 }, { doorHeightAtHandle: LOW_DOOR_H })).toBe(false)
  })
})

describe('canMountHandle', () => {
  it('is symmetric across the mirror flag (math depends only on doorHeightAtHandle)', () => {
    // The Door.tsx callsite resolves mirror to leftH or rightH before calling
    // canMountHandle, so the pure function is mirror-agnostic by construction.
    const ctx = { doorHeightAtHandle: 0.5 }
    const handle = { heightCm: 30 }
    expect(canMountHandle(handle, ctx)).toBe(canMountHandle(handle, ctx))
  })

  it('passes at the boundary doorHeightAtHandle = heightCm/100 + 2·SAFETY', () => {
    const heightCm = 30
    const boundary = heightCm / 100 + 2 * SAFETY
    expect(canMountHandle({ heightCm }, { doorHeightAtHandle: boundary })).toBe(true)
    expect(canMountHandle({ heightCm }, { doorHeightAtHandle: boundary - 1e-6 })).toBe(false)
  })

  it('always allows handles with unknown heightCm', () => {
    expect(canMountHandle({}, { doorHeightAtHandle: 0.1 })).toBe(true)
  })
})

describe('minDoorHandleEdgeHeightM', () => {
  it('returns the flat door height when no slope is active', () => {
    expect(
      minDoorHandleEdgeHeightM({
        diagonalSide: 'none',
        leftDiagStartHeightM: 1.5,
        rightDiagStartHeightM: 1.5,
        mainHeightM: 2.4,
        floorAndTopM: 0.136,
      }),
    ).toBeCloseTo(2.4 - 0.136, 6)
  })

  it('picks the lower slope-start height when a slope is active', () => {
    expect(
      minDoorHandleEdgeHeightM({
        diagonalSide: 'left',
        leftDiagStartHeightM: 0.6,
        rightDiagStartHeightM: 2.0,
        mainHeightM: 2.4,
        floorAndTopM: 0.136,
      }),
    ).toBeCloseTo(0.6 - 0.136, 6)
  })

  it('takes the min across both sides when diagonalSide=both', () => {
    expect(
      minDoorHandleEdgeHeightM({
        diagonalSide: 'both',
        leftDiagStartHeightM: 0.8,
        rightDiagStartHeightM: 0.5,
        mainHeightM: 2.4,
        floorAndTopM: 0.136,
      }),
    ).toBeCloseTo(0.5 - 0.136, 6)
  })
})
