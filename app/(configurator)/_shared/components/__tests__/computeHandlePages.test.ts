import { describe, it, expect } from 'vitest'
import { computeHandlePages } from '../computeHandlePages'

type Item = { id: string }

const make = (n: number): Item[] =>
  Array.from({ length: n }, (_, i) => ({ id: `h${i + 1}` }))

describe('computeHandlePages', () => {
  it('empty items → pages [] and initialPageIndex 0', () => {
    const r = computeHandlePages<Item>([], 6, 'anything')
    expect(r.pages).toEqual([])
    expect(r.initialPageIndex).toBe(0)
  })

  it('1 item → single page of 1', () => {
    const items = make(1)
    const r = computeHandlePages(items, 6, 'h1')
    expect(r.pages).toEqual([items])
    expect(r.initialPageIndex).toBe(0)
  })

  it('6 items at perPage 6 → one full page', () => {
    const items = make(6)
    const r = computeHandlePages(items, 6, 'h6')
    expect(r.pages.length).toBe(1)
    expect(r.pages[0].length).toBe(6)
    expect(r.initialPageIndex).toBe(0)
  })

  it('7 items at perPage 6 → two pages, second has 1 item', () => {
    const items = make(7)
    const r = computeHandlePages(items, 6, 'h7')
    expect(r.pages.length).toBe(2)
    expect(r.pages[0].length).toBe(6)
    expect(r.pages[1].length).toBe(1)
    expect(r.initialPageIndex).toBe(1)
  })

  it('13 items at perPage 6 → three pages [6,6,1]', () => {
    const items = make(13)
    const r = computeHandlePages(items, 6, 'h13')
    expect(r.pages.map(p => p.length)).toEqual([6, 6, 1])
    expect(r.initialPageIndex).toBe(2)
  })

  it('14 items at perPage 6 → three pages [6,6,2]; selected on middle page', () => {
    const items = make(14)
    const r = computeHandlePages(items, 6, 'h7')
    expect(r.pages.map(p => p.length)).toEqual([6, 6, 2])
    expect(r.initialPageIndex).toBe(1)
  })

  it('selected on first full page → initialPageIndex 0', () => {
    const items = make(14)
    const r = computeHandlePages(items, 6, 'h3')
    expect(r.initialPageIndex).toBe(0)
  })

  it('selected on last full page (12 items, h12) → initialPageIndex 1', () => {
    const items = make(12)
    const r = computeHandlePages(items, 6, 'h12')
    expect(r.pages.map(p => p.length)).toEqual([6, 6])
    expect(r.initialPageIndex).toBe(1)
  })

  it('selected id missing from list → initialPageIndex 0', () => {
    const items = make(13)
    const r = computeHandlePages(items, 6, 'nope')
    expect(r.initialPageIndex).toBe(0)
  })
})
