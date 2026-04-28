import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const fakeHandles = [
  { id: '23', name: 'W7845', nameNl: 'Handgreep W7845', productCode: 'W7845', price: 12.5 },
  { id: '1',  name: 'W4080', nameNl: 'Handgreep W4080', productCode: 'W4080', price: 8.0  },
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

vi.mock('../store', () => ({
  useClosetStore: (selector: (s: typeof mockState) => unknown) => selector(mockState),
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

describe('DoorHandlesStep', () => {
  it('renders all handles in carousel', async () => {
    const { default: DoorHandlesStep } = await import('../steps/DoorHandlesStep')
    const html = renderToStaticMarkup(<DoorHandlesStep />)
    expect(html).toContain('Handgreep W7845')
    expect(html).toContain('Handgreep W4080')
    expect(html).toContain('Geen (push-to-open)')
  })

  it('shows material control when a real handle is selected', async () => {
    mockState.doorHandleId = '23'
    const { default: DoorHandlesStep } = await import('../steps/DoorHandlesStep')
    const html = renderToStaticMarkup(<DoorHandlesStep />)
    expect(html).toContain('Chrome')
    expect(html).toContain('Zwart')
    expect(html).toContain('Goud')
  })

  it('hides material control when push-to-open is selected', async () => {
    mockState.doorHandleId = 'none'
    const { default: DoorHandlesStep } = await import('../steps/DoorHandlesStep')
    const html = renderToStaticMarkup(<DoorHandlesStep />)
    expect(html).not.toContain('Chrome')
    expect(html).not.toContain('Zwart')
    expect(html).not.toContain('Goud')
  })

  it('highlights active material in segmented control', async () => {
    mockState.doorHandleId = '23'
    mockState.doorHandleMaterial = 'gold'
    const { default: DoorHandlesStep } = await import('../steps/DoorHandlesStep')
    const html = renderToStaticMarkup(<DoorHandlesStep />)
    expect(html).toContain('Goud')
    expect(html).toContain('Chrome')
  })
})
