'use client'

import { Heart } from 'lucide-react'
import { getDeliveryWindow } from '@/lib/delivery-window'

export const formatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export interface CanvasPricePanelProps {
  totalPrice: number
  originalPrice?: number
  stepSummary?: { label: string; value: string }
}

export default function CanvasPricePanel({
  totalPrice,
  originalPrice,
  stepSummary,
}: CanvasPricePanelProps) {
  const deliveryWindow = getDeliveryWindow(new Date())

  return (
    <div className="hidden md:flex absolute bottom-0 left-0 right-0 items-center gap-4 bg-background/90 backdrop-blur-sm border-t border-border px-6 py-4">
      <div className="flex flex-col">
        <p className="text-xs text-muted-foreground leading-none mb-1">Totaalprijs</p>
        {originalPrice !== undefined && (
          <p className="text-xs text-red-600 line-through leading-none mb-0.5">
            {formatter.format(originalPrice)}
          </p>
        )}
        <p
          data-testid="price-total"
          className="text-3xl font-semibold leading-tight text-green-700"
        >
          {formatter.format(totalPrice)}
        </p>
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
        className="flex items-center gap-2 px-4 h-11 rounded-lg text-sm font-medium border border-border bg-transparent hover:bg-accent transition-colors cursor-pointer whitespace-nowrap"
      >
        <Heart className="size-4 shrink-0" />
        Bewaar
      </button>
    </div>
  )
}
