'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  /** Extra classes for the scrolling element. */
  className?: string
}

/**
 * Vertical scroll container with an always-visible custom scrollbar.
 *
 * Native scrollbars on mobile (and overlay scrollbars on macOS) auto-hide when
 * idle. This renders a persistent thumb driven by scroll position so the user
 * always sees the scroll affordance. The thumb is draggable and the underlying
 * element scrolls normally via wheel/touch.
 */
export default function ScrollArea({ children, className }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startY: number; startScroll: number } | null>(null)
  const [bar, setBar] = useState({ height: 0, top: 0, visible: false })

  const recompute = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollHeight, clientHeight, scrollTop } = el
    if (scrollHeight <= clientHeight + 1) {
      setBar((prev) => (prev.visible ? { ...prev, visible: false } : prev))
      return
    }
    const height = Math.max(28, (clientHeight / scrollHeight) * clientHeight)
    const maxTop = clientHeight - height
    const denom = scrollHeight - clientHeight
    const top = denom > 0 ? maxTop * (scrollTop / denom) : 0
    setBar((prev) =>
      prev.visible && prev.height === height && Math.abs(prev.top - top) < 0.5
        ? prev
        : { height, top, visible: true },
    )
  }, [])

  // Observe both the viewport and the content wrapper, so the thumb updates on
  // resize and on step/content swaps (content height changes). ResizeObserver
  // fires once on observe, which also covers the initial measure.
  useEffect(() => {
    const el = scrollRef.current
    const content = contentRef.current
    if (!el) return
    const ro = new ResizeObserver(recompute)
    ro.observe(el)
    if (content) ro.observe(content)
    return () => ro.disconnect()
  }, [recompute])

  const onPointerDown = (e: React.PointerEvent) => {
    const el = scrollRef.current
    if (!el) return
    e.preventDefault()
    dragRef.current = { startY: e.clientY, startScroll: el.scrollTop }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const el = scrollRef.current
    const drag = dragRef.current
    if (!el || !drag) return
    const { scrollHeight, clientHeight } = el
    const trackRange = clientHeight - bar.height
    if (trackRange <= 0) return
    const ratio = (scrollHeight - clientHeight) / trackRange
    el.scrollTop = drag.startScroll + (e.clientY - drag.startY) * ratio
  }

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollRef}
        onScroll={recompute}
        className={cn('relative h-full overflow-y-auto scrollbar-hidden', className)}
      >
        <div ref={contentRef}>{children}</div>
      </div>
      {bar.visible && (
        <div
          role="presentation"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="absolute right-1 w-1.5 rounded-full bg-primary/40 hover:bg-primary/60 active:bg-primary/80 cursor-pointer touch-none transition-colors"
          style={{ height: bar.height, top: bar.top }}
        />
      )}
    </div>
  )
}
