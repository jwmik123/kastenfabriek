'use client'

import { cn } from '@/lib/utils'
import type { FillerPanel, FillerSide } from '../sections/sectionPlan'

export function formatPanelWidth(widthCm: number): string {
  return `${widthCm.toLocaleString('nl-NL', { maximumFractionDigits: 1 })} cm`
}

const SIDES: { value: FillerSide; label: string }[] = [
  { value: 'left', label: 'Links' },
  { value: 'right', label: 'Rechts' },
]

/**
 * Where the afwerkpaneel of a section goes. The panel itself is not a choice —
 * it is there because the rest beside the machines is too narrow for a module —
 * but the customer picks which side of the cabinet it closes off.
 */
export default function FillerPanelControl({
  panel,
  onSideChange,
  compact = false,
}: {
  panel: FillerPanel
  onSideChange: (side: FillerSide) => void
  compact?: boolean
}) {
  return (
    <div
      data-testid="filler-panel-control"
      className={cn('flex items-center justify-between gap-3', compact ? 'text-xs' : 'text-sm')}
    >
      <span className="text-muted-foreground">
        Afwerkpaneel · <span className="text-foreground tabular-nums">{formatPanelWidth(panel.widthCm)}</span>
      </span>
      <div className="flex rounded-md border border-border/50 p-0.5" role="radiogroup" aria-label="Zijde afwerkpaneel">
        {SIDES.map((side) => {
          const active = panel.side === side.value
          return (
            <button
              key={side.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSideChange(side.value)}
              className={cn(
                'rounded px-2.5 font-medium transition-colors',
                compact ? 'h-6 text-[11px]' : 'h-7 text-xs',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              {side.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
