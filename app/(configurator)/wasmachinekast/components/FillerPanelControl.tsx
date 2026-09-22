'use client'

import { cn } from '@/lib/utils'
import type { FillerPanel, FillerSide } from '../sections/sectionPlan'

export function formatPanelWidth(widthCm: number): string {
  return `${widthCm.toLocaleString('nl-NL', { maximumFractionDigits: 1 })} cm`
}

/** "9,2 cm rechts" / "2 × 4,6 cm (beide zijden)" — how a panel reads in copy. */
export function describeFillerPanelSide(panel: FillerPanel): string {
  if (panel.side === 'both') return `2 × ${formatPanelWidth(panel.widthCm / 2)} (beide zijden)`
  return `${formatPanelWidth(panel.widthCm)} ${panel.side === 'left' ? 'links' : 'rechts'}`
}

const SIDES: { value: FillerSide; label: string }[] = [
  { value: 'left', label: 'Links' },
  { value: 'both', label: 'Beide' },
  { value: 'right', label: 'Rechts' },
]

/**
 * Where the afwerkpaneel of a section goes. The panel itself is not a choice —
 * it is there because the rest beside the machines is too narrow for a module —
 * but the customer picks which side of the cabinet it closes off, or splits it
 * over both sides when each half is still a real panel.
 */
export default function FillerPanelControl({
  panel,
  onSideChange,
  canSplit = true,
  minPanelCm,
  compact = false,
}: {
  panel: FillerPanel
  onSideChange: (side: FillerSide) => void
  /** False when half the rest would be narrower than the minimum panel width. */
  canSplit?: boolean
  minPanelCm?: number
  compact?: boolean
}) {
  return (
    <div data-testid="filler-panel-control" className={cn('space-y-1.5', compact ? 'text-xs' : 'text-sm')}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">
          Afwerkpaneel ·{' '}
          <span className="text-foreground tabular-nums">{describeFillerPanelSide(panel)}</span>
        </span>
        <div className="flex rounded-md border border-border/50 p-0.5" role="radiogroup" aria-label="Zijde afwerkpaneel">
          {SIDES.map((side) => {
            const active = panel.side === side.value
            const disabled = side.value === 'both' && !canSplit
            return (
              <button
                key={side.value}
                type="button"
                role="radio"
                aria-checked={active}
                aria-disabled={disabled || undefined}
                disabled={disabled}
                onClick={() => !disabled && onSideChange(side.value)}
                className={cn(
                  'rounded px-2.5 font-medium transition-colors',
                  compact ? 'h-6 text-[11px]' : 'h-7 text-xs',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : disabled
                      ? 'text-muted-foreground/40 cursor-not-allowed'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                {side.label}
              </button>
            )
          })}
        </div>
      </div>
      {!canSplit && (
        <p className="text-[11px] text-muted-foreground/70">
          Verdelen over beide zijden kan pas vanaf {formatPanelWidth((minPanelCm ?? 0) * 2)} restruimte.
        </p>
      )}
    </div>
  )
}
