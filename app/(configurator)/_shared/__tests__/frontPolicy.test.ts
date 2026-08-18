import { describe, it, expect } from 'vitest'
import { resolveFrontPlan } from '../frontPolicy'
import type { FrontPolicyContext } from '../frontPolicy'

const base: FrontPolicyContext = {
  product: 'wasmachinekast',
  sectionKind: 'high',
  hasDoorSetting: true,
  isWasher: false,
  layoutHasLowFronts: false,
  doorsExtendToFloor: false,
  selectedHandleId: '23',
}

describe('resolveFrontPlan — kledingkast (unchanged behavior)', () => {
  it('honors the door toggle and the selected handle', () => {
    const plan = resolveFrontPlan({ ...base, product: 'kledingkast' })
    expect(plan.showDoor).toBe(true)
    expect(plan.doorHandleId).toBe('23')
    expect(plan.showDrawerFronts).toBe(false)
    expect(plan.showWasherDoorAbove).toBe(false)
  })

  it('respects hasDoor=false', () => {
    const plan = resolveFrontPlan({ ...base, product: 'kledingkast', hasDoorSetting: false })
    expect(plan.showDoor).toBe(false)
  })

  it('keeps drawer fronts off even for lowFronts layouts', () => {
    const plan = resolveFrontPlan({ ...base, product: 'kledingkast', layoutHasLowFronts: true })
    expect(plan.showDrawerFronts).toBe(false)
    expect(plan.drawerHandleId).toBeNull()
  })

  it('honors greeploos selection', () => {
    const plan = resolveFrontPlan({ ...base, product: 'kledingkast', selectedHandleId: 'none' })
    expect(plan.doorHandleId).toBe('none')
  })
})

describe('resolveFrontPlan — wasmachinekast doors carry the door handle', () => {
  it('high-section doors carry the selected handle', () => {
    const plan = resolveFrontPlan(base)
    expect(plan.showDoor).toBe(true)
    expect(plan.doorHandleId).toBe('23')
  })

  it('lage-kast deurtjes carry the selected handle', () => {
    const plan = resolveFrontPlan({ ...base, sectionKind: 'low' })
    expect(plan.showDoor).toBe(true)
    expect(plan.doorHandleId).toBe('23')
  })

  it('greeploos door selection is honored', () => {
    const plan = resolveFrontPlan({ ...base, selectedHandleId: 'none' })
    expect(plan.doorHandleId).toBe('none')
  })
})

describe('resolveFrontPlan — washer modules (push-to-open)', () => {
  it('high-section washer gets only a door above, without handle', () => {
    const plan = resolveFrontPlan({ ...base, isWasher: true })
    expect(plan.showDoor).toBe(false)
    expect(plan.showWasherDoorAbove).toBe(true)
    expect(plan.doorHandleId).toBe('none')
  })

  it('door above the washer stays push-to-open regardless of selected handle', () => {
    const plan = resolveFrontPlan({ ...base, isWasher: true, selectedHandleId: '12' })
    expect(plan.doorHandleId).toBe('none')
  })

  it('low-section washer stays fully open', () => {
    const plan = resolveFrontPlan({ ...base, sectionKind: 'low', isWasher: true })
    expect(plan.showDoor).toBe(false)
    expect(plan.showWasherDoorAbove).toBe(false)
    expect(plan.showDrawerFronts).toBe(false)
  })
})

describe('resolveFrontPlan — low section kitchen-style fronts', () => {
  it('low-specific layouts (lowFronts, ids 20/21/22) show fronts instead of a door', () => {
    const plan = resolveFrontPlan({ ...base, sectionKind: 'low', layoutHasLowFronts: true })
    expect(plan.showDoor).toBe(false)
    expect(plan.showDrawerFronts).toBe(true)
  })

  it('drawer fronts override the door toggle', () => {
    const plan = resolveFrontPlan({
      ...base,
      sectionKind: 'low',
      layoutHasLowFronts: true,
      hasDoorSetting: false,
    })
    expect(plan.showDrawerFronts).toBe(true)
    expect(plan.showDoor).toBe(false)
  })

  it('drawer fronts carry the same handle as the doors', () => {
    const plan = resolveFrontPlan({
      ...base,
      sectionKind: 'low',
      layoutHasLowFronts: true,
      selectedHandleId: '23',
    })
    expect(plan.drawerHandleId).toBe('23')
    expect(plan.doorHandleId).toBe('none')
  })

  it('drawer fronts stay push-to-open when the handle does not fit a low module', () => {
    const plan = resolveFrontPlan({
      ...base,
      sectionKind: 'low',
      layoutHasLowFronts: true,
      selectedHandleId: '23',
      selectedHandleFitsLowModule: false,
    })
    expect(plan.drawerHandleId).toBe('none')
  })

  it('a lage-kast deurtje drops the handle when it does not fit a low module', () => {
    const plan = resolveFrontPlan({
      ...base,
      sectionKind: 'low',
      selectedHandleId: '23',
      selectedHandleFitsLowModule: false,
    })
    expect(plan.showDoor).toBe(true)
    expect(plan.doorHandleId).toBe('none')
  })

  it('a push-to-open module drops the handle on its door', () => {
    const plan = resolveFrontPlan({ ...base, modulePushToOpen: true })
    expect(plan.showDoor).toBe(true)
    expect(plan.doorHandleId).toBe('none')
  })

  it('a push-to-open module drops the handle on its drawer fronts', () => {
    const plan = resolveFrontPlan({
      ...base,
      sectionKind: 'low',
      layoutHasLowFronts: true,
      modulePushToOpen: true,
    })
    expect(plan.showDrawerFronts).toBe(true)
    expect(plan.drawerHandleId).toBe('none')
  })

  it('shared layouts (e.g. Drawers + shelves, id 2) in the low section keep a deurtje', () => {
    const plan = resolveFrontPlan({ ...base, sectionKind: 'low' })
    expect(plan.showDoor).toBe(true)
    expect(plan.showDrawerFronts).toBe(false)
  })

  it('lowFronts layouts in the HIGH section keep their door (kitchen style is low-only)', () => {
    const plan = resolveFrontPlan({ ...base, layoutHasLowFronts: true })
    expect(plan.showDoor).toBe(true)
    expect(plan.showDrawerFronts).toBe(false)
  })
})

describe('resolveFrontPlan — bottom edge', () => {
  it('defaults to the plinth top', () => {
    expect(resolveFrontPlan(base).bottom).toBe('plinth')
  })

  it('extends to 2 cm above floor when the setting is on', () => {
    expect(resolveFrontPlan({ ...base, doorsExtendToFloor: true }).bottom).toBe('floor')
    expect(
      resolveFrontPlan({
        ...base,
        sectionKind: 'low',
        layoutHasLowFronts: true,
        doorsExtendToFloor: true,
      }).bottom,
    ).toBe('floor')
  })
})
