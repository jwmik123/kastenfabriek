'use client'

import { ShoppingCart, Heart } from 'lucide-react'
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
  pricingData: unknown | null
  editItemId: string | null
  handleAddToCart: () => void
  isCapturing: boolean
  stepSummary?: { label: string; value: string }
}

export default function CanvasPricePanel({
  totalPrice,
  originalPrice,
  pricingData,
  editItemId,
  handleAddToCart,
  isCapturing,
  stepSummary,
}: CanvasPricePanelProps) {
  const deliveryWindow = getDeliveryWindow(new Date())

  return (
    <div className="hidden md:flex absolute bottom-0 left-0 right-0 items-center gap-4 bg-background/90 backdrop-blur-sm border-t border-border px-6 py-4">
      <div className="flex flex-col">
        <p className="text-xs text-muted-foreground leading-none mb-1">Totaalprijs</p>
        {originalPrice !== undefined && (
          <p className="text-xs text-muted-foreground line-through leading-none mb-0.5">
            {formatter.format(originalPrice)}
          </p>
        )}
        <p
          data-testid="price-total"
          className="font-serif text-3xl leading-tight"
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

      <button
        onClick={handleAddToCart}
        disabled={!pricingData || isCapturing}
        className="flex items-center gap-2 px-4 h-11 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
      >
        <ShoppingCart className="size-4 shrink-0" />
        {isCapturing ? 'Bezig...' : editItemId ? 'Wijzigingen opslaan' : 'Voeg toe aan winkelwagen'}
      </button>
    </div>
  )
}
