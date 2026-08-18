import { describe, it, expect } from 'vitest'
import { buildWasmConfigSnapshot, resolveHandleName, type WasmSnapshotInput } from '../wasmSnapshot'
import { restore } from '../sections/wasmSnapshotMigration'
import type { ModuleLayout } from '@/types/configurator-pricing'
import type { BaseModuleSlot } from '../../_shared/store/types'

const layouts: ModuleLayout[] = [
  {
    layoutId: 1,
    name: 'Planken',
    description: '',
    contents: { shelves: 4, rods: 0, drawers: 0 },
    priceDouble: 0,
    priceSingle: 0,
    availableForTopCabinet: true,
  },
  {
    layoutId: 11,
    name: 'Wasmachine (enkel)',
    description: '',
    contents: { shelves: 0, rods: 0, drawers: 0 },
    priceDouble: 0,
    priceSingle: 0,
    availableForTopCabinet: false,
    minSlotWidth: 65,
  },
]

const slot = (i: number, o: Partial<BaseModuleSlot> = {}): BaseModuleSlot => ({
  slotIndex: i,
  layoutId: 1,
  hasDoor: true,
  span: 1,
  hasPowerHole: false,
  ...o,
})

const input = (o: Partial<WasmSnapshotInput> = {}): WasmSnapshotInput => ({
  id: 'item-1',
  width: 150,
  height: 240,
  depth: 85,
  moduleCount: 2,
  modules: [slot(0), slot(1)],
  moduleLayouts: layouts,
  layout: 'high-only',
  lowSection: null,
  washerModules: [],
  topPanelThicknessMm: 18,
  countertopMaterialId: undefined,
  buitenkantMaterialId: 'zwart',
  binnenkantMaterialId: 'premium-wit',
  doorHandleId: 'greep',
  doorHandleName: 'Greep',
  drawerHandleId: 'none',
  drawerHandleName: 'Greeploos (push-to-open)',
  doorHandleMaterial: 'chrome',
  doorsExtendToFloor: false,
  lightStripsEnabled: false,
  sidePanelThickness: '18mm',
  placementType: 'ingebouwd',
  hasTopCabinet: false,
  topCabinetHeightCm: 0,
  ...o,
})

const dual = () =>
  input({
    layout: 'low-left',
    washerModules: [{ slotIndex: 0, layoutId: 11, section: 'low' }],
    // The store keeps the worktop settings at the top level, not on the section.
    topPanelThicknessMm: 36,
    countertopMaterialId: 'h1199-thermo-eik',
    lowSection: {
      width: 120,
      height: 90,
      moduleCount: 2,
      modules: [
        slot(0, { layoutId: 11, fixedWidth: 65, pushToOpen: true }),
        slot(1, { hasPowerHole: true }),
      ],
    },
  })

describe('buildWasmConfigSnapshot', () => {
  it('stamps the product type so downstream never has to guess', () => {
    expect(buildWasmConfigSnapshot(input()).productType).toBe('wasmachinekast')
  })

  it('keeps the washer placements — losing these wiped washers on re-edit', () => {
    const snap = buildWasmConfigSnapshot(dual())
    expect(snap.washerModules).toEqual([{ slotIndex: 0, layoutId: 11, section: 'low' }])
  })

  it('keeps fixed slot widths and the layout contents', () => {
    const snap = buildWasmConfigSnapshot(dual())
    expect(snap.lowSection!.modules[0].fixedWidth).toBe(65)
    expect(snap.modules[0].layoutContents).toEqual({ shelves: 4, rods: 0, drawers: 0 })
  })

  it('writes both sections for a dual layout', () => {
    const snap = buildWasmConfigSnapshot(dual())
    expect(snap.widthCm).toBe(150)
    expect(snap.lowSection).toMatchObject({
      width: 120,
      height: 90,
      moduleCount: 2,
      topPanelThicknessMm: 36,
      countertopMaterialId: 'h1199-thermo-eik',
    })
  })

  it('mirrors the top level into lowSection for low-only', () => {
    const snap = buildWasmConfigSnapshot(
      input({ layout: 'low-only', height: 90, lowSection: null }),
    )
    expect(snap.lowSection).toMatchObject({ width: 150, height: 90, moduleCount: 2 })
  })

  it('omits lowSection when there is none', () => {
    expect(buildWasmConfigSnapshot(input()).lowSection).toBeUndefined()
  })

  it('falls back to the carcass material when no countertop was picked', () => {
    const snap = buildWasmConfigSnapshot(input({ layout: 'low-only', height: 90 }))
    expect(snap.lowSection!.countertopMaterialId).toBe('zwart')
  })

  it('records the placement the customer chose', () => {
    expect(buildWasmConfigSnapshot(input({ placementType: 'vrijstaand' })).placementType).toBe(
      'vrijstaand',
    )
  })

  it('round-trips through the store restore path', () => {
    const snap = buildWasmConfigSnapshot(dual())
    const migrated = restore({
      layout: snap.layout,
      widthCm: snap.widthCm,
      heightCm: snap.heightCm,
      moduleCount: snap.moduleCount,
      modules: snap.modules,
      depthCm: snap.depthCm,
      washerModules: snap.washerModules,
      lowSection: snap.lowSection,
      washerSection: snap.washerSection,
    })
    expect(migrated.layout).toBe('low-left')
    expect(migrated.highSection?.moduleCount).toBe(2)
    expect(migrated.lowSection?.moduleCount).toBe(2)
    expect(migrated.washerModules).toEqual([{ slotIndex: 0, layoutId: 11, section: 'low' }])
  })
})

describe('resolveHandleName', () => {
  it('names the greeploos option itself', () => {
    expect(resolveHandleName('none', [])).toBe('Greeploos (push-to-open)')
  })

  it('prefers the Dutch name', () => {
    expect(
      resolveHandleName('h1', [{ id: 'h1', name: 'Straight handle', nameNl: 'Rechte greep' }]),
    ).toBe('Rechte greep')
  })

  it('falls back to the English name, then to null', () => {
    expect(resolveHandleName('h1', [{ id: 'h1', name: 'Straight handle' }])).toBe('Straight handle')
    expect(resolveHandleName('h1', [])).toBeNull()
  })
})
