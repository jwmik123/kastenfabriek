'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { useClosetStore } from '../store'
import { MATERIALS } from '../materials'
import { addItem } from '@/lib/cart/cart-store'
import { getLatestCapture } from '@/lib/canvas-capture'
import type { CartItem, ClosetConfigSnapshot, PriceSnapshot } from '@/lib/cart/types'

export const formatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function useCartPrice() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editItemId = searchParams.get('edit')
  const { data: session } = useSession()

  const modules = useClosetStore((s) => s.modules)
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const pricingData = useClosetStore((s) => s.pricingData)
  const buitenkantMaterialId = useClosetStore((s) => s.buitenkantMaterialId)
  const binnenkantMaterialId = useClosetStore((s) => s.binnenkantMaterialId)
  const doorHandleId = useClosetStore((s) => s.doorHandleId)
  const width = useClosetStore((s) => s.width)
  const height = useClosetStore((s) => s.height)
  const depth = useClosetStore((s) => s.depth)
  const diagonalSide = useClosetStore((s) => s.diagonalSide)
  const leftDiagStartHeight = useClosetStore((s) => s.leftDiagStartHeight)
  const rightDiagStartHeight = useClosetStore((s) => s.rightDiagStartHeight)
  const leftDiagTopWidth = useClosetStore((s) => s.leftDiagTopWidth)
  const rightDiagTopWidth = useClosetStore((s) => s.rightDiagTopWidth)
  const needsTopCabinet = useClosetStore((s) => s.needsTopCabinet)
  const topCabinetHeight = useClosetStore((s) => s.topCabinetHeight)
  const moduleLayouts = useClosetStore((s) => s.moduleLayouts)

  const hasTopCabinet = needsTopCabinet()
  const topCabinetHeightCm = topCabinetHeight()

  // --- Module interior costs ---
  const moduleCost = modules.reduce((sum, module) => {
    if (module.layoutId === null) return sum
    const layout = pricingData?.modules.find((l) => l.layoutId === module.layoutId)
    if (!layout) return sum
    return sum + (module.span === 2 ? layout.priceDouble : layout.priceSingle)
  }, 0)

  // --- Door panel costs ---
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

  const doorCost = moduleDoorCost + topCabinetDoorCost
  const totalDoorCount = moduleDoorCount + topCabinetDoorCount

  // --- Handle / push-to-open costs ---
  const handlePrice = pricingData?.accessories.find((a) => a.id === 'handle')?.price ?? 0
  const pushToOpenPrice = pricingData?.accessories.find((a) => a.id === 'push-to-open')?.price ?? 0
  const mechanismCost = totalDoorCount * (doorHandleId === 'none' ? pushToOpenPrice : handlePrice)

  // --- Delivery & Installation ---
  const deliveryCost = pricingData?.config.deliveryPrice ?? 95
  const subtotal = moduleCost + doorCost + mechanismCost + deliveryCost
  const installationTier =
    pricingData?.installation.find((t) => subtotal >= t.minTotal && subtotal < t.maxTotal) ?? null
  const installationCost = installationTier?.price ?? 0

  const totalPrice = moduleCost + doorCost + mechanismCost
  const grandTotal = subtotal + installationCost

  const handleAddToCart = () => {
    if (!pricingData) return

    const itemId = editItemId ?? crypto.randomUUID()

    const configSnapshot: ClosetConfigSnapshot = {
      id: itemId,
      capturedAt: new Date().toISOString(),
      widthCm: width,
      heightCm: height,
      depthCm: depth,
      moduleCount,
      modules: modules.map((m) => ({
        slotIndex: m.slotIndex,
        layoutId: m.layoutId,
        layoutName:
          m.layoutId != null
            ? (moduleLayouts.find((l) => l.layoutId === m.layoutId)?.name ?? null)
            : null,
        hasDoor: m.hasDoor,
        span: m.span,
        buitenkantMaterialId: m.buitenkantMaterialId,
        binnenkantMaterialId: m.binnenkantMaterialId,
      })),
      buitenkantMaterialId,
      binnenkantMaterialId,
      doorHandleId,
      diagonalSide,
      leftDiagStartHeight,
      rightDiagStartHeight,
      leftDiagTopWidth,
      rightDiagTopWidth,
      hasTopCabinet,
      topCabinetHeightCm,
    }

    const priceSnapshot: PriceSnapshot = {
      calculatedAt: new Date().toISOString(),
      currency: 'EUR',
      moduleCost,
      doorCost,
      mechanismCost,
      ledCost: 0,
      deliveryCost,
      subtotal,
      installationTierName: installationTier?.name ?? null,
      installationCost,
      total: grandTotal,
    }

    const cartItem: CartItem = {
      id: itemId,
      addedAt: configSnapshot.capturedAt,
      configuration: configSnapshot,
      priceSnapshot,
      quantity: 1,
      screenshotDataUrl: getLatestCapture() ?? undefined,
    }

    addItem(cartItem)

    if (session?.user) {
      router.push('/cart')
    } else {
      router.push('/login?callbackUrl=/cart')
    }
  }

  return {
    totalPrice,
    grandTotal,
    pricingData,
    editItemId,
    handleAddToCart,
    formatter,
  }
}
