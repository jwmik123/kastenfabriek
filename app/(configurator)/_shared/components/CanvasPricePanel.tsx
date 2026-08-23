'use client'

import { useState } from 'react'
import { ChevronDown, Heart } from 'lucide-react'
import { getDeliveryWindow } from '@/lib/delivery-window'
import { cn } from '@/lib/utils'

export const formatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export interface PriceBreakdown {
  /** Everything the cabinet itself costs: modules, doors, handles, LED, extras. */
  cabinet: number
  delivery: number
  /** Already zeroed when a free-montage promo is running. */
  installation: number
  installationTierName?: string | null
  installationDays?: number
  installationPeople?: number
  freeMontageApplied?: boolean
}

export interface CanvasPricePanelProps {
  /** Grand total — cabinet plus delivery plus montage. */
  totalPrice: number
  originalPrice?: number
  breakdown?: PriceBreakdown
  stepSummary?: { label: string; value: string }
  onSave?: () => void
  isSaving?: boolean
}

function BreakdownRow({
  label,
  detail,
  amount,
  struck = false,
}: {
  label: string
  detail?: string
  amount: number
  struck?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-1.5">
      <div className="flex flex-col">
        <span className="text-sm">{label}</span>
        {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
      </div>
      <span className={cn('text-sm tabular-nums shrink-0', struck && 'text-muted-foreground line-through')}>
        {formatter.format(amount)}
      </span>
    </div>
  )
}

export default function CanvasPricePanel({
  totalPrice,
  originalPrice,
  breakdown,
  stepSummary,
  onSave,
  isSaving = false,
}: CanvasPricePanelProps) {
  const [open, setOpen] = useState(false)
  const deliveryWindow = getDeliveryWindow(new Date())

  // Nothing picked yet: quoting the bare delivery fee as a "total" reads as a
  // charge for an empty cabinet, so hold the panel at zero until there is a
  // cabinet to deliver and fit.
  const configured = !breakdown || breakdown.cabinet > 0
  const displayTotal = configured ? totalPrice : 0

  // Tier name plus crew size / duration, so the montage amount reads as work
  // done rather than an arbitrary surcharge.
  const montageDetail = breakdown
    ? [
        breakdown.installationTierName,
        breakdown.installationPeople ? `${breakdown.installationPeople} monteurs` : null,
        breakdown.installationDays
          ? `${breakdown.installationDays} ${breakdown.installationDays === 1 ? 'dag' : 'dagen'}`
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : ''

  return (
    <div className="hidden md:flex absolute bottom-0 left-0 right-0 items-center gap-4 bg-background/90 backdrop-blur-sm border-t border-border px-6 py-4">
      <div className="flex flex-col">
        <p className="text-xs text-muted-foreground leading-none mb-1">
          Totaalprijs · incl. levering &amp; montage
        </p>
        {configured && originalPrice !== undefined && (
          <p className="text-xs text-red-600 line-through leading-none mb-0.5">
            {formatter.format(originalPrice)}
          </p>
        )}
        <p
          data-testid="price-total"
          className="text-3xl font-semibold leading-tight text-green-700"
        >
          {formatter.format(displayTotal)}
        </p>

        {breakdown && configured && (
          <button
            type="button"
            data-testid="price-breakdown-toggle"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <span className="tabular-nums">
              Kast {formatter.format(breakdown.cabinet)} · Levering {formatter.format(breakdown.delivery)} ·
              Montage{' '}
              {breakdown.freeMontageApplied ? 'gratis' : formatter.format(breakdown.installation)}
            </span>
            <ChevronDown className={cn('size-3.5 shrink-0 transition-transform', open && 'rotate-180')} />
          </button>
        )}
      </div>

      <div className="h-10 w-px bg-border shrink-0" />

      <div className="flex flex-col">
        <p className="text-xs text-muted-foreground leading-none mb-1">Geschatte aankomst</p>
        <p className="text-sm font-medium leading-tight">{deliveryWindow}</p>
      </div>

      {stepSummary && (
        <>
          <div className="h-10 w-px bg-border shrink-0" />
          <div data-testid="price-step-summary" className="flex flex-col">
            <p className="text-xs text-muted-foreground leading-none mb-1">{stepSummary.label}</p>
            <p className="text-sm font-medium leading-tight">{stepSummary.value}</p>
          </div>
        </>
      )}

      <div className="flex-1" />

      <button
        type="button"
        onClick={onSave}
        disabled={!onSave || isSaving}
        className="flex items-center gap-2 px-4 h-11 rounded-lg text-sm font-medium border border-border bg-transparent hover:bg-accent transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-default"
      >
        <Heart className="size-4 shrink-0" />
        {isSaving ? 'Bezig...' : 'Bewaar'}
      </button>

      {breakdown && configured && open && (
        <div
          data-testid="price-breakdown"
          className="absolute bottom-full left-6 mb-2 w-80 rounded-lg border border-border bg-background shadow-lg px-4 py-3"
        >
          <BreakdownRow label="Kast" amount={breakdown.cabinet} />
          <BreakdownRow label="Levering" detail={deliveryWindow} amount={breakdown.delivery} />
          {breakdown.freeMontageApplied ? (
            <BreakdownRow
              label="Montage — nu gratis"
              detail={montageDetail || undefined}
              amount={0}
            />
          ) : (
            <BreakdownRow
              label="Montage"
              detail={montageDetail || undefined}
              amount={breakdown.installation}
            />
          )}
          <div className="border-t border-border mt-1.5 pt-2 flex items-baseline justify-between gap-6">
            <span className="text-sm font-medium">Totaal</span>
            <span className="text-sm font-semibold tabular-nums">{formatter.format(totalPrice)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Montage wordt altijd door onze eigen monteurs gedaan en zit bij de prijs inbegrepen.
          </p>
        </div>
      )}
    </div>
  )
}
