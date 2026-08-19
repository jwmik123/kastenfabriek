import { describe, it, expect } from 'vitest'
import { buildWasmSpecs } from '../components/WasmMeasurements'
import { buildWireframe } from '@/lib/order/wireframe'
import type { BaseModuleSlot } from '../../_shared/store/types'
import type { ClosetConfigSnapshot, ModuleSlotSnapshot } from '@/lib/cart/types'

const slot = (i: number, o: Partial<BaseModuleSlot> = {}): BaseModuleSlot => ({
  slotIndex: i,
  layoutId: 1,
  hasDoor: true,
  span: 1,
  hasPowerHole: false,
  ...o,
})

/** Module clear widths, in the order the overlay draws them. */
const widths = (specs: ReturnType<typeof buildWasmSpecs>) =>
  specs.filter((s) => s.id.startsWith('module-width-')).map((s) => String(s.label))

describe('buildWasmSpecs', () => {
  const high = {
    kind: 'high' as const,
    widthCm: 281,
    heightCm: 240,
    xOffsetM: -1.305,
    modules: [
      slot(0, { fixedWidth: 68.6 }),
      slot(1, { fixedWidth: 68.6 }),
      slot(2),
      slot(3),
      slot(4),
    ],
  }
  const low = {
    kind: 'low' as const,
    widthCm: 261,
    heightCm: 90,
    xOffsetM: 1.405,
    modules: [slot(0), slot(1), slot(2), slot(3, { fixedWidth: 68.6 }), slot(4)],
  }

  it('reads the chosen panel thickness, not a fixed 18 mm', () => {
    const at18 = widths(buildWasmSpecs([high], 85, 0.018))
    const at36 = widths(buildWasmSpecs([high], 85, 0.036))
    // A washer slot is fixed, so only the variable slots change.
    expect(at18[0]).toBe(at36[0])
    expect(at18[2]).not.toBe(at36[2])
    expect(at36[2]).toBe('41.9')
  })

  it('gives the low section the panel it shares with the high one', () => {
    const own = widths(buildWasmSpecs([{ ...low }], 85, 0.036))
    const shared = widths(
      buildWasmSpecs([{ ...low, sharedSideWall: 'left' }], 85, 0.036),
    )
    expect(own[0]).toBe('42.7')
    expect(shared[0]).toBe('43.6')
  })

  it('starts the first module at the section interior edge', () => {
    const [first] = buildWasmSpecs([{ ...low, sharedSideWall: 'left' }], 85, 0.036).filter(
      (s) => s.id === 'module-width-low-0',
    )
    // Section spans [xOffset − w/2, …]; with no left panel the interior starts
    // at the section edge and the module wall is the only inset.
    expect(first.p1.x).toBeCloseTo(1.405 - 2.61 / 2 + 0.018, 4)
  })
})

describe('the configurator and the spec PDF report the same widths', () => {
  const mod = (i: number, o: Partial<ModuleSlotSnapshot> = {}): ModuleSlotSnapshot => ({
    slotIndex: i,
    layoutId: 1,
    layoutName: 'Module',
    hasDoor: true,
    span: 1,
    hasPowerHole: false,
    ...o,
  })

  /** ORD-20260819-WYS1. */
  const snapshot: ClosetConfigSnapshot = {
    id: 'x',
    capturedAt: '2026-01-01T00:00:00Z',
    productType: 'wasmachinekast',
    sidePanelThickness: '36mm',
    layout: 'low-right',
    widthCm: 281,
    heightCm: 240,
    depthCm: 85,
    moduleCount: 5,
    modules: [
      mod(0, { fixedWidth: 68.6 }),
      mod(1, { fixedWidth: 68.6 }),
      mod(2),
      mod(3),
      mod(4),
    ],
    lowSection: {
      width: 261,
      height: 90,
      moduleCount: 5,
      topPanelThicknessMm: 36,
      countertopMaterialId: 'zwart',
      modules: [mod(0), mod(1), mod(2), mod(3, { fixedWidth: 68.6 }), mod(4)],
    },
    buitenkantMaterialId: 'zwart',
    binnenkantMaterialId: 'premium-wit',
    doorHandleId: 'none',
    diagonalSide: 'none',
    leftDiagStartHeight: 0,
    rightDiagStartHeight: 0,
    leftDiagTopWidth: 0,
    rightDiagTopWidth: 0,
    placementType: 'ingebouwd',
    lightStripsEnabled: false,
    hasTopCabinet: false,
    topCabinetHeightCm: 0,
  }

  it('agrees module for module', () => {
    const overlay = widths(
      buildWasmSpecs(
        [
          { ...({ kind: 'high', widthCm: 281, heightCm: 240, xOffsetM: -1.305 } as const), modules: snapshot.modules.map((m, i) => slot(i, { fixedWidth: m.fixedWidth })) },
          {
            ...({ kind: 'low', widthCm: 261, heightCm: 90, xOffsetM: 1.405, sharedSideWall: 'left' } as const),
            modules: snapshot.lowSection!.modules.map((m, i) => slot(i, { fixedWidth: m.fixedWidth })),
          },
        ],
        85,
        0.036,
      ),
    )
    const drawn = buildWireframe(snapshot)
      .labels.filter((l) => !l.text.includes('cm'))
      .map((l) => l.text)

    // The overlay keeps a trailing zero where the drawing drops it.
    expect(overlay.map((w) => String(Number(w)))).toEqual(drawn)
  })
})
