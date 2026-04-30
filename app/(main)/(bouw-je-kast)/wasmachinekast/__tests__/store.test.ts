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

// ─── setWasherModule / clearWasherModule ──────────────────────────────────────

describe('setWasherModule / clearWasherModule', () => {
  beforeEach(resetStore)

  it('setWasherModule sets washerSlotIndex and washerLayoutId', () => {
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().setWasherModule(1, 99)
    const s = useWasmachinekastStore.getState()
    expect(s.washerSlotIndex).toBe(1)
    expect(s.washerLayoutId).toBe(99)
  })

  it('setWasherModule wires layoutId into the modules array', () => {
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().setWasherModule(0, 99)
    expect(useWasmachinekastStore.getState().modules[0].layoutId).toBe(99)
  })

  it('clearWasherModule resets both fields to null', () => {
    useWasmachinekastStore.setState({ washerSlotIndex: 1, washerLayoutId: 99 })
    useWasmachinekastStore.getState().clearWasherModule()
    const s = useWasmachinekastStore.getState()
    expect(s.washerSlotIndex).toBeNull()
    expect(s.washerLayoutId).toBeNull()
  })

  it('clearWasherModule nulls layoutId and fixedWidth on the old slot', () => {
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().setWasherModule(0, 99)
    useWasmachinekastStore.getState().clearWasherModule()
    const m = useWasmachinekastStore.getState().modules[0]
    expect(m.layoutId).toBeNull()
    expect(m.fixedWidth).toBeUndefined()
  })

  it('clearWasherModule then setWasherModule on new slot produces exactly one washer', () => {
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().setWasherModule(0, 99)
    useWasmachinekastStore.getState().clearWasherModule()
    useWasmachinekastStore.getState().setWasherModule(1, 99)
    const modules = useWasmachinekastStore.getState().modules
    expect(modules[0].layoutId).toBeNull()
    expect(modules[1].layoutId).toBe(99)
  })

  it('clearWasherModule with washerSlotIndex null does not throw and leaves modules unchanged', () => {
    useWasmachinekastStore.setState({
      washerSlotIndex: null,
      washerLayoutId: null,
      modules: [
        { slotIndex: 0, layoutId: 1, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
    })
    expect(() => useWasmachinekastStore.getState().clearWasherModule()).not.toThrow()
    const modules = useWasmachinekastStore.getState().modules
    expect(modules[0].layoutId).toBe(1)
  })

  it('setWasherModule with double (id 12) assigns layoutId 11 to both starting and adjacent slot', () => {
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 2, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().setWasherModule(1, 12)
    const modules = useWasmachinekastStore.getState().modules
    expect(modules[1].layoutId).toBe(11)
    expect(modules[2].layoutId).toBe(11)
    expect(modules[0].layoutId).toBeNull()
  })

  it('setWasherModule with double sets fixedWidth 65 on both slots', () => {
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().setWasherModule(0, 12)
    const modules = useWasmachinekastStore.getState().modules
    expect(modules[0].fixedWidth).toBe(65)
    expect(modules[1].fixedWidth).toBe(65)
  })

  it('clearWasherModule after double clears both slots', () => {
    useWasmachinekastStore.setState({
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().setWasherModule(0, 12)
    useWasmachinekastStore.getState().clearWasherModule()
    const modules = useWasmachinekastStore.getState().modules
    expect(modules[0].layoutId).toBeNull()
    expect(modules[1].layoutId).toBeNull()
  })
})

// ─── randomFill — washer slot preserved ──────────────────────────────────────

describe('randomFill — washer slot preserved', () => {
  beforeEach(resetStore)

  it('randomFill never changes layoutId of the module at washerSlotIndex', () => {
    useWasmachinekastStore.setState({
      moduleCount: 3,
      washerSlotIndex: 1,
      washerLayoutId: 99,
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

  it('randomFill still fills other slots', () => {
    useWasmachinekastStore.setState({
      moduleCount: 2,
      washerSlotIndex: 0,
      washerLayoutId: 99,
      modules: [
        { slotIndex: 0, layoutId: 99, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    useWasmachinekastStore.getState().randomFill()
    // slot 1 should have been filled (any layout from the layouts array)
    expect(useWasmachinekastStore.getState().modules[1].layoutId).not.toBeNull()
  })

  it('randomFill skips both slots when double washer (layoutId 12)', () => {
    useWasmachinekastStore.setState({
      moduleCount: 4,
      washerSlotIndex: 1,
      washerLayoutId: 12,
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: 11, hasDoor: true, span: 1 },
        { slotIndex: 2, layoutId: 11, hasDoor: true, span: 1 },
        { slotIndex: 3, layoutId: null, hasDoor: true, span: 1 },
      ],
      moduleLayouts: basePricingData.modules,
    })
    for (let i = 0; i < 20; i++) {
      useWasmachinekastStore.getState().randomFill()
      const modules = useWasmachinekastStore.getState().modules
      expect(modules[1].layoutId).toBe(11)
      expect(modules[2].layoutId).toBe(11)
    }
  })
})

// ─── setModuleCount — washer slot reset ──────────────────────────────────────

describe('setModuleCount — washer slot reset', () => {
  beforeEach(resetStore)

  it('reducing count so washerSlotIndex >= count clears washer and sets step to 2', () => {
    useWasmachinekastStore.setState({
      width: 120,
      moduleCount: 3,
      washerSlotIndex: 2,
      washerLayoutId: 99,
      step: 3,
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 2, layoutId: 99, hasDoor: true, span: 1 },
      ],
    })
    useWasmachinekastStore.getState().setModuleCount(2)
    const s = useWasmachinekastStore.getState()
    expect(s.washerSlotIndex).toBeNull()
    expect(s.washerLayoutId).toBeNull()
    expect(s.step).toBe(2)
  })

  it('reducing count that keeps washerSlotIndex valid does not clear washer', () => {
    useWasmachinekastStore.setState({
      width: 120,
      moduleCount: 3,
      washerSlotIndex: 0,
      washerLayoutId: 99,
      step: 3,
      modules: [
        { slotIndex: 0, layoutId: 99, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 2, layoutId: null, hasDoor: true, span: 1 },
      ],
    })
    useWasmachinekastStore.getState().setModuleCount(2)
    const s = useWasmachinekastStore.getState()
    expect(s.washerSlotIndex).toBe(0)
    expect(s.washerLayoutId).toBe(99)
  })

  it('reducing count removes second slot of double washer — clears and resets to step 2', () => {
    // double at slot 1 occupies slots 1+2; reducing to 2 modules makes slot 2 invalid
    useWasmachinekastStore.setState({
      width: 120,
      moduleCount: 3,
      washerSlotIndex: 1,
      washerLayoutId: 12,
      step: 3,
      modules: [
        { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: 11, hasDoor: true, span: 1 },
        { slotIndex: 2, layoutId: 11, hasDoor: true, span: 1 },
      ],
    })
    useWasmachinekastStore.getState().setModuleCount(2)
    const s = useWasmachinekastStore.getState()
    expect(s.washerSlotIndex).toBeNull()
    expect(s.washerLayoutId).toBeNull()
    expect(s.step).toBe(2)
    expect(s.modules[1].layoutId).toBeNull()
  })

  it('double washer at slot 0 survives reduction to exactly 2 modules', () => {
    useWasmachinekastStore.setState({
      width: 120,
      moduleCount: 3,
      washerSlotIndex: 0,
      washerLayoutId: 12,
      step: 3,
      modules: [
        { slotIndex: 0, layoutId: 11, hasDoor: true, span: 1 },
        { slotIndex: 1, layoutId: 11, hasDoor: true, span: 1 },
        { slotIndex: 2, layoutId: null, hasDoor: true, span: 1 },
      ],
    })
    useWasmachinekastStore.getState().setModuleCount(2)
    const s = useWasmachinekastStore.getState()
    expect(s.washerSlotIndex).toBe(0)
    expect(s.washerLayoutId).toBe(12)
  })
})

// ─── setWidth — washer slot reset ────────────────────────────────────────────

describe('setWidth — washer slot reset', () => {
  beforeEach(resetStore)

  it('setWidth forcing moduleCount reduction below washerSlotIndex+1 clears washer', () => {
    // 3 modules at width=120 (40cm each), washer at slot 2
    // shrink width to 60 → maxModules = floor(60/15)=4 but minModules=ceil(60/65)=1
    // actual: constraints minWidth=15 → maxModules=floor(60/15)=4, but we force to 2 via setModuleCount
    // Easier: set width=60, minW=30 → maxModules=floor(60/30)=2, washerSlotIndex=2 → clears
    useWasmachinekastStore.setState({
      width: 120,
      moduleCount: 3,
      washerSlotIndex: 2,
      washerLayoutId: 99,
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
    // width=60, maxModules=floor(60/30)=2 → setModuleCount(2) called internally → washerSlotIndex=2 >= 2 → clear
    useWasmachinekastStore.getState().setWidth(60)
    const s = useWasmachinekastStore.getState()
    expect(s.washerSlotIndex).toBeNull()
    expect(s.washerLayoutId).toBeNull()
    expect(s.step).toBe(2)
  })
})

// ─── restoreConfig — washer fields ───────────────────────────────────────────

describe('restoreConfig — washer fields', () => {
  beforeEach(resetStore)

  it('restores washerSlotIndex and washerLayoutId from snapshot', () => {
    const snap = { ...baseSnapshot, washerSlotIndex: 1, washerLayoutId: 99 }
    useWasmachinekastStore.getState().restoreConfig(snap)
    const s = useWasmachinekastStore.getState()
    expect(s.washerSlotIndex).toBe(1)
    expect(s.washerLayoutId).toBe(99)
  })

  it('does not restore washerSlotIndex that exceeds moduleCount', () => {
    // moduleCount=2, washerSlotIndex=5 → invalid, should default to null
    const snap = { ...baseSnapshot, moduleCount: 2, washerSlotIndex: 5, washerLayoutId: 99 }
    useWasmachinekastStore.getState().restoreConfig(snap)
    const s = useWasmachinekastStore.getState()
    expect(s.washerSlotIndex).toBeNull()
    expect(s.washerLayoutId).toBeNull()
  })

  it('defaults washerSlotIndex and washerLayoutId to null for old snapshots', () => {
    useWasmachinekastStore.getState().restoreConfig(baseSnapshot)
    const s = useWasmachinekastStore.getState()
    expect(s.washerSlotIndex).toBeNull()
    expect(s.washerLayoutId).toBeNull()
  })
})
