import { describe, it, expect, beforeEach } from 'vitest'
import { useClosetStore } from '../store'
import type { ClosetConfigSnapshot } from '@/lib/cart/types'
import type { FullPricingData, PricingConstraints } from '@/types/configurator-pricing'

const baseConstraints: PricingConstraints = {
  singleCorpus: { minWidth: 15, maxWidth: 65, minHeight: 200, maxHeight: 275, minDepth: 50, maxDepth: 80 },
  doubleCorpus: { minWidth: 30, maxWidth: 130, minHeight: 200, maxHeight: 275, minDepth: 50, maxDepth: 80 },
  topCabinet: { maxHeight: 110 },
}

function makePricingData(handles: FullPricingData['handles']): FullPricingData {
  return {
    config: {
      currency: 'EUR',
      lastUpdated: '2026-01-01',
      led: { basePrice: 50, pricePerModule: 25 },
      deliveryPrice: 95,
      constraints: baseConstraints,
    },
    modules: [],
    accessories: [],
    doors: [],
    installation: [],
    handles,
  }
}

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
    const snapshot: ClosetConfigSnapshot = { ...baseSnapshot, doorHandleMaterial: 'brass' }
    useClosetStore.getState().restoreConfig(snapshot)
    expect(useClosetStore.getState().doorHandleMaterial).toBe('brass')
  })

  it('defaults doorHandleMaterial to chrome for old snapshots', () => {
    useClosetStore.getState().restoreConfig(baseSnapshot)
    expect(useClosetStore.getState().doorHandleMaterial).toBe('chrome')
  })

  it('defaults sidePanelThickness to "18mm" for old snapshots missing the field', () => {
    useClosetStore.getState().restoreConfig(baseSnapshot)
    expect(useClosetStore.getState().sidePanelThickness).toBe('18mm')
  })

  it('restores sidePanelThickness "18mm" from snapshot', () => {
    const snapshot: ClosetConfigSnapshot = { ...baseSnapshot, sidePanelThickness: '18mm' }
    useClosetStore.getState().restoreConfig(snapshot)
    expect(useClosetStore.getState().sidePanelThickness).toBe('18mm')
  })

  it('restores sidePanelThickness "36mm" upgrade from snapshot', () => {
    const snapshot: ClosetConfigSnapshot = { ...baseSnapshot, sidePanelThickness: '36mm' }
    useClosetStore.getState().restoreConfig(snapshot)
    expect(useClosetStore.getState().sidePanelThickness).toBe('36mm')
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

describe('handle material invariant', () => {
  beforeEach(resetStore)

  const handlesWithGating = [
    { id: '23', name: 'W7845', productCode: 'W7845', price: 12, allowedMaterials: ['chrome', 'black'] as const },
    { id: '42', name: 'WGold', productCode: 'WGold', price: 15, allowedMaterials: ['brass'] as const },
    { id: '99', name: 'WAny', productCode: 'WAny', price: 10 },
  ]

  it('setDoorHandleId rewrites material when current is disallowed by new handle', () => {
    useClosetStore.getState().hydrate(makePricingData(handlesWithGating as any))
    useClosetStore.getState().setDoorHandleMaterial('chrome')
    useClosetStore.getState().setDoorHandleId('42') // gold-only
    expect(useClosetStore.getState().doorHandleMaterial).toBe('brass')
  })

  it('setDoorHandleId preserves material when allowed by new handle', () => {
    useClosetStore.getState().hydrate(makePricingData(handlesWithGating as any))
    useClosetStore.getState().setDoorHandleMaterial('black')
    useClosetStore.getState().setDoorHandleId('23')
    expect(useClosetStore.getState().doorHandleMaterial).toBe('black')
  })

  it('setDoorHandleMaterial rewrites to first allowed when disallowed', () => {
    useClosetStore.getState().hydrate(makePricingData(handlesWithGating as any))
    useClosetStore.getState().setDoorHandleId('42') // gold-only
    useClosetStore.getState().setDoorHandleMaterial('chrome')
    expect(useClosetStore.getState().doorHandleMaterial).toBe('brass')
  })

  it('empty/missing allowedMaterials means all metals allowed', () => {
    useClosetStore.getState().hydrate(makePricingData(handlesWithGating as any))
    useClosetStore.getState().setDoorHandleId('99')
    useClosetStore.getState().setDoorHandleMaterial('rose-gold')
    expect(useClosetStore.getState().doorHandleMaterial).toBe('rose-gold')
  })

  it('hydrate corrects material when invalid combination is loaded', () => {
    // simulate a snapshot-restored state with chrome on a gold-only handle, then hydrate
    useClosetStore.setState({ doorHandleId: '42', doorHandleMaterial: 'chrome' })
    useClosetStore.getState().hydrate(makePricingData(handlesWithGating as any))
    expect(useClosetStore.getState().doorHandleMaterial).toBe('brass')
  })

  it('push-to-open does not interfere with material validation', () => {
    useClosetStore.getState().hydrate(makePricingData(handlesWithGating as any))
    useClosetStore.getState().setDoorHandleId('99') // ungated
    useClosetStore.getState().setDoorHandleMaterial('rose-gold')
    useClosetStore.getState().setDoorHandleId('none') // push-to-open, not a real handle
    // unknown handle id => no allowedMaterials => current material passes through
    expect(useClosetStore.getState().doorHandleMaterial).toBe('rose-gold')
  })
})
