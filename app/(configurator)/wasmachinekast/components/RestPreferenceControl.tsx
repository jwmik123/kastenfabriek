'use client'

import { cn } from '@/lib/utils'
import { useWasmachinekastStore } from '../store'
import type { RestPreference } from '../sections/dualWidth'

const OPTIONS: { value: RestPreference; label: string; hint: string }[] = [
  { value: 'high', label: 'Hoge kast', hint: 'Meer kastruimte in de hoge kast' },
  { value: 'low', label: 'Lage kast', hint: 'Meer werkblad en kastjes eronder' },
]

function cm(value: number): string {
  return `${value.toLocaleString('nl-NL', { maximumFractionDigits: 1 })} cm`
}

/**
 * Hoge + lage opstelling: where the width next to the machines goes. The other
 * part fits its machines (and any vakken kept there) exactly. Renders nothing
 * in the single-part layouts.
 */
export default function RestPreferenceControl({ compact = false }: { compact?: boolean }) {
  const layout = useWasmachinekastStore((s) => s.layout)
  const preference = useWasmachinekastStore((s) => s.restPreference)
  const setPreference = useWasmachinekastStore((s) => s.setRestPreference)
  const highWidth = useWasmachinekastStore((s) => s.width)
  const lowWidth = useWasmachinekastStore((s) => s.lowSection?.width ?? 0)
  if (layout !== 'low-left' && layout !== 'low-right') return null

  return (
    <div className="space-y-3" data-testid="rest-preference">
      <div>
        <p className="text-sm font-medium">Waar moet de overige ruimte heen?</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          De ruimte naast de wasmachines gaat naar de modules van één kast; de andere kast past precies
          om de machines.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Overige ruimte">
        {OPTIONS.map((opt) => {
          const active = preference === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPreference(opt.value)}
              className={cn(
                'flex flex-col items-start gap-0.5 rounded-md border px-3 text-left transition-colors',
                compact ? 'py-2' : 'py-2.5',
                active
                  ? 'border-foreground bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted',
              )}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              {!compact && (
                <span className={cn('text-[11px]', active ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                  {opt.hint}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground tabular-nums" data-testid="dual-widths">
        Hoge kast {cm(highWidth)} · Lage kast {cm(lowWidth)}
      </p>
    </div>
  )
}
