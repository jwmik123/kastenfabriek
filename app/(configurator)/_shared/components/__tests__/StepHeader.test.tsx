import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import StepHeader from '../StepHeader'

describe('StepHeader', () => {
  it('renders eyebrow, title, and subtitle text', () => {
    const html = renderToStaticMarkup(
      <StepHeader eyebrow="STAP 2" title="Modules" subtitle="Kies een indeling" />,
    )
    expect(html).toContain('STAP 2')
    expect(html).toContain('Modules')
    expect(html).toContain('Kies een indeling')
  })

  it('eyebrow uses brand primary color and uppercase tracking', () => {
    const html = renderToStaticMarkup(
      <StepHeader eyebrow="STAP 1" title="Afmetingen" subtitle="x" />,
    )
    const eyebrowMatch = html.match(/<[^>]*data-testid="step-header-eyebrow"[^>]*>/)!
    expect(eyebrowMatch[0]).toMatch(/text-primary/)
    expect(eyebrowMatch[0]).toMatch(/uppercase/)
    expect(eyebrowMatch[0]).toMatch(/tracking/)
  })

  it('title uses serif font at larger size', () => {
    const html = renderToStaticMarkup(
      <StepHeader eyebrow="x" title="Materiaal" subtitle="x" />,
    )
    const titleMatch = html.match(/<[^>]*data-testid="step-header-title"[^>]*>/)!
    expect(titleMatch[0]).toMatch(/font-serif/)
    expect(titleMatch[0]).toMatch(/text-(2xl|3xl|4xl)/)
  })

  it('subtitle is small and muted', () => {
    const html = renderToStaticMarkup(
      <StepHeader eyebrow="x" title="t" subtitle="Sub" />,
    )
    const subMatch = html.match(/<[^>]*data-testid="step-header-subtitle"[^>]*>/)!
    expect(subMatch[0]).toMatch(/text-sm/)
    expect(subMatch[0]).toMatch(/text-muted-foreground/)
  })
})
