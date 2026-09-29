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
function dual(preference: 'high' | 'low' = 'high') {
  useWasmachinekastStore.setState(useWasmachinekastStore.getInitialState())
  useWasmachinekastStore.setState({
    constraints,
    moduleLayouts: [PLANKEN, WASHER_SINGLE, WASHER_WMOPEN],
    restPreference: preference,
  })
  store().applySectionsState({
    layout: 'low-right',
    highSection: { width: 120, height: 240, moduleCount: 2, modules: slots(2) },
    lowSection: { width: 130, height: 90, moduleCount: 2, modules: slots(2) },
  })
}

const total = () => store().width + (store().lowSection?.width ?? 0)
const LOW_WASHER = 23 // WASHER_WMOPEN: under the werkblad
const HIGH_WASHER = 11 // WASHER_SINGLE

describe('restruimte — hoge + lage opstelling', () => {
  beforeEach(() => dual())

  it('keeps the total width when the layout is chosen', () => {
    expect(total()).toBeCloseTo(250, 6)
    // Rest to the high part: the low part holds its two vakken at minimum width.
    expect(store().lowSection?.width).toBeCloseTo(1.8 + 2 * 30, 6)
  })

  it('fits the low part around its washer and gives the rest to the high part', () => {
    store().addWasherModule(0, LOW_WASHER, 'low')
    store().setLowSectionModuleCount(1) // drop the spare vak next to the machine
    const s = store()
    expect(s.lowSection?.width).toBeCloseTo(1.8 + 68.6, 6)
    expect(s.width).toBeCloseTo(250 - 70.4, 6)
    expect(s.fillerPanel('low')).toBeNull()
    expect(total()).toBeCloseTo(250, 6)
  })

  it('moves the rest to the low part when the customer asks for that', () => {
    store().addWasherModule(0, HIGH_WASHER, 'high')
    store().setRestPreference('low')
    store().setModuleCount(1) // just the washer in the high part
    const s = store()
    expect(s.width).toBeCloseTo(3.6 + 68.6, 6)
    expect(s.lowSection?.width).toBeCloseTo(250 - 72.2, 6)
    expect(s.lowSection!.moduleCount).toBeGreaterThanOrEqual(3)
  })

  it('lets the tight part grow by a vak, taken from the rest', () => {
    store().addWasherModule(0, LOW_WASHER, 'low')
    store().setLowSectionModuleCount(1)
    expect(store().maxModulesFor('low')).toBeGreaterThan(1)
    store().setLowSectionModuleCount(2)
    expect(store().lowSection?.width).toBeCloseTo(1.8 + 68.6 + 30, 6)
    expect(total()).toBeCloseTo(250, 6)
  })

  it('gives the width back when the washer goes', () => {
    store().addWasherModule(0, LOW_WASHER, 'low')
    store().removeWasherModule(0, 'low')
    expect(store().lowSection?.width).toBeCloseTo(1.8 + 2 * 30, 6)
    expect(total()).toBeCloseTo(250, 6)
  })

  it('refuses a machine the total width cannot hold', () => {
    store().setTotalWidth(100)
    // high: 3.6 + 30, low: 1.8 + 2 × 30 → 95.4; a washer in the low part needs 38.6 more
    expect(store().canPlaceWasher(0, LOW_WASHER, 'low')).toBe(false)
    store().addWasherModule(0, LOW_WASHER, 'low')
    expect(store().washerModules).toHaveLength(0)
  })

  it('never lets the total drop below what the parts need', () => {
    store().setTotalWidth(50)
    // High (gets the rest): side panels + one vak. Low: side panel + its two vakken.
    expect(total()).toBeCloseTo(3.6 + 30 + 1.8 + 60, 6)
    expect(store().moduleCount).toBe(1)
  })

  it('keeps the total when the side panels get thicker', () => {
    store().addWasherModule(0, LOW_WASHER, 'low')
    store().setSidePanelThickness('36mm')
    expect(total()).toBeCloseTo(250, 6)
  })
})

describe('restruimte — opgeslagen configuraties', () => {
  it('reads the preference off an older snapshot without the answer', () => {
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
    expect(store().restPreference).toBe('low')
    expect(store().width).toBeCloseTo(72.2, 6)
    expect(store().lowSection?.width).toBeCloseTo(180, 6)
  })
})
