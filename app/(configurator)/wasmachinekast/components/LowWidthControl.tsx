'use client'

import { useEffect, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { useWasmachinekastStore } from '../store'

function cm(value: number): string {
  return `${value.toLocaleString('nl-NL', { maximumFractionDigits: 1 })} cm`
}

/**
 * Hoge + lage opstelling: the width of the lage kast. It stays as chosen while
 * vakken are added or removed; the hoge kast takes the rest of the total.
 * Renders nothing in the single-part layouts.
 */
export default function LowWidthControl() {
  const layout = useWasmachinekastStore((s) => s.layout)
  const highWidth = useWasmachinekastStore((s) => s.width)
  const lowWidth = useWasmachinekastStore((s) => s.lowSection?.width ?? 0)
  const setLowSectionWidth = useWasmachinekastStore((s) => s.setLowSectionWidth)
  // Primitive selectors: an object here would be a new value every render.
  const rangeMin = useWasmachinekastStore((s) => s.lowWidthRange()?.min ?? 0)
  const rangeMax = useWasmachinekastStore((s) => s.lowWidthRange()?.max ?? 0)

  const [draft, setDraft] = useState(String(lowWidth))
  useEffect(() => setDraft(String(lowWidth)), [lowWidth])

  if (layout !== 'low-left' && layout !== 'low-right') return null

  const min = Math.ceil(rangeMin)
  const max = Math.max(min, Math.floor(rangeMax))

  const commit = () => {
    const parsed = Number(draft.replace(',', '.'))
    if (Number.isNaN(parsed)) {
      setDraft(String(lowWidth))
      return
    }
    setLowSectionWidth(parsed)
  }

  return (
    <div className="space-y-1" data-testid="low-width-control">
      <div className="flex items-center gap-3">
        <span className="w-16 shrink-0 text-sm font-medium leading-tight">Breedte lage kast</span>
        <Slider
          min={min}
          max={max}
          step={1}
          value={[Math.min(max, Math.max(min, lowWidth))]}
          onValueChange={([v]) => setLowSectionWidth(v)}
          className="flex-1"
          aria-label="Breedte lage kast"
        />
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
            className="w-18 rounded border border-input px-2 py-1 text-sm tabular-nums text-right bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-xs text-muted-foreground">cm</span>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground pl-[4.75rem] tabular-nums" data-testid="dual-widths">
        Hoge kast {cm(highWidth)} · Lage kast {cm(lowWidth)}
      </p>
    </div>
  )
}
