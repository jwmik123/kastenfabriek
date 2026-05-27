import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

let mockState = {
  lightStripsEnabled: false,
  setLightStripsEnabled: vi.fn(),
  modules: [
    { slotIndex: 0, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false },
    { slotIndex: 1, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false },
    { slotIndex: 2, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false },
  ],
  setHasPowerHole: vi.fn(),
  sidePanelThickness: '18mm' as '18mm' | '36mm',
  setSidePanelThickness: vi.fn(),
}

vi.mock('../store', () => ({
  useClosetStore: (selector: (s: typeof mockState) => unknown) => selector(mockState),
}))

beforeEach(() => {
  mockState = {
    lightStripsEnabled: false,
    setLightStripsEnabled: vi.fn(),
    modules: [
      { slotIndex: 0, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false },
      { slotIndex: 1, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false },
      { slotIndex: 2, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false },
    ],
    setHasPowerHole: vi.fn(),
    sidePanelThickness: '18mm',
    setSidePanelThickness: vi.fn(),
  }
})

describe('AccessoiresStep', () => {
  it('renders LED strip toggle section', async () => {
    const { default: AccessoiresStep } = await import('../steps/AccessoiresStep')
    const html = renderToStaticMarkup(<AccessoiresStep />)
    expect(html).toContain('LED-lichtstrips')
  })

  it('renders a slot grid cell for each module', async () => {
    const { default: AccessoiresStep } = await import('../steps/AccessoiresStep')
    const html = renderToStaticMarkup(<AccessoiresStep />)
    expect(html).toContain('>1<')
    expect(html).toContain('>2<')
    expect(html).toContain('>3<')
  })

  it('shows plug indicator for slots with hasPowerHole true', async () => {
    mockState.modules[1].hasPowerHole = true
    const { default: AccessoiresStep } = await import('../steps/AccessoiresStep')
    const html = renderToStaticMarkup(<AccessoiresStep />)
    expect(html).toContain('data-plug="1"')
  })

  it('renders the Prado 2.0 section heading', async () => {
    const { default: AccessoiresStep } = await import('../steps/AccessoiresStep')
    const html = renderToStaticMarkup(<AccessoiresStep />)
    expect(html).toContain('Prado 2.0')
  })

  it('renders Zijpanelen section with always-visible 18/36mm picker', async () => {
    const { default: AccessoiresStep } = await import('../steps/AccessoiresStep')
    const html = renderToStaticMarkup(<AccessoiresStep />)
    expect(html).toContain('Zijpanelen')
    expect(html).toMatch(/<button[^>]*>18 mm<\/button>/)
    expect(html).toMatch(/<button[^>]*>36 mm<\/button>/)
  })
})
