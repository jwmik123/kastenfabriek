'use client'

import { ShoppingCart, Heart } from 'lucide-react'
import { useClosetStore } from '../store'

export default function CanvasPricePanel() {
  const modules = useClosetStore((s) => s.modules)
  const pricingData = useClosetStore((s) => s.pricingData)

  const totalPrice = modules.reduce((sum, module) => {
    if (module.layoutId === null) return sum
    const layout = pricingData?.modules.find((l) => l.layoutId === module.layoutId)
    if (!layout) return sum
    return sum + (module.span === 2 ? layout.priceDouble : layout.priceSingle)
  }, 0)

  const formatted = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalPrice)

  return (
    <div className="absolute bottom-5 right-5 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm border border-border rounded-xl p-1.5 shadow-lg">
      <div className="px-3 py-1.5 min-w-[100px]">
        <p className="text-xs text-muted-foreground leading-none mb-0.5">Totaalprijs</p>
        <p className="text-lg font-semibold leading-tight">{formatted}</p>
      </div>

      <button className="flex items-center gap-2 px-4 h-11 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap">
        <ShoppingCart className="size-4 shrink-0" />
        Voeg toe aan winkelwagen
      </button>

      <button className="flex items-center justify-center w-11 h-11 rounded-lg hover:bg-primary hover:text-background transition-colors cursor-pointer">
        <Heart className="size-5" />
      </button>
    </div>
  )
}
