'use client'

import { ShoppingCart, Heart } from 'lucide-react'
import { getDeliveryWindow } from '@/lib/delivery-window'

export const formatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

interface CanvasPricePanelProps {
  totalPrice: number
  pricingData: unknown | null
  editItemId: string | null
  handleAddToCart: () => void
  isCapturing: boolean
}

export default function CanvasPricePanel({
  totalPrice,
  pricingData,
  editItemId,
  handleAddToCart,
  isCapturing,
}: CanvasPricePanelProps) {
  const deliveryWindow = getDeliveryWindow(new Date())

  return (
    <div className="hidden md:flex absolute bottom-5 right-5 items-center gap-1.5 bg-background/90 backdrop-blur-sm border border-border rounded-xl p-1.5 shadow-lg">
      <div className="px-3 py-1.5 min-w-[100px]">
        <p className="text-xs text-muted-foreground leading-none mb-0.5">Totaalprijs</p>
        <p className="text-lg font-semibold leading-tight">{formatter.format(totalPrice)}</p>
      </div>

      <div className="px-3 py-1.5 min-w-[120px]">
        <p className="text-xs text-muted-foreground leading-none mb-0.5">Geschatte aankomst</p>
        <p className="text-sm font-medium leading-tight">{deliveryWindow}</p>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={!pricingData || isCapturing}
        className="flex items-center gap-2 px-4 h-11 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
      >
        <ShoppingCart className="size-4 shrink-0" />
        {isCapturing ? 'Bezig...' : editItemId ? 'Wijzigingen opslaan' : 'Voeg toe aan winkelwagen'}
      </button>

      <button className="flex items-center justify-center w-11 h-11 rounded-lg hover:bg-primary hover:text-background transition-colors cursor-pointer">
        <Heart className="size-5" />
      </button>
    </div>
  )
}
