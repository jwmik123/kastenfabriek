'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { useWasmachinekastStore } from '../store'
import { addItem } from '@/lib/cart/cart-store'
import { addWishlistItem } from '@/lib/wishlist/wishlist-store'
import { requestCapture, resetToFrontView } from '@/lib/canvas-capture'
import { useWasmPricing } from './useWasmPricing'
import { buildWasmConfigSnapshot, resolveHandleName } from '../wasmSnapshot'
import type { CartItem, PriceSnapshot } from '@/lib/cart/types'

export const formatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function useCartPrice() {
  const [isCapturing, setIsCapturing] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const editItemId = searchParams.get('edit')
  const { data: session } = useSession()

  const modules = useWasmachinekastStore((s) => s.modules)
  const moduleCount = useWasmachinekastStore((s) => s.moduleCount)
  const pricingData = useWasmachinekastStore((s) => s.pricingData)
  const buitenkantMaterialId = useWasmachinekastStore((s) => s.buitenkantMaterialId)
  const binnenkantMaterialId = useWasmachinekastStore((s) => s.binnenkantMaterialId)
  const doorHandleId = useWasmachinekastStore((s) => s.doorHandleId)
  const lightStripsEnabled = useWasmachinekastStore((s) => s.lightStripsEnabled)
  const width = useWasmachinekastStore((s) => s.width)
  const height = useWasmachinekastStore((s) => s.height)
  const depth = useWasmachinekastStore((s) => s.depth)
  const doorHandleMaterial = useWasmachinekastStore((s) => s.doorHandleMaterial)
  const doorsExtendToFloor = useWasmachinekastStore((s) => s.doorsExtendToFloor)
  const needsTopCabinet = useWasmachinekastStore((s) => s.needsTopCabinet)
  const topCabinetHeight = useWasmachinekastStore((s) => s.topCabinetHeight)
  const moduleLayouts = useWasmachinekastStore((s) => s.moduleLayouts)
  const layout = useWasmachinekastStore((s) => s.layout)
  const lowSection = useWasmachinekastStore((s) => s.lowSection)
  const topPanelThicknessMm = useWasmachinekastStore((s) => s.topPanelThicknessMm)
  const countertopMaterialId = useWasmachinekastStore((s) => s.countertopMaterialId)
  const sidePanelThickness = useWasmachinekastStore((s) => s.sidePanelThickness)
  const placementType = useWasmachinekastStore((s) => s.placementType)
  const washerModules = useWasmachinekastStore((s) => s.washerModules)

  const hasTopCabinet = needsTopCabinet()
  const topCabinetHeightCm = topCabinetHeight()

  const pricing = useWasmPricing()

  const {
    moduleCost,
    doorCost,
    mechanismCost,
    ledCost,
    powerHoleCost,
    sidePanelCost,
    deliveryCost,
    cabinetCost: totalPrice,
    subtotal,
    installationBasis,
    installationTier,
    installationCost,
    freeMontageApplied,
    freeMontageDiscount,
    originalPrice,
    grandTotal,
  } = pricing.totals
  const drawerHandleId = pricing.handles.drawerHandleId

  // Builds the full cart item for the current configuration, including the
  // two 3D captures (doors closed + open). Shared by cart and wishlist saves.
  const buildItem = async (itemId: string): Promise<CartItem> => {
    const configSnapshot = buildWasmConfigSnapshot({
      id: itemId,
      width,
      height,
      depth,
      moduleCount,
      modules,
      moduleLayouts,
      layout,
      lowSection,
      washerModules,
      topPanelThicknessMm,
      countertopMaterialId,
      buitenkantMaterialId,
      binnenkantMaterialId,
      doorHandleId,
      doorHandleName: resolveHandleName(doorHandleId, pricingData?.handles),
      drawerHandleId,
      drawerHandleName: resolveHandleName(drawerHandleId, pricingData?.handles),
      doorHandleMaterial,
      doorsExtendToFloor,
      lightStripsEnabled,
      sidePanelThickness,
      placementType,
      hasTopCabinet,
      topCabinetHeightCm,
    })

    const priceSnapshot: PriceSnapshot = {
      calculatedAt: new Date().toISOString(),
      currency: 'EUR',
      moduleCost,
      doorCost,
      mechanismCost,
      ledCost,
      powerHoleCost,
      deliveryCost,
      subtotal,
      installationBasis,
      installationTierName: installationTier?.name ?? null,
      installationCost,
      slopedBackWallSurcharge: 0,
      slopedSideWallSurcharge: 0,
      sidePanelCost,
      freeMontageApplied,
      freeMontageDiscount,
      total: grandTotal,
    }

    const H = useWasmachinekastStore.getState().height / 100
    resetToFrontView(H)

    useWasmachinekastStore.setState({ doorsOpen: false })
    await new Promise<void>((r) => setTimeout(r, 700))
    const screenshotClosedUrl = (await requestCapture()) ?? undefined

    useWasmachinekastStore.setState({ doorsOpen: true })
    await new Promise<void>((r) => setTimeout(r, 700))
    const screenshotOpenUrl = (await requestCapture()) ?? undefined

    return {
      id: itemId,
      addedAt: configSnapshot.capturedAt,
      kind: 'closet',
      configuration: configSnapshot,
      priceSnapshot,
      quantity: 1,
      screenshotClosedUrl,
      screenshotOpenUrl,
    }
  }

  const handleAddToCart = async () => {
    if (!pricingData || isCapturing) return
    setIsCapturing(true)

    const cartItem = await buildItem(editItemId ?? crypto.randomUUID())
    addItem(cartItem)

    if (session?.user) {
      router.push('/cart')
    } else {
      router.push('/login?callbackUrl=/cart')
    }
  }

  const handleAddToWishlist = async () => {
    if (!pricingData || isCapturing) return
    setIsCapturing(true)

    const item = await buildItem(crypto.randomUUID())
    addWishlistItem(item)

    router.push('/wishlist')
  }

  return {
    totalPrice,
    grandTotal,
    originalPrice,
    deliveryCost,
    installationCost,
    installationTier,
    freeMontageApplied,
    pricingData,
    editItemId,
    handleAddToCart,
    handleAddToWishlist,
    isCapturing,
    formatter,
  }
}
