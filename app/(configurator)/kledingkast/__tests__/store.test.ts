import { describe, it, expect, beforeEach } from 'vitest'
import { useClosetStore } from '../store'
import type { ClosetConfigSnapshot } from '@/lib/cart/types'

function resetStore() {
  useClosetStore.setState(useClosetStore.getInitialState())
}

describe('setModuleCount — hasPowerHole', () => {
  beforeEach(resetStore)

  it('initializes new slots with hasPowerHole: false when count increases', () => {
    useClosetStore.getState().setModuleCount(5)
    const modules = useClosetStore.getState().modules
    expect(modules).toHaveLength(5)
    modules.slice(3).forEach((m) => {
      expect(m.hasPowerHole).toBe(false)
    })
  })

  it('preserves hasPowerHole on surviving slots when count decreases', () => {
    // width=60 → min=1, max=4, so count=1 is within bounds
    useClosetStore.setState({
      width: 60,
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1, hasPowerHole: true },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false },
        { slotIndex: 2, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false },
      ],
      moduleCount: 3,
    })
    useClosetStore.getState().setModuleCount(1)
    const modules = useClosetStore.getState().modules
    expect(modules).toHaveLength(1)
    expect(modules[0].hasPowerHole).toBe(true)
  })
})

describe('restoreConfig — hasPowerHole', () => {
  beforeEach(resetStore)

  const baseSnapshot: ClosetConfigSnapshot = {
    id: 'test-id',
    capturedAt: '2026-01-01T00:00:00.000Z',
    widthCm: 180,
    heightCm: 240,
    depthCm: 60,
    moduleCount: 2,
    modules: [
      { slotIndex: 0, layoutId: null, layoutName: null, hasDoor: true, span: 1 },
      { slotIndex: 1, layoutId: null, layoutName: null, hasDoor: true, span: 1 },
    ],
    buitenkantMaterialId: 'premium-wit',
    binnenkantMaterialId: 'premium-wit',
    doorHandleId: '23',
    diagonalSide: 'none',
    leftDiagStartHeight: 180,
    rightDiagStartHeight: 180,
    leftDiagTopWidth: 50,
    rightDiagTopWidth: 50,
    lightStripsEnabled: false,
    hasTopCabinet: false,
    topCabinetHeightCm: 0,
  }

  it('defaults hasPowerHole to false for old snapshots missing the field', () => {
    useClosetStore.getState().restoreConfig(baseSnapshot)
    const modules = useClosetStore.getState().modules
    modules.forEach((m) => {
      expect(m.hasPowerHole).toBe(false)
    })
  })

  it('restores per-slot hasPowerHole from new snapshots', () => {
    const newSnapshot: ClosetConfigSnapshot = {
      ...baseSnapshot,
      modules: [
        { slotIndex: 0, layoutId: null, layoutName: null, hasDoor: true, span: 1, hasPowerHole: true },
        { slotIndex: 1, layoutId: null, layoutName: null, hasDoor: true, span: 1, hasPowerHole: false },
      ],
    }
    useClosetStore.getState().restoreConfig(newSnapshot)
    const modules = useClosetStore.getState().modules
    expect(modules[0].hasPowerHole).toBe(true)
    expect(modules[1].hasPowerHole).toBe(false)
  })

  it('restores doorHandleMaterial from snapshot', () => {
    const snapshot: ClosetConfigSnapshot = { ...baseSnapshot, doorHandleMaterial: 'gold' }
    useClosetStore.getState().restoreConfig(snapshot)
    expect(useClosetStore.getState().doorHandleMaterial).toBe('gold')
  })

  it('defaults doorHandleMaterial to chrome for old snapshots', () => {
    useClosetStore.getState().restoreConfig(baseSnapshot)
    expect(useClosetStore.getState().doorHandleMaterial).toBe('chrome')
  })

  it('restores doorsExtendToFloor from snapshot', () => {
    const snapshot: ClosetConfigSnapshot = { ...baseSnapshot, doorsExtendToFloor: true }
    useClosetStore.getState().restoreConfig(snapshot)
    expect(useClosetStore.getState().doorsExtendToFloor).toBe(true)
  })

  it('defaults doorsExtendToFloor to false for old snapshots', () => {
    useClosetStore.getState().restoreConfig(baseSnapshot)
    expect(useClosetStore.getState().doorsExtendToFloor).toBe(false)
  })
})

describe('setDoorHandleMaterial', () => {
  beforeEach(resetStore)

  it('updates doorHandleMaterial in store', () => {
    useClosetStore.getState().setDoorHandleMaterial('black')
    expect(useClosetStore.getState().doorHandleMaterial).toBe('black')
  })

  it('defaults to chrome', () => {
    expect(useClosetStore.getState().doorHandleMaterial).toBe('chrome')
  })
})

describe('setDoorsExtendToFloor', () => {
  beforeEach(resetStore)

  it('updates doorsExtendToFloor in store', () => {
    useClosetStore.getState().setDoorsExtendToFloor(true)
    expect(useClosetStore.getState().doorsExtendToFloor).toBe(true)
  })

  it('defaults to false', () => {
    expect(useClosetStore.getState().doorsExtendToFloor).toBe(false)
  })
})

describe('setHasPowerHole', () => {
  beforeEach(resetStore)

  it('sets hasPowerHole true on the given slot', () => {
    useClosetStore.getState().setHasPowerHole(0, true)
    expect(useClosetStore.getState().modules[0].hasPowerHole).toBe(true)
  })

  it('sets hasPowerHole false on the given slot', () => {
    useClosetStore.getState().setHasPowerHole(0, true)
    useClosetStore.getState().setHasPowerHole(0, false)
    expect(useClosetStore.getState().modules[0].hasPowerHole).toBe(false)
  })

  it('does not affect other slots', () => {
    useClosetStore.setState({ moduleCount: 3, modules: [
      { slotIndex: 0, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false },
      { slotIndex: 1, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false },
      { slotIndex: 2, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false },
    ]})
    useClosetStore.getState().setHasPowerHole(1, true)
    expect(useClosetStore.getState().modules[0].hasPowerHole).toBe(false)
    expect(useClosetStore.getState().modules[1].hasPowerHole).toBe(true)
    expect(useClosetStore.getState().modules[2].hasPowerHole).toBe(false)
  })
})
