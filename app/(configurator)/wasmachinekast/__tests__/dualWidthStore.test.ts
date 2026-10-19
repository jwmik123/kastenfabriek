import { describe, it, expect, beforeEach } from 'vitest'
import { useWasmachinekastStore } from '../store'
import { WASHER_SINGLE, WASHER_WMOPEN } from '../moduleLayouts'
import type { ModuleLayout, PricingConstraints } from '@/types/configurator-pricing'
import type { BaseModuleSlot } from '../../_shared/store/types'

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

const store = () => useWasmachinekastStore.getState()
const slots = (n: number): BaseModuleSlot[] =>
  Array.from({ length: n }, (_, i) => ({ slotIndex: i, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false }))

/** Hoge kast links, lage kast rechts; 120 + 130 = 250 cm in total. */
function dual() {
  useWasmachinekastStore.setState(useWasmachinekastStore.getInitialState())
  useWasmachinekastStore.setState({
    constraints,
    moduleLayouts: [PLANKEN, WASHER_SINGLE, WASHER_WMOPEN],
  })
  store().applySectionsState({
    layout: 'low-right',
    highSection: { width: 120, height: 240, moduleCount: 2, modules: slots(2) },
    lowSection: { width: 130, height: 90, moduleCount: 2, modules: slots(2) },
  })
}

const total = () => store().width + (store().lowSection?.width ?? 0)
const lowWidth = () => store().lowSection?.width ?? 0
const LOW_WASHER = 23 // WASHER_WMOPEN: under the werkblad, 68.6 cm
const HIGH_WASHER = 11 // WASHER_SINGLE

describe('breedte lage kast — hoge + lage opstelling', () => {
  beforeEach(() => dual())

  it('keeps both widths when the layout is chosen', () => {
    expect(total()).toBeCloseTo(250, 6)
    expect(lowWidth()).toBeCloseTo(130, 6)
  })

  it('sets the lage kast to the chosen width; the hoge kast takes the rest', () => {
    store().setLowSectionWidth(160)
    expect(lowWidth()).toBeCloseTo(160, 6)
    expect(store().width).toBeCloseTo(90, 6)
  })

  it('removing a vak keeps the lage kast as wide as chosen', () => {
    store().setLowSectionWidth(160)
    store().setLowSectionModuleCount(4)
    const before = store().lowSection!.moduleCount
    store().setLowSectionModuleCount(before - 1)
    expect(store().lowSection!.moduleCount).toBe(before - 1)
    expect(lowWidth()).toBeCloseTo(160, 6)
    expect(total()).toBeCloseTo(250, 6)
  })

  it('stops removing vakken once they would get wider than allowed', () => {
    store().setLowSectionWidth(160)
    // 160 − 1.8 seam panel = 158.2 cm: three vakken of 52.7, two would be 79.1 > 65.
    expect(store().minModulesFor('low')).toBe(3)
    store().setLowSectionModuleCount(1)
    expect(store().lowSection!.moduleCount).toBe(3)
    expect(lowWidth()).toBeCloseTo(160, 6)
  })

  it('stops adding vakken once they would get narrower than allowed', () => {
    store().setLowSectionWidth(160)
    expect(store().maxModulesFor('low')).toBe(5) // 158.2 / 30
    store().setLowSectionModuleCount(9)
    expect(store().lowSection!.moduleCount).toBe(5)
    expect(lowWidth()).toBeCloseTo(160, 6)
  })

  it('changing the hoge kast vakken leaves both widths alone', () => {
    store().setModuleCount(3)
    expect(lowWidth()).toBeCloseTo(130, 6)
    expect(store().width).toBeCloseTo(120, 6)
  })

  it('a wider total goes to the hoge kast; the lage kast keeps its width', () => {
    store().setTotalWidth(300)
    expect(lowWidth()).toBeCloseTo(130, 6)
    expect(store().width).toBeCloseTo(170, 6)
  })

  it('a narrower total narrows the lage kast once the hoge kast is at its minimum', () => {
    store().setTotalWidth(100)
    // Hoge kast: side panels + one vak.
    expect(store().width).toBeCloseTo(3.6 + 30, 6)
    expect(lowWidth()).toBeCloseTo(100 - 33.6, 6)
  })

  it('caps the lage-kast width so the hoge kast keeps one vak', () => {
    store().setLowSectionWidth(500)
    expect(store().width).toBeCloseTo(3.6 + 30, 6)
    expect(total()).toBeCloseTo(250, 6)
  })

  it('a machine wider than the lage kast widens it, taken from the hoge kast', () => {
    store().setLowSectionWidth(40)
    store().addWasherModule(0, LOW_WASHER, 'low')
    expect(store().washerModules).toHaveLength(1)
    expect(lowWidth()).toBeCloseTo(1.8 + 68.6, 6)
    expect(total()).toBeCloseTo(250, 6)
  })

  it('removing a machine keeps the lage kast as wide as it was', () => {
    store().setLowSectionWidth(160)
    store().addWasherModule(0, LOW_WASHER, 'low')
    store().removeWasherModule(0, 'low')
    expect(lowWidth()).toBeCloseTo(160, 6)
  })

  it('refuses a machine the total width cannot hold', () => {
    store().setTotalWidth(90)
    expect(store().canPlaceWasher(0, LOW_WASHER, 'low')).toBe(false)
    store().addWasherModule(0, LOW_WASHER, 'low')
    expect(store().washerModules).toHaveLength(0)
  })

  it('never lets the total drop below what the parts need', () => {
    store().setTotalWidth(50)
    expect(total()).toBeCloseTo(3.6 + 30 + 1.8 + 30, 6)
  })

  it('keeps the total when the side panels get thicker', () => {
    store().addWasherModule(0, LOW_WASHER, 'low')
    store().setSidePanelThickness('36mm')
    expect(total()).toBeCloseTo(250, 6)
  })

  it('exposes the range for each slider', () => {
    store().addWasherModule(0, HIGH_WASHER, 'high')
    const low = store().partWidthRange('low')!
    expect(low.min).toBeCloseTo(1.8 + 30, 6)
    expect(low.max).toBeCloseTo(250 - (3.6 + 68.6), 6)
    const high = store().partWidthRange('high')!
    expect(high.min).toBeCloseTo(3.6 + 68.6, 6)
    expect(high.max).toBeCloseTo(250 - (1.8 + 30), 6)
  })

  it('sets the hoge kast to the chosen width; the lage kast takes the rest', () => {
    store().setHighSectionWidth(150)
    expect(store().width).toBeCloseTo(150, 6)
    expect(lowWidth()).toBeCloseTo(100, 6)
    expect(total()).toBeCloseTo(250, 6)
  })

  it('removing a hoge-kast vak keeps the hoge kast as wide as chosen', () => {
    store().setHighSectionWidth(150)
    store().setModuleCount(4)
    store().setModuleCount(3)
    expect(store().moduleCount).toBe(3)
    expect(store().width).toBeCloseTo(150, 6)
  })

  it('caps the hoge-kast width so the lage kast keeps one vak', () => {
    store().setHighSectionWidth(500)
    expect(lowWidth()).toBeCloseTo(1.8 + 30, 6)
    expect(total()).toBeCloseTo(250, 6)
  })
})

describe('breedte lage kast — opgeslagen configuraties', () => {
  it('restores the saved widths as they were', () => {
    dual()
    const snapshot = {
      id: 'x',
      capturedAt: '2026-01-01T00:00:00Z',
      productType: 'wasmachinekast' as const,
      widthCm: 72.2,
      heightCm: 240,
      depthCm: 80,
      moduleCount: 1,
      modules: [{ slotIndex: 0, layoutId: HIGH_WASHER, layoutName: null, layoutDescription: null, hasDoor: true, span: 1 as const }],
      washerModules: [{ slotIndex: 0, layoutId: HIGH_WASHER, section: 'high' as const }],
      layout: 'low-right' as const,
      lowSection: {
        width: 180,
        height: 90,
        moduleCount: 3,
        modules: slots(3).map((m) => ({ ...m, layoutName: null, layoutDescription: null })),
        topPanelThicknessMm: 18 as const,
        countertopMaterialId: 'white',
      },
      buitenkantMaterialId: 'white',
      binnenkantMaterialId: 'white',
      doorHandleId: 'none',
      diagonalSide: 'none' as const,
      leftDiagStartHeight: 0,
      rightDiagStartHeight: 0,
      leftDiagTopWidth: 0,
      rightDiagTopWidth: 0,
      lightStripsEnabled: false,
      hasTopCabinet: false,
      topCabinetHeightCm: 0,
    }
    store().restoreConfig(snapshot)
    expect(store().width).toBeCloseTo(72.2, 6)
    expect(lowWidth()).toBeCloseTo(180, 6)
  })
})
