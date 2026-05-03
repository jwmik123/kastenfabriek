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
  width: number
  height: number
  depth: number
  diagonalSide: 'none' | 'left' | 'right' | 'both'
  leftDiagStartHeight: number
  rightDiagStartHeight: number
  leftDiagTopWidth: number
  rightDiagTopWidth: number
  backDiagonal: boolean
  backDiagKinkHeight: number
  backDiagFlatSectionDepth: number
  mainHeight: () => number
}

const baseModules: Mod[] = [
  { slotIndex: 0, layoutId: 1, hasDoor: false, span: 1 },
  { slotIndex: 1, layoutId: 1, hasDoor: false, span: 1 },
  { slotIndex: 2, layoutId: 1, hasDoor: false, span: 1 },
  { slotIndex: 3, layoutId: 1, hasDoor: false, span: 1 },
]

let mockState: MockState

vi.mock('../store', () => ({
  useClosetStore: (selector: (s: MockState) => unknown) => selector(mockState),
}))

beforeEach(() => {
  mockState = {
    step: 2,
    selectedSlot: 1,
    setSelectedSlot: vi.fn(),
    setModuleLayout: vi.fn(),
    setModuleSpan: vi.fn(),
    toggleModuleDoor: vi.fn(),
    modules: baseModules.map((m) => ({ ...m })),
    moduleCount: 4,
    width: 200,
    height: 240,
    depth: 60,
    diagonalSide: 'none',
    leftDiagStartHeight: 240,
    rightDiagStartHeight: 240,
    leftDiagTopWidth: 0,
    rightDiagTopWidth: 0,
    backDiagonal: false,
    backDiagKinkHeight: 0,
    backDiagFlatSectionDepth: 0,
    mainHeight: () => 240,
  }
})

describe('ModulePopover (kledingkast)', () => {
  it('renders nothing when step is not 2', async () => {
    mockState.step = 1
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

  it('renders only covered message for the second half of a double slot', async () => {
    mockState.modules[0].span = 2
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

  it('omits layouts incompatible with diagonal-constrained effective height', async () => {
    // Right diagonal that aggressively limits the rightmost slot — selected slot 3
    // mainHeight 2.40m. Set right diag start at 0.20m and top width covering full slot
    // width so getDiagHeightAt at the slot's right edge is small.
    mockState.diagonalSide = 'right'
    mockState.rightDiagStartHeight = 20 // cm — very low start
    mockState.rightDiagTopWidth = 200 // cm — full reach
    mockState.selectedSlot = 3
    const { default: ModulePopover } = await import('../components/ModulePopover')
    const html = renderToStaticMarkup(<ModulePopover />)
    // Layout id 1 (height 0) is always allowed
    expect(html).toContain('data-layout-id="1"')
    // Layout id 3 (height 1.75m) cannot fit in a strongly constrained slot
    expect(html).not.toContain('data-layout-id="3"')
  })
})
