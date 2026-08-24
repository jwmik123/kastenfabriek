'use client'

import { useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Draggable overlay for configurator debug panels, shown only on `?debug=1`.
 *
 * Renders nothing without the flag, so it never reaches a customer while still
 * being one URL edit away for anyone checking a price on the live site.
 */
export default function DebugPanelShell({
  title,
  subtitle,
  footer,
  children,
}: {
  /** Small uppercase tag in the drag handle. */
  title: string
  /** Configuration summary next to the tag. */
  subtitle: React.ReactNode
  /** Pinned below the scrolling body — totals live here. */
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()
  const isDebug = searchParams.get('debug') === '1'

  const [pos, setPos] = useState({ x: 8, y: 8 })
  const dragOffset = useRef({ dx: 0, dy: 0 })

  if (!isDebug) return null

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragOffset.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    setPos({ x: e.clientX - dragOffset.current.dx, y: e.clientY - dragOffset.current.dy })
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <div
      className="absolute z-50 w-72 max-h-[80vh] flex flex-col bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-lg overflow-hidden text-xs"
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 bg-muted/60 border-b border-border cursor-grab select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <span className="font-mono font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
          {title}
        </span>
        <span className="font-mono">{subtitle}</span>
      </div>
      <div className="overflow-y-auto flex-1 px-3 py-2 text-muted-foreground">{children}</div>
      {footer}
    </div>
  )
}
