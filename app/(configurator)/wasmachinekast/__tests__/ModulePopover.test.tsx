import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

type Mod = {
  slotIndex: number
  layoutId: number | null
  hasDoor: boolean
  span: 1 | 2
  hasPowerHole?: boolean
}

interface MockState {
  step: number
  selectedSlot: number | null
  setSelectedSlot: (n: number | null) => void
  setModuleLayout: (slot: number, id: number) => void
  setModuleSpan: (slot: number, span: 1 | 2) => void
  toggleModuleDoor: (slot: number) => void
  modules: Mod[]
  moduleCount: number
  moduleWidthCm: () => number
  moduleLayouts: Array<{ layoutId: number; name: string; minSlotWidth?: number }>
  washerModules: Array<{ slotIndex: number; layoutId: number }>
  lastClickPoint: { x: number; y: number } | null
}

const baseModules: Mod[] = [
  { slotIndex: 0, layoutId: 11, hasDoor: false, span: 1 },
  { slotIndex: 1, layoutId: 1,  hasDoor: false, span: 1 },
  { slotIndex: 2, layoutId: 1,  hasDoor: false, span: 1 },
  { slotIndex: 3, layoutId: 1,  hasDoor: false, span: 1 },
]

const baseLayouts = [
  { layoutId: 1, name: 'Open' },
  { layoutId: 2, name: 'Roede' },
  { layoutId: 11, name: 'Wasmachine (enkel)', minSlotWidth: 68.6 },
]

let mockState: MockState

vi.mock('../store', () => ({
  useWasmachinekastStore: (selector: (s: MockState) => unknown) => selector(mockState),
}))

beforeEach(() => {
  mockState = {
    step: 3,
    selectedSlot: 1,
    setSelectedSlot: vi.fn(),
    setModuleLayout: vi.fn(),
    setModuleSpan: vi.fn(),
    toggleModuleDoor: vi.fn(),
    modules: baseModules.map((m) => ({ ...m })),
    moduleCount: 4,
    moduleWidthCm: () => 70,
    moduleLayouts: baseLayouts,
    washerModules: [{ slotIndex: 0, layoutId: 11 }],
    lastClickPoint: null,
  }
})

describe('ModulePopover (wasmachinekast)', () => {
  it('renders nothing when step is not 3', async () => {
    mockState.step = 2
    const { default: ModulePopover } = await import('../components/ModulePopover')
    const html = renderToStaticMarkup(<ModulePopover />)
    expect(html).toBe('')
  })

  it('renders nothing when no slot is selected', async () => {
    mockState.selectedSlot = null
    const { default: ModulePopover } = await import('../components/ModulePopover')
    const html = renderToStaticMarkup(<ModulePopover />)
    expect(html).toBe('')
  })

  it('renders nothing when selected slot is a washer slot', async () => {
    mockState.selectedSlot = 0
    const { default: ModulePopover } = await import('../components/ModulePopover')
    const html = renderToStaticMarkup(<ModulePopover />)
    expect(html).toBe('')
  })

  it('renders bay header for selected slot', async () => {
    const { default: ModulePopover } = await import('../components/ModulePopover')
    const html = renderToStaticMarkup(<ModulePopover />)
    expect(html).toContain('Vak 2 instellen')
  })

  it('renders layout picker, deur and dubbele toggles for normal slot', async () => {
    const { default: ModulePopover } = await import('../components/ModulePopover')
    const html = renderToStaticMarkup(<ModulePopover />)
    expect(html).toContain('data-testid="module-popover-layout-picker"')
    expect(html).toContain('data-testid="module-popover-door-toggle"')
    expect(html).toContain('data-testid="module-popover-double-toggle"')
  })

  it('omits washer layouts from picker', async () => {
    const { default: ModulePopover } = await import('../components/ModulePopover')
    const html = renderToStaticMarkup(<ModulePopover />)
    expect(html).toContain('data-layout-id="1"')
    expect(html).not.toContain('data-layout-id="11"')
  })

  it('renders only covered message for the second half of a double slot', async () => {
    mockState.modules[0] = { ...mockState.modules[0], layoutId: 1, span: 2 }
    mockState.washerModules = []
    mockState.selectedSlot = 1
    const { default: ModulePopover } = await import('../components/ModulePopover')
    const html = renderToStaticMarkup(<ModulePopover />)
    expect(html).toContain('dubbel')
    expect(html).not.toContain('data-testid="module-popover-layout-picker"')
    expect(html).not.toContain('data-testid="module-popover-door-toggle"')
    expect(html).not.toContain('data-testid="module-popover-double-toggle"')
  })

  it('hides dubbele toggle when slot cannot be doubled (last slot)', async () => {
    mockState.selectedSlot = 3
    const { default: ModulePopover } = await import('../components/ModulePopover')
    const html = renderToStaticMarkup(<ModulePopover />)
    expect(html).toContain('data-testid="module-popover-layout-picker"')
    expect(html).not.toContain('data-testid="module-popover-double-toggle"')
  })

  it('hides dubbele toggle when next slot is a washer slot', async () => {
    // Move washer to slot 2 so that selecting slot 1 has washer at slot+1.
    mockState.washerModules = [{ slotIndex: 2, layoutId: 11 }]
    mockState.selectedSlot = 1
    const { default: ModulePopover } = await import('../components/ModulePopover')
    const html = renderToStaticMarkup(<ModulePopover />)
    expect(html).toContain('data-testid="module-popover-layout-picker"')
    expect(html).not.toContain('data-testid="module-popover-double-toggle"')
  })
})
