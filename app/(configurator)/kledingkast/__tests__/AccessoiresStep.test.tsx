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

  it('renders the Stekkerdoos gaten section heading', async () => {
    const { default: AccessoiresStep } = await import('../steps/AccessoiresStep')
    const html = renderToStaticMarkup(<AccessoiresStep />)
    expect(html).toContain('Stekkerdoos gaten')
  })
})
