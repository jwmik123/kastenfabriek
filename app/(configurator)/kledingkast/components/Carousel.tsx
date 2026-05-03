'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'

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
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateArrows = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    updateArrows()
  }, [items, updateArrows])

  useEffect(() => {
    if (!activeId || !containerRef.current) return
    const idx = items.findIndex((item) => item.id === activeId)
    if (idx < 0) return
    const child = containerRef.current.children[idx] as HTMLElement | undefined
    child?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
  }, [activeId, items])

  const scroll = (direction: 'left' | 'right') => {
    const el = containerRef.current
    if (!el) return
    const itemWidth = el.clientWidth / 3.5
    el.scrollBy({ left: direction === 'left' ? -itemWidth : itemWidth, behavior: 'smooth' })
  }

  return (
    <div style={{ position: 'relative' }}>
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}
          aria-label="Scroll left"
        >
          ‹
        </button>
      )}
      <div
        ref={containerRef}
        className={className}
        onScroll={updateArrows}
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
                
                padding: 4,
              }}
            >
              {renderItem(item, isActive)}
            </div>
          )
        })}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}
          aria-label="Scroll right"
        >
          ›
        </button>
      )}
    </div>
  )
}
