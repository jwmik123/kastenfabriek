import { describe, it, expect } from 'vitest'
import { countDrawerFronts, hasDrawerFronts } from '../drawerFronts'
import type { Section } from '../types'
import type { BaseModuleSlot } from '../../../_shared/store/types'

function slot(layoutId: number | null, extra: Partial<BaseModuleSlot> = {}): BaseModuleSlot {
  return { slotIndex: 0, layoutId, hasDoor: true, span: 1, ...extra }
}

function lowSection(modules: BaseModuleSlot[]): Section {
  return { width: 200, height: 90, moduleCount: modules.length, modules }
}

describe('countDrawerFronts — lage kast fronts', () => {
  it('counts the fronts of layouts 20/21/22 in the low section', () => {
    const count = countDrawerFronts({
      layout: 'low-only',
      // 20 = plank (2 fronts), 21 = enkel vak (1), 22 = dubbel vak (2)
      topLevelModules: [slot(20), slot(21), slot(22)],
      lowSection: null,
    })
    expect(count).toBe(5)
  })

  it('counts them in the low section of a dual cabinet', () => {
    const count = countDrawerFronts({
      layout: 'low-left',
      topLevelModules: [slot(1)],
      lowSection: lowSection([slot(21)]),
    })
    expect(count).toBe(1)
  })

  it('ignores a shared layout that keeps a deurtje', () => {
    const count = countDrawerFronts({
      layout: 'low-only',
      topLevelModules: [slot(2)],
      lowSection: null,
    })
    expect(count).toBe(0)
  })
})

describe('countDrawerFronts — drawers under a washing machine', () => {
  it('counts the drawers of the high-section machine modules', () => {
    const count = countDrawerFronts({
      layout: 'high-only',
      // 11 = 1 lade, 13 = 2 lades, 14 = plank met lade (2 fronts)
      topLevelModules: [slot(11), slot(13), slot(14)],
      lowSection: null,
    })
    expect(count).toBe(5)
  })

  it('leaves the low-section washer (23) out — it has no fronts', () => {
    const count = countDrawerFronts({
      layout: 'low-only',
      topLevelModules: [slot(23)],
      lowSection: null,
    })
    expect(count).toBe(0)
  })

  it('adds up both sections of a dual cabinet', () => {
    const count = countDrawerFronts({
      layout: 'low-right',
      topLevelModules: [slot(13)],
      lowSection: lowSection([slot(22)]),
    })
    expect(count).toBe(4)
  })
})

describe('countDrawerFronts — push-to-open', () => {
  it('drops a module the customer set to push-to-open', () => {
    const count = countDrawerFronts({
      layout: 'high-only',
      topLevelModules: [slot(13, { pushToOpen: true }), slot(11)],
      lowSection: null,
    })
    expect(count).toBe(1)
  })
})

describe('hasDrawerFronts', () => {
  it('is true as soon as one module shows fronts', () => {
    expect(
      hasDrawerFronts({
        layout: 'high-only',
        topLevelModules: [slot(1), slot(11)],
        lowSection: null,
      }),
    ).toBe(true)
  })

  it('is false for a cabinet of doors only', () => {
    expect(
      hasDrawerFronts({
        layout: 'high-only',
        topLevelModules: [slot(1), slot(2)],
        lowSection: null,
      }),
    ).toBe(false)
  })
})
