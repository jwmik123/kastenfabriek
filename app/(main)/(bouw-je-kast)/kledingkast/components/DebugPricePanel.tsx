'use client'

import { useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useClosetStore } from '../store'
import { useDebugPricing } from '../hooks/useDebugPricing'
import type { DebugSlotRow, DebugTopCabinetRow } from '../hooks/useDebugPricing'

const fmt = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 })
const cm = (m: number) => (m * 100).toFixed(1)
const dims = (d: { w: number; h: number; d: number }) => `${cm(d.w)} × ${cm(d.h)} × ${cm(d.d)}`

function SlotRow({ row }: { row: DebugSlotRow }) {
  if (row.isEmpty) {
    return (
      <div className="py-1 border-b border-border/30">
        <div className="flex items-center gap-1 text-muted-foreground/50">
          <span className="font-mono text-[10px] w-4 shrink-0">{row.slotIndex}</span>
          <span className="italic">Leeg</span>
        </div>
        <div className="pl-5 font-mono text-[10px] text-muted-foreground/40">
          {dims(row.dimensions.nominal)} cm
        </div>
      </div>
    )
  }

  return (
    <div className="py-1 border-b border-border/30">
      <div className="flex items-center gap-1 font-mono">
        <span className="text-[10px] w-4 shrink-0 text-muted-foreground">{row.slotIndex}</span>
        <span className="font-semibold text-foreground truncate">{row.layoutName ?? `#${row.layoutId}`}</span>
        <span className="ml-auto text-muted-foreground text-[10px]">{row.pricingTier}</span>
        <span className="font-semibold">{fmt.format(row.slotSubtotal)}</span>
      </div>
      <div className="pl-5 flex flex-col gap-px text-muted-foreground text-[10px] font-mono">
        <div className="flex justify-between">
          <span>interieur</span>
          <span>{fmt.format(row.interiorCost)}</span>
        </div>
        {row.hasDoor && (
          <div className="flex justify-between">
            <span>deuren ({row.doorCount}× {row.doorVariant})</span>
            <span>{fmt.format(row.doorCost)}</span>
          </div>
        )}
        {row.hasDoor && (
          <div className="flex justify-between">
            <span>greep/mech. ({row.doorCount}×)</span>
            <span>{fmt.format(row.handleCost)}</span>
          </div>
        )}
        {row.powerHoleCost > 0 && (
          <div className="flex justify-between">
            <span>stekkerhole</span>
            <span>{fmt.format(row.powerHoleCost)}</span>
          </div>
        )}
        <div className="flex justify-between mt-0.5">
          <span>{dims(row.dimensions.nominal)} cm</span>
        </div>
        <div className="flex justify-between text-muted-foreground/50">
          <span>↳ {dims(row.dimensions.innerClear)} cm</span>
        </div>
      </div>
    </div>
  )
}

function TopCabinetRow({ row }: { row: DebugTopCabinetRow }) {
  return (
    <div className="py-1 border-b border-border/30">
      <div className="flex items-center gap-1 font-mono">
        <span className="text-[10px] w-4 shrink-0 text-muted-foreground">↑</span>
        <span className="font-semibold text-foreground">Bovenkast</span>
        <span className="ml-auto font-semibold">{fmt.format(row.subtotal)}</span>
      </div>
      <div className="pl-5 flex flex-col gap-px text-muted-foreground text-[10px] font-mono">
        <div className="flex justify-between">
          <span>deuren ({row.doorCount}× {row.doorVariant})</span>
          <span>{fmt.format(row.doorCost)}</span>
        </div>
        <div className="flex justify-between">
          <span>greep/mech. ({row.doorCount}×)</span>
          <span>{fmt.format(row.handleCost)}</span>
        </div>
      </div>
    </div>
  )
}

export default function DebugPricePanel() {
  const searchParams = useSearchParams()
  const isDebug = searchParams.get('debug') === '1'

  const width = useClosetStore((s) => s.width)
  const height = useClosetStore((s) => s.height)
  const depth = useClosetStore((s) => s.depth)
  const moduleCount = useClosetStore((s) => s.moduleCount)

  const pricing = useDebugPricing()

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
        {pricing ? (
          <>
            {pricing.slots.map((row) => (
              <SlotRow key={row.slotIndex} row={row} />
            ))}
            {pricing.topCabinet && <TopCabinetRow row={pricing.topCabinet} />}
          </>
        ) : (
          <span className="text-[10px]">Prijsdata laden…</span>
        )}
      </div>
      {pricing && (
        <div className="border-t border-border px-3 py-2 bg-muted/40 flex flex-col gap-0.5 font-mono">
          <div className="flex justify-between text-muted-foreground">
            <span>
              {pricing.global.ledCost > 0
                ? `LED strips (${pricing.global.ledModuleCount} mod.)`
                : 'LED strips'}
            </span>
            <span>{fmt.format(pricing.global.ledCost)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Bezorging</span>
            <span>{fmt.format(pricing.global.deliveryCost)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Montage{pricing.global.installationTierName ? ` (${pricing.global.installationTierName})` : ''}</span>
            <span>{fmt.format(pricing.global.installationCost)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground border-t border-border/50 mt-0.5 pt-0.5">
            <span>Subtotaal</span>
            <span>{fmt.format(pricing.global.subtotal)}</span>
          </div>
          <div className="flex justify-between font-semibold text-foreground">
            <span>Totaal</span>
            <span>{fmt.format(pricing.global.grandTotal)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
