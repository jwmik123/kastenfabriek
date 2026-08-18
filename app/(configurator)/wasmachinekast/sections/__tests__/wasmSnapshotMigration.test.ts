import { describe, it, expect } from 'vitest'
import { restore, serialize } from '../wasmSnapshotMigration'
import type { WasmSectionsSnapshot } from '../types'
import type { ModuleSlotSnapshot } from '@/lib/cart/types'

const mkMod = (i: number, layoutId: number | null = null): ModuleSlotSnapshot => ({
  slotIndex: i,
  layoutId,
  layoutName: null,
  hasDoor: true,
  span: 1,
  hasPowerHole: false,
  pushToOpen: false,
})

describe('wasmSnapshotMigration — restore (legacy)', () => {
  it('legacy snapshot (no layout field) becomes high-only', () => {
    const snap: WasmSectionsSnapshot = {
      widthCm: 160, heightCm: 240, moduleCount: 2,
      modules: [mkMod(0), mkMod(1)],
      depthCm: 65,
    }
    const state = restore(snap)
    expect(state.layout).toBe('high-only')
    expect(state.highSection?.width).toBe(160)
    expect(state.highSection?.height).toBe(240)
    expect(state.highSection?.moduleCount).toBe(2)
    expect(state.lowSection).toBeNull()
    expect(state.washerModules).toEqual([])
  })

  it('legacy snapshot clamps depth from 65 to 85', () => {
    const snap: WasmSectionsSnapshot = {
      widthCm: 160, heightCm: 240, moduleCount: 2,
      modules: [mkMod(0), mkMod(1)],
      depthCm: 65,
    }
    expect(restore(snap).depth).toBe(85)
  })

  it('legacy snapshot preserves depth >= 85', () => {
    const snap: WasmSectionsSnapshot = {
      widthCm: 160, heightCm: 240, moduleCount: 2,
      modules: [mkMod(0), mkMod(1)],
      depthCm: 100,
    }
    expect(restore(snap).depth).toBe(100)
  })

  it('legacy washerModules are carried through', () => {
    const snap: WasmSectionsSnapshot = {
      widthCm: 160, heightCm: 240, moduleCount: 2,
      modules: [mkMod(0), mkMod(1, 11)],
      depthCm: 90,
      washerModules: [{ slotIndex: 1, layoutId: 11, section: 'high' }],
    }
    const state = restore(snap)
    expect(state.washerModules).toEqual([{ slotIndex: 1, layoutId: 11, section: 'high' }])
  })
})

describe('wasmSnapshotMigration — serialize always writes layout', () => {
  it('legacy → restored → serialized always has layout populated', () => {
    const snap: WasmSectionsSnapshot = {
      widthCm: 160, heightCm: 240, moduleCount: 2,
      modules: [mkMod(0), mkMod(1)],
      depthCm: 85,
    }
    const out = serialize(restore(snap))
    expect(out.layout).toBe('high-only')
  })

  it('low-only state serializes with layout populated', () => {
    const snap: WasmSectionsSnapshot = {
      layout: 'low-only',
      widthCm: 0, heightCm: 0, moduleCount: 0, modules: [],
      depthCm: 90,
      lowSection: {
        width: 120, height: 90, moduleCount: 2,
        modules: [mkMod(0), mkMod(1)],
        topPanelThicknessMm: 18,
        countertopMaterialId: 'antraciet',
      },
      washerModules: [],
    }
    const out = serialize(restore(snap))
    expect(out.layout).toBe('low-only')
  })
})

describe('wasmSnapshotMigration — serialize(restore(s)) round-trip on new format', () => {
  it('high-only new-format snapshot round-trips', () => {
    const snap: WasmSectionsSnapshot = {
      layout: 'high-only',
      widthCm: 160, heightCm: 240, moduleCount: 2,
      modules: [mkMod(0), mkMod(1)],
      depthCm: 90,
      washerModules: [],
    }
    expect(serialize(restore(snap))).toEqual(snap)
  })

  it('low-only new-format snapshot round-trips', () => {
    const snap: WasmSectionsSnapshot = {
      layout: 'low-only',
      widthCm: 0, heightCm: 0, moduleCount: 0, modules: [],
      depthCm: 90,
      lowSection: {
        width: 120, height: 90, moduleCount: 2,
        modules: [mkMod(0), mkMod(1)],
        topPanelThicknessMm: 36,
        countertopMaterialId: 'wit',
      },
      washerModules: [],
    }
    expect(serialize(restore(snap))).toEqual(snap)
  })

  it('low-left new-format snapshot round-trips with both sections populated', () => {
    const snap: WasmSectionsSnapshot = {
      layout: 'low-left',
      widthCm: 160, heightCm: 240, moduleCount: 2,
      modules: [mkMod(0), mkMod(1)],
      depthCm: 90,
      lowSection: {
        width: 160, height: 90, moduleCount: 2,
        modules: [mkMod(0), mkMod(1)],
        topPanelThicknessMm: 18,
        countertopMaterialId: 'antraciet',
      },
      washerModules: [],
    }
    expect(serialize(restore(snap))).toEqual(snap)
  })

  it('low-right new-format snapshot round-trips', () => {
    const snap: WasmSectionsSnapshot = {
      layout: 'low-right',
      widthCm: 160, heightCm: 240, moduleCount: 2,
      modules: [mkMod(0), mkMod(1)],
      depthCm: 90,
      lowSection: {
        width: 140, height: 90, moduleCount: 2,
        modules: [mkMod(0), mkMod(1)],
        topPanelThicknessMm: 18,
        countertopMaterialId: 'antraciet',
      },
      washerModules: [],
    }
    expect(serialize(restore(snap))).toEqual(snap)
  })
})
