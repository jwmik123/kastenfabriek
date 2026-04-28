import { describe, it, expect, beforeEach } from 'vitest'
import { useWasmachinekastStore } from '../store'
import type { ClosetConfigSnapshot } from '@/lib/cart/types'
import type { FullPricingData, PricingConstraints } from '@/types/configurator-pricing'

function resetStore() {
  useWasmachinekastStore.setState(useWasmachinekastStore.getInitialState())
}

const baseConstraints: PricingConstraints = {
  singleCorpus: {
    minWidth: 15,
    maxWidth: 65,
    minHeight: 200,
    maxHeight: 275,
    minDepth: 50,
    maxDepth: 80,
  },
  doubleCorpus: {
    minWidth: 30,
    maxWidth: 130,
    minHeight: 200,
    maxHeight: 275,
    minDepth: 50,
    maxDepth: 80,
  },
  topCabinet: { maxHeight: 110 },
}

const basePricingData: FullPricingData = {
  config: {
    currency: 'EUR',
    lastUpdated: '2026-01-01',
    led: { basePrice: 50, pricePerModule: 25 },
    deliveryPrice: 95,
    constraints: baseConstraints,
  },
  modules: [
    {
      layoutId: 1,
      name: 'Planken',
      description: 'Shelves',
      contents: { shelves: 3, rods: 0, drawers: 0 },
      priceDouble: 200,
      priceSingle: 100,
      availableForTopCabinet: true,
    },
    {
      layoutId: 99,
      name: 'Wasmachine (enkel)',
      description: 'Single washer slot',
      contents: { shelves: 0, rods: 0, drawers: 0, hasWashingMachineShelf: true },
      priceDouble: 300,
      priceSingle: 150,
      availableForTopCabinet: false,
      minSlotWidth: 75,
    },
  ],
  accessories: [],
  doors: [],
  installation: [],
  handles: [],
}

const baseSnapshot: ClosetConfigSnapshot = {
  id: 'snap-1',
  capturedAt: '2026-01-01T00:00:00.000Z',
  widthCm: 120,
  heightCm: 240,
  depthCm: 65,
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

// ─── setDepth ────────────────────────────────────────────────────────────────

describe('setDepth', () => {
  beforeEach(resetStore)

  it('clamps depth to minimum 65cm', () => {
    useWasmachinekastStore.getState().setDepth(40)
    expect(useWasmachinekastStore.getState().depth).toBe(65)
  })

  it('accepts depth exactly at 65cm', () => {
    useWasmachinekastStore.getState().setDepth(65)
    expect(useWasmachinekastStore.getState().depth).toBe(65)
  })

  it('accepts depth above 65cm', () => {
    useWasmachinekastStore.getState().setDepth(70)
    expect(useWasmachinekastStore.getState().depth).toBe(70)
  })

  it('respects Sanity maxDepth when hydrated', () => {
    useWasmachinekastStore.getState().hydrate(basePricingData)
    useWasmachinekastStore.getState().setDepth(999)
    expect(useWasmachinekastStore.getState().depth).toBe(80)
  })
})

// ─── setModuleLayout ─────────────────────────────────────────────────────────

describe('setModuleLayout — minSlotWidth constraint', () => {
  beforeEach(resetStore)

  it('is a no-op when slot width is below layout minSlotWidth', () => {
    // width=120, moduleCount=2 → slotWidth=60cm < 75cm
    useWasmachinekastStore.setState({
      width: 120,
      moduleCount: 2,
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().setModuleLayout(0, 99) // minSlotWidth=75
    expect(useWasmachinekastStore.getState().modules[0].layoutId).toBeNull()
  })

  it('applies layout when slot width meets minSlotWidth', () => {
    // width=150, moduleCount=2 → slotWidth=75cm >= 75cm
    useWasmachinekastStore.setState({
      width: 150,
      moduleCount: 2,
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().setModuleLayout(0, 99)
    expect(useWasmachinekastStore.getState().modules[0].layoutId).toBe(99)
  })

  it('applies layout without minSlotWidth regardless of slot width', () => {
    useWasmachinekastStore.setState({
      width: 60,
      moduleCount: 2,
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().setModuleLayout(0, 1) // no minSlotWidth
    expect(useWasmachinekastStore.getState().modules[0].layoutId).toBe(1)
  })
})

// ─── hydrate ─────────────────────────────────────────────────────────────────

describe('hydrate', () => {
  beforeEach(resetStore)

  it('populates pricingData, constraints, and moduleLayouts', () => {
    useWasmachinekastStore.getState().hydrate(basePricingData)
    const s = useWasmachinekastStore.getState()
    expect(s.pricingData).toBe(basePricingData)
    expect(s.constraints).toEqual(baseConstraints)
    expect(s.moduleLayouts).toEqual(basePricingData.modules)
  })
})

// ─── restoreConfig ────────────────────────────────────────────────────────────

describe('restoreConfig', () => {
  beforeEach(resetStore)

  it('restores dimensions and module count', () => {
    useWasmachinekastStore.getState().restoreConfig(baseSnapshot)
    const s = useWasmachinekastStore.getState()
    expect(s.width).toBe(120)
    expect(s.height).toBe(240)
    expect(s.depth).toBe(65)
    expect(s.moduleCount).toBe(2)
  })

  it('restores modules array', () => {
    const snap: ClosetConfigSnapshot = {
      ...baseSnapshot,
      modules: [
        { slotIndex: 0, layoutId: 1, layoutName: 'Planken', hasDoor: false, span: 1 },
        { slotIndex: 1, layoutId: null, layoutName: null, hasDoor: true, span: 1 },
      ],
    }
    useWasmachinekastStore.getState().restoreConfig(snap)
    const modules = useWasmachinekastStore.getState().modules
    expect(modules[0].layoutId).toBe(1)
    expect(modules[0].hasDoor).toBe(false)
    expect(modules[1].layoutId).toBeNull()
  })

  it('restores appearance fields', () => {
    const snap: ClosetConfigSnapshot = {
      ...baseSnapshot,
      buitenkantMaterialId: 'antraciet',
      binnenkantMaterialId: 'eiken',
      doorHandleId: '42',
      doorHandleMaterial: 'gold',
      doorsExtendToFloor: true,
      lightStripsEnabled: true,
    }
    useWasmachinekastStore.getState().restoreConfig(snap)
    const s = useWasmachinekastStore.getState()
    expect(s.buitenkantMaterialId).toBe('antraciet')
    expect(s.binnenkantMaterialId).toBe('eiken')
    expect(s.doorHandleId).toBe('42')
    expect(s.doorHandleMaterial).toBe('gold')
    expect(s.doorsExtendToFloor).toBe(true)
    expect(s.lightStripsEnabled).toBe(true)
  })

  it('defaults doorHandleMaterial to chrome for old snapshots', () => {
    useWasmachinekastStore.getState().restoreConfig(baseSnapshot)
    expect(useWasmachinekastStore.getState().doorHandleMaterial).toBe('chrome')
  })

  it('defaults hasPowerHole to false for old snapshots', () => {
    useWasmachinekastStore.getState().restoreConfig(baseSnapshot)
    useWasmachinekastStore.getState().modules.forEach((m) => {
      expect(m.hasPowerHole).toBe(false)
    })
  })

  it('resets step and selectedSlot', () => {
    useWasmachinekastStore.setState({ step: 3, selectedSlot: 1 })
    useWasmachinekastStore.getState().restoreConfig(baseSnapshot)
    expect(useWasmachinekastStore.getState().step).toBe(1)
    expect(useWasmachinekastStore.getState().selectedSlot).toBeNull()
  })
})

// ─── setModuleCount ──────────────────────────────────────────────────────────

describe('setModuleCount', () => {
  beforeEach(resetStore)

  it('preserves existing slot state when count stays same', () => {
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: 5, hasDoor: false, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleCount: 2,
    })
    useWasmachinekastStore.getState().setModuleCount(2)
    expect(useWasmachinekastStore.getState().modules[0].layoutId).toBe(5)
    expect(useWasmachinekastStore.getState().modules[0].hasDoor).toBe(false)
  })

  it('initializes new slots with hasPowerHole: false when count increases', () => {
    useWasmachinekastStore.setState({
      width: 240,
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleCount: 2,
    })
    useWasmachinekastStore.getState().setModuleCount(4)
    const modules = useWasmachinekastStore.getState().modules
    expect(modules).toHaveLength(4)
    expect(modules[2].hasPowerHole).toBe(false)
    expect(modules[3].hasPowerHole).toBe(false)
  })

  it('preserves hasPowerHole on surviving slots when count decreases', () => {
    useWasmachinekastStore.setState({
      width: 60,
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1, hasPowerHole: true },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false },
        { slotIndex: 2, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false },
      ],
      moduleCount: 3,
    })
    useWasmachinekastStore.getState().setModuleCount(1)
    const modules = useWasmachinekastStore.getState().modules
    expect(modules).toHaveLength(1)
    expect(modules[0].hasPowerHole).toBe(true)
  })
})

// ─── module count bounds ──────────────────────────────────────────────────────

describe('minModules / maxModules', () => {
  beforeEach(resetStore)

  it('minModules uses Sanity maxWidth after hydrate', () => {
    useWasmachinekastStore.getState().hydrate(basePricingData) // maxWidth=65
    useWasmachinekastStore.setState({ width: 120 })
    const min = useWasmachinekastStore.getState().minModules()
    expect(min).toBe(Math.ceil(120 / 65)) // 2
  })

  it('maxModules uses Sanity minWidth after hydrate', () => {
    useWasmachinekastStore.getState().hydrate(basePricingData) // minWidth=15
    useWasmachinekastStore.setState({ width: 120 })
    const max = useWasmachinekastStore.getState().maxModules()
    expect(max).toBe(Math.floor(120 / 15)) // 8
  })
})

// ─── no diagonal fields ───────────────────────────────────────────────────────

describe('no diagonal fields', () => {
  it('store has no diagonalSide field', () => {
    const s = useWasmachinekastStore.getState() as unknown as Record<string, unknown>
    expect(s.diagonalSide).toBeUndefined()
  })

  it('store has no placementType field', () => {
    const s = useWasmachinekastStore.getState() as unknown as Record<string, unknown>
    expect(s.placementType).toBeUndefined()
  })
})
