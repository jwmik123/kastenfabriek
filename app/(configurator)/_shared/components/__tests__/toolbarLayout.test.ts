import { describe, it, expect } from 'vitest'
import { getToolbarLayout } from '../toolbarLayout'

describe('getToolbarLayout', () => {
  it('renders a vertical rail with zoom buttons on desktop', () => {
    const layout = getToolbarLayout({ isMobile: false, showRandomize: true })
    expect(layout.orientation).toBe('vertical')
    expect(layout.items).toEqual([
      'zoomIn',
      'zoomOut',
      'measurements',
      'doors',
      'floor',
      'randomize',
      'help',
    ])
  })

  it('renders a vertical rail without zoom buttons on mobile', () => {
    const layout = getToolbarLayout({ isMobile: true, showRandomize: true })
    expect(layout.orientation).toBe('vertical')
    expect(layout.items).not.toContain('zoomIn')
    expect(layout.items).not.toContain('zoomOut')
    expect(layout.items).toEqual(['measurements', 'doors', 'floor', 'randomize', 'help'])
  })

  it('omits randomize when showRandomize is false (desktop)', () => {
    const layout = getToolbarLayout({ isMobile: false, showRandomize: false })
    expect(layout.items).not.toContain('randomize')
    expect(layout.items).toEqual(['zoomIn', 'zoomOut', 'measurements', 'doors', 'floor', 'help'])
  })

  it('omits randomize when showRandomize is false (mobile)', () => {
    const layout = getToolbarLayout({ isMobile: true, showRandomize: false })
    expect(layout.items).not.toContain('randomize')
    expect(layout.items).toEqual(['measurements', 'doors', 'floor', 'help'])
  })

  it('defaults showRandomize to true', () => {
    expect(getToolbarLayout({ isMobile: false }).items).toContain('randomize')
    expect(getToolbarLayout({ isMobile: true }).items).toContain('randomize')
  })
})
