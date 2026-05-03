import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import CanvasPricePanel from '../CanvasPricePanel'

const baseProps = {
  totalPrice: 3597,
  pricingData: {} as unknown,
  editItemId: null,
  handleAddToCart: () => {},
  isCapturing: false,
}

describe('CanvasPricePanel', () => {
  it('renders formatted total price', () => {
    const html = renderToStaticMarkup(<CanvasPricePanel {...baseProps} />)
    // nl-NL EUR with no decimals; allow non-breaking spaces or regular spaces
    expect(html).toMatch(/3\.597/)
  })

  it('renders delivery window string', () => {
    const html = renderToStaticMarkup(<CanvasPricePanel {...baseProps} />)
    expect(html).toContain('Geschatte aankomst')
    // Dutch month abbreviations from the utility output
    expect(html).toMatch(/jan|feb|mrt|apr|mei|jun|jul|aug|sep|okt|nov|dec/)
  })

  it('renders step summary label and value when prop provided', () => {
    const html = renderToStaticMarkup(
      <CanvasPricePanel
        {...baseProps}
        stepSummary={{ label: 'Modules', value: '6 modules · 4 deuren' }}
      />,
    )
    expect(html).toContain('Modules')
    expect(html).toContain('6 modules · 4 deuren')
    expect(html).toMatch(/data-testid="price-step-summary"/)
  })

  it('hides step summary column when prop absent', () => {
    const html = renderToStaticMarkup(<CanvasPricePanel {...baseProps} />)
    expect(html).not.toMatch(/data-testid="price-step-summary"/)
  })

  it('renders Bewaar ghost button', () => {
    const html = renderToStaticMarkup(<CanvasPricePanel {...baseProps} />)
    expect(html).toContain('Bewaar')
  })

  it('renders add-to-cart primary button', () => {
    const html = renderToStaticMarkup(<CanvasPricePanel {...baseProps} />)
    expect(html).toContain('Voeg toe aan winkelwagen')
  })

  it('positions panel as full-width bar at bottom of canvas', () => {
    const html = renderToStaticMarkup(<CanvasPricePanel {...baseProps} />)
    expect(html).toMatch(/bottom-0/)
    expect(html).toMatch(/left-0/)
    expect(html).toMatch(/right-0/)
  })

  it('applies frosted glass treatment', () => {
    const html = renderToStaticMarkup(<CanvasPricePanel {...baseProps} />)
    expect(html).toMatch(/bg-background\/90/)
    expect(html).toMatch(/backdrop-blur-sm/)
  })

  it('total price uses serif font at large size', () => {
    const html = renderToStaticMarkup(<CanvasPricePanel {...baseProps} />)
    const match = html.match(/<[^>]*data-testid="price-total"[^>]*>/)!
    expect(match[0]).toMatch(/font-serif/)
    expect(match[0]).toMatch(/text-(2xl|3xl|4xl)/)
  })
})
