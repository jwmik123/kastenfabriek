import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const fakeHandles = [
  { id: '1',  name: 'W4080', nameNl: 'Handgreep W4080', productCode: 'W4080', price: 8.0  },
  { id: '23', name: 'W7845', nameNl: 'Handgreep W7845', productCode: 'W7845', price: 12.5 },
]

const fakePricingData = {
  handles: fakeHandles,
  accessories: [{ id: 'push-to-open', name: 'Push-to-open', price: 5.0 }],
  config: {} as any,
  modules: [],
  doors: [],
  installation: [],
}

let mockState = {
  doorHandleId: '23',
  doorHandleMaterial: 'chrome' as 'chrome' | 'black' | 'gold',
  pricingData: fakePricingData as any,
  setDoorHandleId: vi.fn(),
  setDoorHandleMaterial: vi.fn(),
}

vi.mock('../../store/context', () => ({
  useConfiguratorStore: (selector: (s: typeof mockState) => unknown) => selector(mockState),
}))

beforeEach(() => {
  mockState = {
    doorHandleId: '23',
    doorHandleMaterial: 'chrome',
    pricingData: fakePricingData,
    setDoorHandleId: vi.fn(),
    setDoorHandleMaterial: vi.fn(),
  }
})

describe('DoorHandlesStep (shared)', () => {
  it('renders handles and push-to-open in the grid on initial page', async () => {
    const { default: DoorHandlesStep } = await import('../DoorHandlesStep')
    const html = renderToStaticMarkup(<DoorHandlesStep />)
    // 2 handles + push-to-open all fit on page 1 of a 6-cell grid
    expect(html).toContain('Handgreep W4080')
    expect(html).toContain('Handgreep W7845')
    expect(html).toContain('Geen (push-to-open)')
  })

  it('shows material control when a real handle is selected', async () => {
    mockState.doorHandleId = '23'
    const { default: DoorHandlesStep } = await import('../DoorHandlesStep')
    const html = renderToStaticMarkup(<DoorHandlesStep />)
    expect(html).toContain('Chrome')
    expect(html).toContain('Zwart')
    expect(html).toContain('Goud')
  })

  it('hides material control when push-to-open is selected', async () => {
    mockState.doorHandleId = 'none'
    const { default: DoorHandlesStep } = await import('../DoorHandlesStep')
    const html = renderToStaticMarkup(<DoorHandlesStep />)
    expect(html).not.toContain('Afwerking')
  })

  it('does not render pagination controls when there is only one page', async () => {
    const { default: DoorHandlesStep } = await import('../DoorHandlesStep')
    const html = renderToStaticMarkup(<DoorHandlesStep />)
    expect(html).not.toContain('Vorige pagina')
    expect(html).not.toContain('Volgende pagina')
    expect(html).not.toContain('handle-page-dot')
  })

  it('renders prev/next + dots and lands on the page containing the selected handle', async () => {
    // 7 handles + push-to-open = 8 items at perPage=6 => 2 pages
    const manyHandles = Array.from({ length: 7 }, (_, i) => ({
      id: String(i + 1),
      name: `W${i}`,
      nameNl: `Handgreep W${i}`,
      productCode: `W${i}`,
      price: 10,
    }))
    mockState.pricingData = {
      ...fakePricingData,
      handles: manyHandles,
    } as any
    mockState.doorHandleId = '7' // selected sits on page 2 (index 6 / 6 = 1)
    const { default: DoorHandlesStep } = await import('../DoorHandlesStep')
    const html = renderToStaticMarkup(<DoorHandlesStep />)

    expect(html).toContain('Vorige pagina')
    expect(html).toContain('Volgende pagina')

    const dots = html.match(/data-testid="handle-page-dot"/g) ?? []
    expect(dots).toHaveLength(2)

    const activeDots = html.match(/data-testid="handle-page-dot"[^>]*data-active="true"/g) ?? []
    expect(activeDots).toHaveLength(1)
    // The active dot should be the second one — selected handle is on page 2.
    // Confirm by ensuring page 1's first item ("Handgreep W0") is NOT in the rendered page.
    expect(html).not.toContain('Handgreep W0')
    // Selected handle "W6" (id '7' is the 7th handle, name 'W6') must render on the visible page.
    expect(html).toContain('Handgreep W6')
  })

  it('places push-to-open as the final cell after handles sorted by id', async () => {
    const handles = Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1),
      name: `H${i}`,
      nameNl: `Handgreep H${i}`,
      productCode: `H${i}`,
      price: 10,
    }))
    mockState.pricingData = { ...fakePricingData, handles } as any
    const { default: DoorHandlesStep } = await import('../DoorHandlesStep')
    const html = renderToStaticMarkup(<DoorHandlesStep />)
    const lastIdx = html.lastIndexOf('Geen (push-to-open)')
    const lastH4 = html.lastIndexOf('Handgreep H4')
    expect(lastIdx).toBeGreaterThan(lastH4)
  })
})
