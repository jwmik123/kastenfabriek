'use client'

import { ShoppingCart, Heart } from 'lucide-react'
import { useClosetStore } from '../store'
import { MATERIALS } from '../materials'

const formatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export default function CanvasPricePanel() {
  const modules = useClosetStore((s) => s.modules)
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const pricingData = useClosetStore((s) => s.pricingData)
  const buitenkantMaterialId = useClosetStore((s) => s.buitenkantMaterialId)
  const doorHandleId = useClosetStore((s) => s.doorHandleId)
  const height = useClosetStore((s) => s.height)
  const hasTopCabinet = height > 275

  // --- Module interior costs ---
  const moduleCost = modules.reduce((sum, module) => {
    if (module.layoutId === null) return sum
    const layout = pricingData?.modules.find((l) => l.layoutId === module.layoutId)
    if (!layout) return sum
    return sum + (module.span === 2 ? layout.priceDouble : layout.priceSingle)
  }, 0)

  // --- Door panel costs ---
  // Door price depends on the module's effective buitenkant material type:
  // texture (veneer) → veneer door, color → standard-color door
  const standardDoorPrice = pricingData?.doors.find((d) => d.variant === 'standard')?.price ?? 0
  const veneerDoorPrice = pricingData?.doors.find((d) => d.variant === 'veneer')?.price ?? 0
  const smallDoorPrice = pricingData?.doors.find((d) => d.variant === 'small')?.price ?? 0

  let moduleDoorCost = 0
  let moduleDoorCount = 0

  for (const module of modules) {
    if (!module.hasDoor || module.layoutId === null) continue
    const effectiveMaterialId = module.buitenkantMaterialId ?? buitenkantMaterialId
    const material = MATERIALS.find((m) => m.id === effectiveMaterialId)
    const doorPrice = material?.type === 'texture' ? veneerDoorPrice : standardDoorPrice
    const count = module.span === 2 ? 2 : 1
    moduleDoorCost += doorPrice * count
    moduleDoorCount += count
  }

  // Top cabinet doors are always small variant
  const topCabinetDoorCount = hasTopCabinet ? moduleCount : 0
  const topCabinetDoorCost = topCabinetDoorCount * smallDoorPrice

  const totalDoorCount = moduleDoorCount + topCabinetDoorCount

  // --- Handle / push-to-open costs ---
  const handlePrice = pricingData?.accessories.find((a) => a.id === 'handle')?.price ?? 0
  const pushToOpenPrice = pricingData?.accessories.find((a) => a.id === 'push-to-open')?.price ?? 0
  const mechanismCost = totalDoorCount * (doorHandleId === 'none' ? pushToOpenPrice : handlePrice)

  const totalPrice = moduleCost + moduleDoorCost + topCabinetDoorCost + mechanismCost

  return (
    <div className="absolute bottom-5 right-5 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm border border-border rounded-xl p-1.5 shadow-lg">
      <div className="px-3 py-1.5 min-w-[100px]">
        <p className="text-xs text-muted-foreground leading-none mb-0.5">Totaalprijs</p>
        <p className="text-lg font-semibold leading-tight">{formatter.format(totalPrice)}</p>
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
