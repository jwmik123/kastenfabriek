import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getDraftConfig, saveDraftConfig, clearDraftConfig } from '../draft-config'
import type { ClosetConfigSnapshot } from '../types'

const makeSnapshot = (id: string): ClosetConfigSnapshot => ({
  id,
  capturedAt: '2026-01-01T00:00:00.000Z',
  widthCm: 120,
  heightCm: 240,
  depthCm: 65,
  moduleCount: 2,
  modules: [],
  buitenkantMaterialId: '1',
  binnenkantMaterialId: '2',
  doorHandleId: 'none',
  doorHandleName: null,
  diagonalSide: 'none',
  leftDiagStartHeight: 0,
  rightDiagStartHeight: 0,
  leftDiagTopWidth: 0,
  rightDiagTopWidth: 0,
  placementType: 'ingebouwd',
  backDiagonal: false,
  backDiagKinkHeight: 0,
  backDiagFlatSectionDepth: 0,
  doorHandleMaterial: 'chrome',
  doorsExtendToFloor: false,
  lightStripsEnabled: false,
  hasTopCabinet: false,
  topCabinetHeightCm: 0,
})

describe('draft-config', () => {
  let store: Record<string, string>

  beforeEach(() => {
    store = {}
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v },
      removeItem: (k: string) => { delete store[k] },
    })
  })

  it('saves and restores kledingkast draft under product-specific key', () => {
    const snap = makeSnapshot('kledingkast-001')
    saveDraftConfig(snap, 'kledingkast')
    const result = getDraftConfig('kledingkast')
    expect(result?.id).toBe('kledingkast-001')
  })

  it('saves and restores wasmachinekast draft under product-specific key', () => {
    const snap = makeSnapshot('wasm-001')
    saveDraftConfig(snap, 'wasmachinekast')
    const result = getDraftConfig('wasmachinekast')
    expect(result?.id).toBe('wasm-001')
  })

  it('kledingkast and wasmachinekast drafts do not cross-contaminate', () => {
    saveDraftConfig(makeSnapshot('kledingkast-001'), 'kledingkast')
    saveDraftConfig(makeSnapshot('wasm-001'), 'wasmachinekast')

    expect(getDraftConfig('kledingkast')?.id).toBe('kledingkast-001')
    expect(getDraftConfig('wasmachinekast')?.id).toBe('wasm-001')
  })

  it('clearDraftConfig removes only the specified product draft', () => {
    saveDraftConfig(makeSnapshot('kledingkast-001'), 'kledingkast')
    saveDraftConfig(makeSnapshot('wasm-001'), 'wasmachinekast')

    clearDraftConfig('kledingkast')

    expect(getDraftConfig('kledingkast')).toBeNull()
    expect(getDraftConfig('wasmachinekast')?.id).toBe('wasm-001')
  })

  it('returns null when no draft saved for the product', () => {
    expect(getDraftConfig('kledingkast')).toBeNull()
  })
})
