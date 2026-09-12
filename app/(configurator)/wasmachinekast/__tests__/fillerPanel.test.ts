import { describe, it, expect, beforeEach } from 'vitest'
import { useWasmachinekastStore } from '../store'
import { WASHER_SINGLE, WASHER_WMOPEN } from '../moduleLayouts'
import type { ModuleLayout, PricingConstraints } from '@/types/configurator-pricing'

const constraints: PricingConstraints = {
  singleCorpus: { minWidth: 30, maxWidth: 65, minHeight: 200, maxHeight: 275, minDepth: 30, maxDepth: 90 },
  doubleCorpus: { minWidth: 65, maxWidth: 120, minHeight: 200, maxHeight: 275, minDepth: 15, maxDepth: 90 },
  topCabinet: { maxHeight: 110 },
  maxTotalWidth: 820,
}

const PLANKEN: ModuleLayout = {
  layoutId: 1,
  name: 'Planken',
  description: '',
  contents: { shelves: 3, rods: 0, drawers: 0 },
  priceDouble: 0,
  priceSingle: 0,
  availableForTopCabinet: true,
  sectionType: 'both',
}

function reset() {
  useWasmachinekastStore.setState(useWasmachinekastStore.getInitialState())
  useWasmachinekastStore.setState({
    constraints,
    moduleLayouts: [PLANKEN, WASHER_SINGLE, WASHER_WMOPEN],
  })
}

const store = () => useWasmachinekastStore.getState()

describe('afwerkpaneel — two machines in a cabinet too narrow for a third module', () => {
  beforeEach(reset)

  it('places the second machine and closes the rest with a panel', () => {
    store().setWidth(150)
    store().addWasherModule(0, 11, 'high')
    expect(store().canPlaceWasher(1, 11, 'high')).toBe(true)
    store().addWasherModule(1, 11, 'high')

    const s = store()
    expect(s.washerModules.map((w) => w.slotIndex)).toEqual([0, 1])
    expect(s.moduleCount).toBe(2)
    expect(s.modules.map((m) => m.fixedWidth)).toEqual([68.6, 68.6])
    // 150 − 2 × 1.8 side panels − 2 × 68.6
    expect(s.fillerPanel('high')).toEqual({ side: 'right', widthCm: expect.closeTo(9.2, 5) })
  })

  it('lets the customer pick the side of the panel', () => {
    store().setWidth(150)
    store().addWasherModule(0, 11, 'high')
    store().addWasherModule(1, 11, 'high')
    store().setFillerPanelSide('high', 'left')
    expect(store().fillerPanel('high')?.side).toBe('left')
    expect(store().fillerPanel('low')).toBeNull()
  })

  it('shifts the second machine left when the empty vak between them goes', () => {
    store().setWidth(150) // 3 slots
    store().addWasherModule(0, 11, 'high')
    store().addWasherModule(2, 11, 'high')
    const s = store()
    expect(s.moduleCount).toBe(2)
    expect(s.washerModules.map((w) => w.slotIndex).sort()).toEqual([0, 1])
    expect(s.modules[1].layoutId).toBe(11)
    expect(s.washerModuleCountNotice).toBe(2)
  })

  it('swaps the panel for a module once the cabinet is wide enough', () => {
    store().setWidth(150)
    store().addWasherModule(0, 11, 'high')
    store().addWasherModule(1, 11, 'high')
    store().setWidth(180)
    const s = store()
    expect(s.fillerPanel('high')).toBeNull()
    expect(s.moduleCount).toBe(3)
    expect(s.modules[2].layoutId).toBeNull()
    expect(s.washerModules).toHaveLength(2)
  })

  it('never leaves a zero-width module when the cabinet shrinks', () => {
    store().setWidth(200)
    store().addWasherModule(0, 11, 'high')
    store().addWasherModule(1, 11, 'high')
    store().setWidth(145)
    const s = store()
    expect(s.moduleCount).toBe(2)
    expect(s.washerModules).toHaveLength(2)
    expect(s.fillerPanel('high')?.widthCm).toBeCloseTo(145 - 3.6 - 137.2, 5)
  })

  it('drops the last machine when even the machines no longer fit', () => {
    store().setWidth(150)
    store().addWasherModule(0, 11, 'high')
    store().addWasherModule(1, 11, 'high')
    store().setWidth(120)
    const s = store()
    expect(s.washerModules.map((w) => w.slotIndex)).toEqual([0])
    expect(s.modules.filter((m) => m.fixedWidth)).toHaveLength(1)
  })

  it('places a single machine in a cabinet narrower than machine plus module', () => {
    store().setWidth(80)
    expect(store().canPlaceWasher(0, 11, 'high')).toBe(true)
    store().addWasherModule(0, 11, 'high')
    const s = store()
    expect(s.moduleCount).toBe(1)
    expect(s.fillerPanel('high')?.widthCm).toBeCloseTo(80 - 3.6 - 68.6, 5)
  })

  it('refuses a machine that overflows the cabinet', () => {
    store().setWidth(70)
    expect(store().canPlaceWasher(0, 11, 'high')).toBe(false)
  })

  it('accounts for 36 mm side panels', () => {
    store().setWidth(150)
    store().addWasherModule(0, 11, 'high')
    store().addWasherModule(1, 11, 'high')
    store().setSidePanelThickness('36mm')
    expect(store().fillerPanel('high')?.widthCm).toBeCloseTo(150 - 7.2 - 137.2, 5)
  })

  it('keeps the low section of a dual cabinet on its own panel', () => {
    store().setWidth(200)
    store().applySectionsState({
      layout: 'low-right',
      highSection: { width: 200, height: 240, moduleCount: 3, modules: store().modules },
      lowSection: {
        width: 150,
        height: 90,
        moduleCount: 3,
        modules: [0, 1, 2].map((i) => ({ slotIndex: i, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false })),
      },
    })
    store().addWasherModule(0, 23, 'low')
    store().addWasherModule(1, 23, 'low')
    const s = store()
    expect(s.lowSection?.moduleCount).toBe(2)
    // The low section shares the seam panel: one 18 mm wall of its own.
    expect(s.fillerPanel('low')?.widthCm).toBeCloseTo(150 - 1.8 - 137.2, 5)
    expect(s.fillerPanel('high')).toBeNull()
  })
})

describe('afwerkpaneel — saved configurations', () => {
  beforeEach(reset)

  it('restores the chosen side and derives the panel again', () => {
    store().setWidth(150)
    store().addWasherModule(0, 11, 'high')
    store().addWasherModule(1, 11, 'high')
    store().setFillerPanelSide('high', 'left')
    const s = store()
    const snapshot = {
      id: 'x',
      capturedAt: '2026-01-01T00:00:00.000Z',
      productType: 'wasmachinekast' as const,
      widthCm: s.width,
      heightCm: s.height,
      depthCm: s.depth,
      moduleCount: s.moduleCount,
      modules: s.modules.map((m) => ({ ...m, layoutName: null })),
      layout: s.layout,
      washerModules: s.washerModules,
      fillerPanel: s.fillerPanel('high'),
      buitenkantMaterialId: 'premium-wit',
      binnenkantMaterialId: 'premium-wit',
      doorHandleId: '23',
      diagonalSide: 'none' as const,
      leftDiagStartHeight: 0,
      rightDiagStartHeight: 0,
      leftDiagTopWidth: 0,
      rightDiagTopWidth: 0,
      lightStripsEnabled: false,
      hasTopCabinet: false,
      topCabinetHeightCm: 0,
    }
    reset()
    store().restoreConfig(snapshot)
    expect(store().fillerPanel('high')).toEqual({ side: 'left', widthCm: expect.closeTo(9.2, 5) })
    expect(store().moduleCount).toBe(2)
  })

  it('defaults the side to right on snapshots without a panel', () => {
    store().restoreConfig({
      id: 'x',
      capturedAt: '2026-01-01T00:00:00.000Z',
      widthCm: 120,
      heightCm: 240,
      depthCm: 85,
      moduleCount: 2,
      modules: [0, 1].map((i) => ({ slotIndex: i, layoutId: null, layoutName: null, hasDoor: true, span: 1 as const })),
      buitenkantMaterialId: 'premium-wit',
      binnenkantMaterialId: 'premium-wit',
      doorHandleId: '23',
      diagonalSide: 'none',
      leftDiagStartHeight: 0,
      rightDiagStartHeight: 0,
      leftDiagTopWidth: 0,
      rightDiagTopWidth: 0,
      lightStripsEnabled: false,
      hasTopCabinet: false,
      topCabinetHeightCm: 0,
    })
    expect(store().fillerPanelSide).toEqual({ high: 'right', low: 'right' })
    expect(store().fillerPanel('high')).toBeNull()
  })
})

describe('machines are cleaned up on every path that narrows a section', () => {
  beforeEach(reset)

  function twoMachinesAt(width: number) {
    store().setWidth(width)
    store().addWasherModule(0, 11, 'high')
    store().addWasherModule(1, 11, 'high')
  }

  it('drops both machines when the cabinet gets too narrow for even one', () => {
    twoMachinesAt(150)
    store().setWidth(60)
    const s = store()
    expect(s.washerModules).toHaveLength(0)
    expect(s.modules.every((m) => m.fixedWidth === undefined && m.layoutId === null)).toBe(true)
    expect(s.moduleCount).toBe(1)
  })

  it('never renders a slot narrower than its fixed width after narrowing', () => {
    twoMachinesAt(200)
    for (const w of [180, 160, 145, 130, 110, 95, 80, 70, 60, 40]) {
      store().setWidth(w)
      const s = store()
      const inner = w - 3.6
      const fixed = s.modules.reduce((sum, m) => sum + (m.fixedWidth ?? 0), 0)
      expect(fixed).toBeLessThanOrEqual(inner + 1e-6)
      const variable = s.modules.filter((m) => !m.fixedWidth).length
      if (variable > 0) expect((inner - fixed) / variable).toBeGreaterThanOrEqual(30 - 1e-6)
      expect(s.washerModules.every((p) => s.modules[p.slotIndex]?.layoutId === 11)).toBe(true)
    }
  })

  it('thicker side panels can push the last machine out', () => {
    twoMachinesAt(141) // 137.4 inner: both fit with 0.2 cm over
    store().setSidePanelThickness('36mm') // 133.8 inner: they no longer do
    expect(store().washerModules).toHaveLength(1)
  })

  it('cleans up the low section when its own width shrinks', () => {
    store().setWidth(200)
    store().applySectionsState({
      layout: 'low-right',
      highSection: { width: 200, height: 240, moduleCount: 3, modules: store().modules },
      lowSection: {
        width: 160,
        height: 90,
        moduleCount: 3,
        modules: [0, 1, 2].map((i) => ({ slotIndex: i, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false })),
      },
    })
    store().addWasherModule(0, 23, 'low')
    store().addWasherModule(1, 23, 'low')
    expect(store().washerModules.filter((w) => w.section === 'low')).toHaveLength(2)
    store().setLowSectionWidth(100)
    const s = store()
    expect(s.washerModules.filter((w) => w.section === 'low')).toHaveLength(1)
    expect(s.lowSection?.modules.filter((m) => m.fixedWidth)).toHaveLength(1)
    expect(s.lowSection?.moduleCount).toBe(s.lowSection?.modules.length)
  })

  it('cleans up machines that no longer fit after a layout switch', () => {
    // A 150 cm low-only cabinet with two machines becomes a dual cabinet whose
    // low section is narrower than the two machines.
    store().applySectionsState({
      layout: 'low-only',
      highSection: null,
      lowSection: {
        width: 150,
        height: 90,
        moduleCount: 2,
        modules: [0, 1].map((i) => ({ slotIndex: i, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false })),
      },
    })
    store().addWasherModule(0, 23, 'low')
    store().addWasherModule(1, 23, 'low')
    // In low-only the top-level fields hold the low section (LayoutStep's
    // buildSectionsState reads them the same way).
    const low = {
      width: store().width,
      height: store().height,
      moduleCount: store().moduleCount,
      modules: store().modules,
    }
    store().applySectionsState({
      layout: 'low-left',
      highSection: { width: 120, height: 240, moduleCount: 2, modules: [0, 1].map((i) => ({ slotIndex: i, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false })) },
      lowSection: { ...low, width: 100 },
    })
    const s = store()
    expect(s.washerModules.filter((w) => w.section === 'low')).toHaveLength(1)
    expect(s.lowSection?.modules.filter((m) => m.fixedWidth)).toHaveLength(1)
  })

  it('keeps the module range sane at the narrowest width', () => {
    store().setWidth(30)
    expect(store().minModules()).toBe(1)
    expect(store().maxModules()).toBe(1)
  })

  it('will not count the machines away with the module stepper', () => {
    twoMachinesAt(150)
    store().setModuleCount(1)
    expect(store().moduleCount).toBe(2)
    expect(store().washerModules).toHaveLength(2)
  })
})
