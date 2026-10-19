'use client'

import { useEffect, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { useWasmachinekastStore } from '../store'

function cm(value: number): string {
  return `${value.toLocaleString('nl-NL', { maximumFractionDigits: 1 })} cm`
}

/**
 * Hoge + lage opstelling: the width of one part. The two parts share the total
 * width, so moving one moves the other; the line under the slider says so.
 * Each part keeps its width while vakken are added or removed. Renders nothing
 * in the single-part layouts.
 */
export default function PartWidthControl({ section }: { section: 'high' | 'low' }) {
  const layout = useWasmachinekastStore((s) => s.layout)
  const highWidth = useWasmachinekastStore((s) => s.width)
  const lowWidth = useWasmachinekastStore((s) => s.lowSection?.width ?? 0)
  const setLowSectionWidth = useWasmachinekastStore((s) => s.setLowSectionWidth)
  const setHighSectionWidth = useWasmachinekastStore((s) => s.setHighSectionWidth)
  // Primitive selectors: an object here would be a new value every render.
  const rangeMin = useWasmachinekastStore((s) => s.partWidthRange(section)?.min ?? 0)
  const rangeMax = useWasmachinekastStore((s) => s.partWidthRange(section)?.max ?? 0)

  const value = section === 'high' ? highWidth : lowWidth
  const other = section === 'high' ? lowWidth : highWidth
  const setWidth = section === 'high' ? setHighSectionWidth : setLowSectionWidth

  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])

  if (layout !== 'low-left' && layout !== 'low-right') return null

  const min = Math.ceil(rangeMin)
  const max = Math.max(min, Math.floor(rangeMax))
  const total = Math.round((highWidth + lowWidth) * 10) / 10

  const commit = () => {
    const parsed = Number(draft.replace(',', '.'))
    if (Number.isNaN(parsed)) {
      setDraft(String(value))
      return
    }
    setWidth(parsed)
  }

  return (
    <div className="space-y-1" data-testid={`part-width-${section}`}>
      <div className="flex items-center gap-3">
        <span className="w-16 shrink-0 text-sm font-medium">Breedte</span>
        <Slider
          min={min}
          max={max}
          step={1}
          value={[Math.min(max, Math.max(min, value))]}
          onValueChange={([v]) => setWidth(v)}
          className="flex-1"
          aria-label={section === 'high' ? 'Breedte hoge kast' : 'Breedte lage kast'}
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
            aria-label={section === 'high' ? 'Breedte hoge kast in cm' : 'Breedte lage kast in cm'}
            className="w-18 rounded border border-input px-2 py-1 text-sm tabular-nums text-right bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-xs text-muted-foreground">cm</span>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground pl-[4.75rem] tabular-nums" data-testid={`part-width-${section}-note`}>
        Totaal {cm(total)}: de {section === 'high' ? 'lage' : 'hoge'} kast wordt {cm(other)}
      </p>
    </div>
  )
}
