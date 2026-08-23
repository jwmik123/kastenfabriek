import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import CanvasPricePanel from '../CanvasPricePanel'

const breakdown = {
  cabinet: 2752,
  delivery: 95,
  installation: 750,
  installationTierName: 'Middelgroot project',
  installationDays: 1,
  installationPeople: 2,
}

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

  it('total price renders at large size', () => {
    const html = renderToStaticMarkup(<CanvasPricePanel {...baseProps} />)
    const match = html.match(/<[^>]*data-testid="price-total"[^>]*>/)!
    expect(match[0]).toMatch(/text-(2xl|3xl|4xl)/)
  })

  it('labels the headline total as including delivery and montage', () => {
    const html = renderToStaticMarkup(<CanvasPricePanel {...baseProps} />)
    expect(html).toMatch(/incl\. levering &(amp;|nbsp;)? ?montage/i)
  })

  it('summarises cabinet, delivery and montage under the total', () => {
    const html = renderToStaticMarkup(<CanvasPricePanel {...baseProps} breakdown={breakdown} />)
    expect(html).toMatch(/data-testid="price-breakdown-toggle"/)
    expect(html).toMatch(/2\.752/)
    expect(html).toMatch(/95/)
    expect(html).toMatch(/750/)
  })

  it('shows montage as gratis when the free-montage promo applies', () => {
    const html = renderToStaticMarkup(
      <CanvasPricePanel {...baseProps} breakdown={{ ...breakdown, installation: 0, freeMontageApplied: true }} />,
    )
    expect(html).toContain('gratis')
  })

  it('hides the breakdown toggle when no breakdown is supplied', () => {
    const html = renderToStaticMarkup(<CanvasPricePanel {...baseProps} />)
    expect(html).not.toMatch(/data-testid="price-breakdown-toggle"/)
  })
})
