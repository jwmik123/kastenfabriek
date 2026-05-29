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
      layoutId: 11,
      name: 'Wasmachine (enkel)',
      description: 'Single washer',
      contents: { shelves: 0, rods: 0, drawers: 0, hasWashingMachineShelf: true },
      priceDouble: 0,
      priceSingle: 0,
      availableForTopCabinet: false,
      minSlotWidth: 65,
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
  depthCm: 85,
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

  it('clamps depth to minimum 85cm', () => {
    useWasmachinekastStore.getState().setDepth(40)
    expect(useWasmachinekastStore.getState().depth).toBe(85)
  })

  it('accepts depth exactly at 85cm', () => {
    useWasmachinekastStore.getState().setDepth(85)
    expect(useWasmachinekastStore.getState().depth).toBe(85)
  })

  it('accepts depth above 85cm', () => {
    useWasmachinekastStore.getState().setDepth(90)
    expect(useWasmachinekastStore.getState().depth).toBe(90)
  })

  it('respects Sanity maxDepth when hydrated', () => {
    const pd = {
      ...basePricingData,
      config: {
        ...basePricingData.config,
        constraints: {
          ...baseConstraints,
          singleCorpus: { ...baseConstraints.singleCorpus, maxDepth: 100 },
        },
      },
    }
    useWasmachinekastStore.getState().hydrate(pd)
    useWasmachinekastStore.getState().setDepth(999)
    expect(useWasmachinekastStore.getState().depth).toBe(100)
  })
})

// ─── setModuleLayout ─────────────────────────────────────────────────────────

describe('setModuleLayout — fixed-width washer slots', () => {
  beforeEach(resetStore)

  it('always applies washer layout regardless of current slot width', () => {
    // width=120, moduleCount=2 → uniform slotWidth=60cm < 75cm, but washer always allowed
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
    expect(useWasmachinekastStore.getState().modules[0].layoutId).toBe(99)
  })

  it('sets fixedWidth = minSlotWidth when placing washer layout', () => {
    useWasmachinekastStore.setState({
      width: 120,
      moduleCount: 2,
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().setModuleLayout(0, 99)
    expect(useWasmachinekastStore.getState().modules[0].fixedWidth).toBe(75)
  })

  it('clears fixedWidth when placing layout without minSlotWidth', () => {
    useWasmachinekastStore.setState({
      width: 120,
      moduleCount: 2,
      modules: [
        { slotIndex: 0, layoutId: 99, hasDoor: true, span: 1, fixedWidth: 75 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().setModuleLayout(0, 1) // no minSlotWidth
    expect(useWasmachinekastStore.getState().modules[0].layoutId).toBe(1)
    expect(useWasmachinekastStore.getState().modules[0].fixedWidth).toBeUndefined()
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
    expect(s.depth).toBe(85)
    expect(s.moduleCount).toBe(2)
  })

  it('legacy snapshot (no layout, depth 65) loads as high-only with depth clamped to 85', () => {
    const legacy: ClosetConfigSnapshot = { ...baseSnapshot, depthCm: 65 }
    useWasmachinekastStore.getState().restoreConfig(legacy)
    const s = useWasmachinekastStore.getState()
    expect(s.layout).toBe('high-only')
    expect(s.depth).toBe(85)
    expect(s.width).toBe(120)
    expect(s.height).toBe(240)
    expect(s.moduleCount).toBe(2)
    expect(s.lowSection).toBeNull()
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
      doorHandleMaterial: 'brass',
      doorsExtendToFloor: true,
      lightStripsEnabled: true,
    }
    useWasmachinekastStore.getState().restoreConfig(snap)
    const s = useWasmachinekastStore.getState()
    expect(s.buitenkantMaterialId).toBe('antraciet')
    expect(s.binnenkantMaterialId).toBe('eiken')
    expect(s.doorHandleId).toBe('42')
    expect(s.doorHandleMaterial).toBe('brass')
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

// ─── addWasherModule / removeWasherModule / clearWasherModules ───────────────

describe('addWasherModule / removeWasherModule / clearWasherModules', () => {
  beforeEach(resetStore)

  it('addWasherModule adds entry to washerModules', () => {
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().addWasherModule(1, 99)
    const s = useWasmachinekastStore.getState()
    expect(s.washerModules).toHaveLength(1)
    expect(s.washerModules[0].slotIndex).toBe(1)
    expect(s.washerModules[0].layoutId).toBe(99)
  })

  it('addWasherModule wires layoutId into the modules array', () => {
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().addWasherModule(0, 99)
    expect(useWasmachinekastStore.getState().modules[0].layoutId).toBe(99)
  })

  it('addWasherModule replaces existing entry for same slot', () => {
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().addWasherModule(0, 11)
    useWasmachinekastStore.getState().addWasherModule(0, 14)
    const s = useWasmachinekastStore.getState()
    expect(s.washerModules).toHaveLength(1)
    expect(s.washerModules[0].layoutId).toBe(14)
  })

  it('clearWasherModules empties washerModules', () => {
    useWasmachinekastStore.setState({
      washerModules: [{ slotIndex: 1, layoutId: 99 }],
    })
    useWasmachinekastStore.getState().clearWasherModules()
    expect(useWasmachinekastStore.getState().washerModules).toHaveLength(0)
  })

  it('clearWasherModules nulls layoutId and fixedWidth on washer slots', () => {
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().addWasherModule(0, 99)
    useWasmachinekastStore.getState().clearWasherModules()
    const m = useWasmachinekastStore.getState().modules[0]
    expect(m.layoutId).toBeNull()
    expect(m.fixedWidth).toBeUndefined()
  })

  it('removeWasherModule then addWasherModule on new slot leaves only new slot', () => {
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().addWasherModule(0, 99)
    useWasmachinekastStore.getState().removeWasherModule(0)
    useWasmachinekastStore.getState().addWasherModule(1, 99)
    const modules = useWasmachinekastStore.getState().modules
    expect(modules[0].layoutId).toBeNull()
    expect(modules[1].layoutId).toBe(99)
  })

  it('clearWasherModules with empty washerModules does not throw and leaves modules unchanged', () => {
    useWasmachinekastStore.setState({
      washerModules: [],
      modules: [
        { slotIndex: 0, layoutId: 1, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
    })
    expect(() => useWasmachinekastStore.getState().clearWasherModules()).not.toThrow()
    const modules = useWasmachinekastStore.getState().modules
    expect(modules[0].layoutId).toBe(1)
  })

  it('removeWasherModule nulls layoutId on that slot', () => {
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().addWasherModule(0, 99)
    useWasmachinekastStore.getState().removeWasherModule(0)
    expect(useWasmachinekastStore.getState().modules[0].layoutId).toBeNull()
    expect(useWasmachinekastStore.getState().washerModules).toHaveLength(0)
  })
})

// ─── randomFill — washer slots preserved ─────────────────────────────────────

describe('randomFill — washer slots preserved', () => {
  beforeEach(resetStore)

  it('randomFill never changes layoutId of a washer slot', () => {
    useWasmachinekastStore.setState({
      moduleCount: 3,
      washerModules: [{ slotIndex: 1, layoutId: 99 }],
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: 99, hasDoor: true, span: 1 },
        { slotIndex: 2, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    for (let i = 0; i < 20; i++) {
      useWasmachinekastStore.getState().randomFill()
      expect(useWasmachinekastStore.getState().modules[1].layoutId).toBe(99)
    }
  })

  it('randomFill still fills non-washer slots', () => {
    useWasmachinekastStore.setState({
      moduleCount: 2,
      washerModules: [{ slotIndex: 0, layoutId: 99 }],
      modules: [
        { slotIndex: 0, layoutId: 99, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().randomFill()
    expect(useWasmachinekastStore.getState().modules[1].layoutId).not.toBeNull()
  })

  it('randomFill preserves multiple washer slots', () => {
    useWasmachinekastStore.setState({
      moduleCount: 4,
      washerModules: [{ slotIndex: 1, layoutId: 11 }, { slotIndex: 2, layoutId: 13 }],
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: 11, hasDoor: true, span: 1 },
        { slotIndex: 2, layoutId: 13, hasDoor: true, span: 1 },
        { slotIndex: 3, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    for (let i = 0; i < 20; i++) {
      useWasmachinekastStore.getState().randomFill()
      const modules = useWasmachinekastStore.getState().modules
      expect(modules[1].layoutId).toBe(11)
      expect(modules[2].layoutId).toBe(13)
    }
  })
})

// ─── setModuleCount — washer slot reset ──────────────────────────────────────

describe('setModuleCount — washer slot reset', () => {
  beforeEach(resetStore)

  it('reducing count so a washer slot >= count clears that washer and sets step to 2', () => {
    useWasmachinekastStore.setState({
      width: 120,
      moduleCount: 3,
      washerModules: [{ slotIndex: 2, layoutId: 99 }],
      step: 3,
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 2, layoutId: 99, hasDoor: true, span: 1 },
      ],
    })
    useWasmachinekastStore.getState().setModuleCount(2)
    const s = useWasmachinekastStore.getState()
    expect(s.washerModules).toHaveLength(0)
    expect(s.step).toBe(2)
  })

  it('reducing count that keeps all washer slots valid does not clear washers', () => {
    useWasmachinekastStore.setState({
      width: 120,
      moduleCount: 3,
      washerModules: [{ slotIndex: 0, layoutId: 99 }],
      step: 3,
      modules: [
        { slotIndex: 0, layoutId: 99, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 2, layoutId: null, hasDoor: true, span: 1 },
      ],
    })
    useWasmachinekastStore.getState().setModuleCount(2)
    const s = useWasmachinekastStore.getState()
    expect(s.washerModules).toHaveLength(1)
    expect(s.washerModules[0].slotIndex).toBe(0)
  })

  it('reducing count removes out-of-bounds washer but keeps valid ones', () => {
    useWasmachinekastStore.setState({
      width: 120,
      moduleCount: 3,
      washerModules: [{ slotIndex: 0, layoutId: 11 }, { slotIndex: 2, layoutId: 14 }],
      step: 3,
      modules: [
        { slotIndex: 0, layoutId: 11, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 2, layoutId: 14, hasDoor: true, span: 1 },
      ],
    })
    useWasmachinekastStore.getState().setModuleCount(2)
    const s = useWasmachinekastStore.getState()
    expect(s.washerModules).toHaveLength(1)
    expect(s.washerModules[0].slotIndex).toBe(0)
  })
})

// ─── setWidth — washer slot reset ────────────────────────────────────────────

describe('setWidth — washer slot reset', () => {
  beforeEach(resetStore)

  it('setWidth forcing moduleCount reduction removes out-of-bounds washer', () => {
    useWasmachinekastStore.setState({
      width: 120,
      moduleCount: 3,
      washerModules: [{ slotIndex: 2, layoutId: 99 }],
      step: 3,
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 2, layoutId: 99, hasDoor: true, span: 1 },
      ],
      constraints: {
        ...baseConstraints,
        singleCorpus: { ...baseConstraints.singleCorpus, minWidth: 30, maxWidth: 65 },
      },
    })
    useWasmachinekastStore.getState().setWidth(60)
    const s = useWasmachinekastStore.getState()
    expect(s.washerModules).toHaveLength(0)
    expect(s.step).toBe(2)
  })
})

// ─── restoreConfig — washer fields ───────────────────────────────────────────

describe('restoreConfig — washer fields', () => {
  beforeEach(resetStore)

  it('restores washerModules from snapshot', () => {
    const snap = { ...baseSnapshot, washerModules: [{ slotIndex: 1, layoutId: 99 }] }
    useWasmachinekastStore.getState().restoreConfig(snap)
    const s = useWasmachinekastStore.getState()
    expect(s.washerModules).toHaveLength(1)
    expect(s.washerModules[0].slotIndex).toBe(1)
    expect(s.washerModules[0].layoutId).toBe(99)
  })

  it('does not restore washerModules entries that exceed moduleCount', () => {
    const snap = {
      ...baseSnapshot,
      moduleCount: 2,
      washerModules: [{ slotIndex: 5, layoutId: 99 }],
    }
    useWasmachinekastStore.getState().restoreConfig(snap)
    expect(useWasmachinekastStore.getState().washerModules).toHaveLength(0)
  })

  it('defaults washerModules to empty array for snapshots without washerModules', () => {
    useWasmachinekastStore.getState().restoreConfig(baseSnapshot)
    expect(useWasmachinekastStore.getState().washerModules).toHaveLength(0)
  })

  it('filters out-of-bounds entries but keeps valid ones', () => {
    const snap = {
      ...baseSnapshot,
      moduleCount: 2,
      washerModules: [{ slotIndex: 0, layoutId: 11 }, { slotIndex: 5, layoutId: 99 }],
    }
    useWasmachinekastStore.getState().restoreConfig(snap)
    const s = useWasmachinekastStore.getState()
    expect(s.washerModules).toHaveLength(1)
    expect(s.washerModules[0].slotIndex).toBe(0)
  })
})

// ─── dual layout: restore + low-section setters ─────────────────────────────

describe('restoreConfig — dual layout (low-left / low-right)', () => {
  beforeEach(resetStore)

  it('low-left snapshot loads high into top-level and low into lowSection', () => {
    useWasmachinekastStore.getState().hydrate(basePricingData)
    const snap: ClosetConfigSnapshot = {
      ...baseSnapshot,
      widthCm: 200,
      heightCm: 240,
      moduleCount: 3,
      modules: [
        { slotIndex: 0, layoutId: 1, layoutName: 'P', hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, layoutName: null, hasDoor: true, span: 1 },
        { slotIndex: 2, layoutId: null, layoutName: null, hasDoor: false, span: 1 },
      ],
      layout: 'low-left',
      lowSection: {
        width: 120,
        height: 90,
        moduleCount: 2,
        modules: [
          { slotIndex: 0, layoutId: null, layoutName: null, hasDoor: true, span: 1 },
          { slotIndex: 1, layoutId: null, layoutName: null, hasDoor: true, span: 1 },
        ],
        topPanelThicknessMm: 36,
        countertopMaterialId: 'eiken',
      },
    }
    useWasmachinekastStore.getState().restoreConfig(snap)
    const s = useWasmachinekastStore.getState()
    expect(s.layout).toBe('low-left')
    expect(s.width).toBe(200)
    expect(s.height).toBe(240)
    expect(s.moduleCount).toBe(3)
    expect(s.modules[0].layoutId).toBe(1)
    expect(s.modules[2].hasDoor).toBe(false)
    expect(s.lowSection?.width).toBe(120)
    expect(s.lowSection?.moduleCount).toBe(2)
    expect(s.topPanelThicknessMm).toBe(36)
    expect(s.countertopMaterialId).toBe('eiken')
    expect(s.activeModulesSection).toBe('high')
  })

  it('low-right snapshot round-trips both sections', () => {
    useWasmachinekastStore.getState().hydrate(basePricingData)
    const snap: ClosetConfigSnapshot = {
      ...baseSnapshot,
      widthCm: 150,
      moduleCount: 2,
      layout: 'low-right',
      lowSection: {
        width: 90,
        height: 90,
        moduleCount: 1,
        modules: [
          { slotIndex: 0, layoutId: null, layoutName: null, hasDoor: true, span: 1 },
        ],
        topPanelThicknessMm: 18,
        countertopMaterialId: 'premium-wit',
      },
    }
    useWasmachinekastStore.getState().restoreConfig(snap)
    const s = useWasmachinekastStore.getState()
    expect(s.layout).toBe('low-right')
    expect(s.width).toBe(150)
    expect(s.lowSection?.width).toBe(90)
    expect(s.lowSection?.moduleCount).toBe(1)
  })
})

describe('low-section setters', () => {
  beforeEach(resetStore)

  function bootstrapDual() {
    useWasmachinekastStore.getState().hydrate(basePricingData)
    useWasmachinekastStore.getState().applySectionsState({
      layout: 'low-left',
      highSection: {
        width: 180,
        height: 240,
        moduleCount: 3,
        modules: [
          { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
          { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
          { slotIndex: 2, layoutId: null, hasDoor: true, span: 1 },
        ],
      },
      lowSection: {
        width: 120,
        height: 90,
        moduleCount: 2,
        modules: [
          { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
          { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
        ],
        topPanelThicknessMm: 18,
        countertopMaterialId: 'premium-wit',
      },
      washerSection: null,
    })
  }

  it('setLowSectionWidth clamps to single-corpus bounds', () => {
    bootstrapDual()
    useWasmachinekastStore.getState().setLowSectionWidth(5)
    expect(useWasmachinekastStore.getState().lowSection?.width).toBe(15) // minWidth
  })

  it('setLowSectionModuleCount resizes lowSection.modules', () => {
    bootstrapDual()
    useWasmachinekastStore.getState().setLowSectionModuleCount(3)
    const ls = useWasmachinekastStore.getState().lowSection
    expect(ls?.moduleCount).toBe(3)
    expect(ls?.modules).toHaveLength(3)
  })

  it('setLowSectionModuleLayout writes to lowSection.modules only', () => {
    bootstrapDual()
    useWasmachinekastStore.getState().setLowSectionModuleLayout(0, 1)
    const s = useWasmachinekastStore.getState()
    expect(s.lowSection?.modules[0].layoutId).toBe(1)
    expect(s.modules[0].layoutId).toBeNull()
  })

  it('setWasherSection discards existing washers when switching', () => {
    bootstrapDual()
    useWasmachinekastStore.setState({
      washerSection: 'high',
      washerModules: [{ slotIndex: 0, layoutId: 11 }],
      modules: [
        { slotIndex: 0, layoutId: 11, hasDoor: true, span: 1, fixedWidth: 68.6 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 2, layoutId: null, hasDoor: true, span: 1 },
      ],
    })
    useWasmachinekastStore.getState().setWasherSection('low')
    const s = useWasmachinekastStore.getState()
    expect(s.washerSection).toBe('low')
    expect(s.washerModules).toHaveLength(0)
    expect(s.modules[0].layoutId).toBeNull()
  })
})

// ─── handle material invariant ───────────────────────────────────────────────

describe('handle material invariant', () => {
  beforeEach(resetStore)

  const handlesWithGating = [
    { id: '23', name: 'W7845', productCode: 'W7845', price: 12, allowedMaterials: ['chrome', 'black'] as const },
    { id: '42', name: 'WGold', productCode: 'WGold', price: 15, allowedMaterials: ['brass'] as const },
    { id: '99', name: 'WAny', productCode: 'WAny', price: 10 },
  ]

  function pricingWithHandles() {
    return { ...basePricingData, handles: handlesWithGating as any }
  }

  it('setDoorHandleId rewrites material when current is disallowed by new handle', () => {
    useWasmachinekastStore.getState().hydrate(pricingWithHandles())
    useWasmachinekastStore.getState().setDoorHandleMaterial('chrome')
    useWasmachinekastStore.getState().setDoorHandleId('42')
    expect(useWasmachinekastStore.getState().doorHandleMaterial).toBe('brass')
  })

  it('setDoorHandleId preserves material when allowed by new handle', () => {
    useWasmachinekastStore.getState().hydrate(pricingWithHandles())
    useWasmachinekastStore.getState().setDoorHandleMaterial('black')
    useWasmachinekastStore.getState().setDoorHandleId('23')
    expect(useWasmachinekastStore.getState().doorHandleMaterial).toBe('black')
  })

  it('setDoorHandleMaterial rewrites to first allowed when disallowed', () => {
    useWasmachinekastStore.getState().hydrate(pricingWithHandles())
    useWasmachinekastStore.getState().setDoorHandleId('42')
    useWasmachinekastStore.getState().setDoorHandleMaterial('chrome')
    expect(useWasmachinekastStore.getState().doorHandleMaterial).toBe('brass')
  })

  it('empty/missing allowedMaterials means all metals allowed', () => {
    useWasmachinekastStore.getState().hydrate(pricingWithHandles())
    useWasmachinekastStore.getState().setDoorHandleId('99')
    useWasmachinekastStore.getState().setDoorHandleMaterial('rose-gold')
    expect(useWasmachinekastStore.getState().doorHandleMaterial).toBe('rose-gold')
  })

  it('hydrate corrects material when invalid combination is loaded', () => {
    useWasmachinekastStore.setState({ doorHandleId: '42', doorHandleMaterial: 'chrome' })
    useWasmachinekastStore.getState().hydrate(pricingWithHandles())
    expect(useWasmachinekastStore.getState().doorHandleMaterial).toBe('brass')
  })

  it('push-to-open does not interfere with material validation', () => {
    useWasmachinekastStore.getState().hydrate(pricingWithHandles())
    useWasmachinekastStore.getState().setDoorHandleId('99')
    useWasmachinekastStore.getState().setDoorHandleMaterial('rose-gold')
    useWasmachinekastStore.getState().setDoorHandleId('none')
    expect(useWasmachinekastStore.getState().doorHandleMaterial).toBe('rose-gold')
  })
})

describe('low-only accessory filter', () => {
  beforeEach(resetStore)

  function pricingWithPowerOutlet(availableForLowSection: boolean): FullPricingData {
    return {
      ...basePricingData,
      accessories: [
        {
          id: 'power-outlet',
          name: 'Power outlet',
          price: 25,
          category: 'electrical',
          perUnit: true,
          availableForLowSection,
        },
      ],
    }
  }

  it('applySectionsState into low-only clears hasPowerHole when power-outlet is filtered', () => {
    useWasmachinekastStore.getState().hydrate(pricingWithPowerOutlet(false))
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1, hasPowerHole: true },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1, hasPowerHole: true },
      ],
    })
    useWasmachinekastStore.getState().applySectionsState({
      layout: 'low-only',
      highSection: null,
      lowSection: {
        width: 120,
        height: 90,
        moduleCount: 2,
        modules: [
          { slotIndex: 0, layoutId: null, hasDoor: true, span: 1, hasPowerHole: true },
          { slotIndex: 1, layoutId: null, hasDoor: true, span: 1, hasPowerHole: true },
        ],
        topPanelThicknessMm: 18,
        countertopMaterialId: 'premium-wit',
      },
      washerSection: null,
    })
    const s = useWasmachinekastStore.getState()
    expect(s.modules.every((m) => !m.hasPowerHole)).toBe(true)
    expect(s.lowSection?.modules.every((m) => !m.hasPowerHole)).toBe(true)
    expect(s.lowOnlyAccessoryNotice).toBe(true)
  })

  it('applySectionsState into low-only preserves hasPowerHole when power-outlet is allowed', () => {
    useWasmachinekastStore.getState().hydrate(pricingWithPowerOutlet(true))
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1, hasPowerHole: true },
      ],
    })
    useWasmachinekastStore.getState().applySectionsState({
      layout: 'low-only',
      highSection: null,
      lowSection: {
        width: 120,
        height: 90,
        moduleCount: 1,
        modules: [
          { slotIndex: 0, layoutId: null, hasDoor: true, span: 1, hasPowerHole: true },
        ],
        topPanelThicknessMm: 18,
        countertopMaterialId: 'premium-wit',
      },
      washerSection: null,
    })
    const s = useWasmachinekastStore.getState()
    expect(s.modules[0].hasPowerHole).toBe(true)
    expect(s.lowOnlyAccessoryNotice).toBe(false)
  })

  it('applySectionsState to high-only does not raise notice', () => {
    useWasmachinekastStore.getState().hydrate(pricingWithPowerOutlet(false))
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1, hasPowerHole: true },
      ],
    })
    useWasmachinekastStore.getState().applySectionsState({
      layout: 'high-only',
      highSection: {
        width: 120,
        height: 240,
        moduleCount: 1,
        modules: [
          { slotIndex: 0, layoutId: null, hasDoor: true, span: 1, hasPowerHole: true },
        ],
      },
      lowSection: null,
      washerSection: null,
    })
    const s = useWasmachinekastStore.getState()
    expect(s.modules[0].hasPowerHole).toBe(true)
    expect(s.lowOnlyAccessoryNotice).toBe(false)
  })

  it('hydrate clears hasPowerHole when current layout is low-only and power-outlet is filtered', () => {
    useWasmachinekastStore.setState({
      layout: 'low-only',
      lowSection: {
        width: 120,
        height: 90,
        moduleCount: 1,
        modules: [
          { slotIndex: 0, layoutId: null, hasDoor: true, span: 1, hasPowerHole: true },
        ],
        topPanelThicknessMm: 18,
        countertopMaterialId: 'premium-wit',
      },
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1, hasPowerHole: true },
      ],
    })
    useWasmachinekastStore.getState().hydrate(pricingWithPowerOutlet(false))
    const s = useWasmachinekastStore.getState()
    expect(s.modules[0].hasPowerHole).toBe(false)
    expect(s.lowOnlyAccessoryNotice).toBe(true)
  })

  it('dismissLowOnlyAccessoryNotice clears the flag', () => {
    useWasmachinekastStore.setState({ lowOnlyAccessoryNotice: true })
    useWasmachinekastStore.getState().dismissLowOnlyAccessoryNotice()
    expect(useWasmachinekastStore.getState().lowOnlyAccessoryNotice).toBe(false)
  })
})

// ─── washer placement capacity gate ──────────────────────────────────────────

describe('canPlaceWasher / addWasherModule — capacity gate', () => {
  beforeEach(resetStore)

  // Mock layout has layoutId 99, minSlotWidth=75. FALLBACK_MODULE_MIN_WIDTH=15.

  it('allows the first washer when total fits', () => {
    useWasmachinekastStore.setState({
      width: 100, moduleCount: 2, layout: 'high-only',
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    expect(useWasmachinekastStore.getState().canPlaceWasher(0, 99)).toBe(true)
  })

  it('rejects a second washer when remaining width per non-washer slot would drop below the minimum', () => {
    // After one washer (75cm) on slot 0, slot 1 has 25cm — adding a second
    // washer would leave no non-washer slots but 75+75=150 > 100. Rejected.
    useWasmachinekastStore.setState({
      width: 100, moduleCount: 2, layout: 'high-only',
      washerModules: [{ slotIndex: 0, layoutId: 99 }],
      modules: [
        { slotIndex: 0, layoutId: 99, hasDoor: true, span: 1, fixedWidth: 75 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    expect(useWasmachinekastStore.getState().canPlaceWasher(1, 99)).toBe(false)
  })

  it('addWasherModule is a no-op when canPlaceWasher rejects', () => {
    useWasmachinekastStore.setState({
      width: 100, moduleCount: 2, layout: 'high-only',
      washerModules: [{ slotIndex: 0, layoutId: 99 }],
      modules: [
        { slotIndex: 0, layoutId: 99, hasDoor: true, span: 1, fixedWidth: 75 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().addWasherModule(1, 99)
    expect(useWasmachinekastStore.getState().washerModules).toHaveLength(1)
    expect(useWasmachinekastStore.getState().modules[1].layoutId).toBeNull()
  })

  it('allows a second washer when both fit with adequate non-washer remainder', () => {
    // width=200, 4 slots, 2 washers @75cm => 150cm, remaining 50cm split over
    // 2 non-washer slots = 25cm each ≥ FALLBACK_MODULE_MIN_WIDTH (15). OK.
    useWasmachinekastStore.setState({
      width: 200, moduleCount: 4, layout: 'high-only',
      washerModules: [{ slotIndex: 0, layoutId: 99 }],
      modules: [
        { slotIndex: 0, layoutId: 99, hasDoor: true, span: 1, fixedWidth: 75 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 2, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 3, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    expect(useWasmachinekastStore.getState().canPlaceWasher(1, 99)).toBe(true)
  })

  it('allows replacing an existing washer slot (slot already pinned does not double-count)', () => {
    // Replacing slot 0's washer with another washer of the same minSlotWidth
    // must not be rejected by the gate.
    useWasmachinekastStore.setState({
      width: 100, moduleCount: 2, layout: 'high-only',
      washerModules: [{ slotIndex: 0, layoutId: 99 }],
      modules: [
        { slotIndex: 0, layoutId: 99, hasDoor: true, span: 1, fixedWidth: 75 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    expect(useWasmachinekastStore.getState().canPlaceWasher(0, 99)).toBe(true)
  })
})
