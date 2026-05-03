import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Carousel from '../components/Carousel'

const items = [
  { id: 'a', label: 'Apple' },
  { id: 'b', label: 'Banana' },
  { id: 'c', label: 'Cherry' },
  { id: 'd', label: 'Date' },
]

describe('Carousel', () => {
  it('renders all items', () => {
    const html = renderToStaticMarkup(
      <Carousel
        items={items}
        activeId="a"
        renderItem={(item) => <span>{item.label}</span>}
      />,
    )
    items.forEach((item) => {
      expect(html).toContain(item.label)
    })
  })

  it('passes isActive=true only to active item', () => {
    const activeIds: string[] = []
    renderToStaticMarkup(
      <Carousel
        items={items}
        activeId="b"
        renderItem={(item, isActive) => {
          if (isActive) activeIds.push(item.id)
          return <span>{item.label}</span>
        }}
      />,
    )
    expect(activeIds).toEqual(['b'])
  })

  it('passes isActive=false when activeId is null', () => {
    const activeIds: string[] = []
    renderToStaticMarkup(
      <Carousel
        items={items}
        activeId={null}
        renderItem={(item, isActive) => {
          if (isActive) activeIds.push(item.id)
          return <span>{item.label}</span>
        }}
      />,
    )
    expect(activeIds).toHaveLength(0)
  })
})
