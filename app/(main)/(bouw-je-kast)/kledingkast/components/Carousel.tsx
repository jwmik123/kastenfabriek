'use client'

import React, { useRef, useEffect } from 'react'

interface CarouselItem {
  id: string
}

interface CarouselProps<T extends CarouselItem> {
  items: T[]
  activeId: string | null
  renderItem: (item: T, isActive: boolean) => React.ReactNode
  className?: string
}

export default function Carousel<T extends CarouselItem>({
  items,
  activeId,
  renderItem,
  className,
}: CarouselProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeId || !containerRef.current) return
    const idx = items.findIndex((item) => item.id === activeId)
    if (idx < 0) return
    const child = containerRef.current.children[idx] as HTMLElement | undefined
    child?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
  }, [activeId, items])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: 'flex',
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {items.map((item) => {
        const isActive = item.id === activeId
        return (
          <div
            key={item.id}
            style={{
              flexShrink: 0,
              width: 'calc(100% / 3.5)',
              scrollSnapAlign: 'start',
            }}
          >
            {renderItem(item, isActive)}
          </div>
        )
      })}
    </div>
  )
}
