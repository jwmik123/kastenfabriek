'use client'

import { useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useClosetStore } from '../store'

export default function DebugPricePanel() {
  const searchParams = useSearchParams()
  const isDebug = searchParams.get('debug') === '1'

  const width = useClosetStore((s) => s.width)
  const height = useClosetStore((s) => s.height)
  const depth = useClosetStore((s) => s.depth)
  const moduleCount = useClosetStore((s) => s.moduleCount)

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
        <span className="font-mono font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">debug</span>
        <span className="font-mono">
          {width} × {height} × {depth} cm — {moduleCount} modules
        </span>
      </div>
      <div className="overflow-y-auto flex-1 px-3 py-2 text-muted-foreground">
        {/* body populated by later issues */}
        <span className="text-[10px]">Per-module breakdown coming soon.</span>
      </div>
    </div>
  )
}
