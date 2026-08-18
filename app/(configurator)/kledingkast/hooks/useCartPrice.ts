'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { useClosetStore } from '../store'
import { MATERIALS } from '../materials'
import { addItem } from '@/lib/cart/cart-store'
import { addWishlistItem } from '@/lib/wishlist/wishlist-store'
import { requestCapture, resetToFrontView } from '@/lib/canvas-capture'
import { PricingEngine } from '@/lib/configurator/pricing-engine'
import { computeFreeMontage } from '@/lib/configurator/free-montage'
import type { CartItem, ClosetConfigSnapshot, PriceSnapshot } from '@/lib/cart/types'

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

  const modules = useClosetStore((s) => s.modules)
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const pricingData = useClosetStore((s) => s.pricingData)
  const buitenkantMaterialId = useClosetStore((s) => s.buitenkantMaterialId)
  const binnenkantMaterialId = useClosetStore((s) => s.binnenkantMaterialId)
  const doorHandleId = useClosetStore((s) => s.doorHandleId)
  const lightStripsEnabled = useClosetStore((s) => s.lightStripsEnabled)
  const sidePanelThickness = useClosetStore((s) => s.sidePanelThickness)
  const width = useClosetStore((s) => s.width)
  const height = useClosetStore((s) => s.height)
  const depth = useClosetStore((s) => s.depth)
  const diagonalSide = useClosetStore((s) => s.diagonalSide)
  const leftDiagStartHeight = useClosetStore((s) => s.leftDiagStartHeight)
  const rightDiagStartHeight = useClosetStore((s) => s.rightDiagStartHeight)
  const leftDiagTopWidth = useClosetStore((s) => s.leftDiagTopWidth)
  const rightDiagTopWidth = useClosetStore((s) => s.rightDiagTopWidth)
  const placementType = useClosetStore((s) => s.placementType)
  const backDiagonal = useClosetStore((s) => s.backDiagonal)
  const backDiagKinkHeight = useClosetStore((s) => s.backDiagKinkHeight)
  const backDiagFlatSectionDepth = useClosetStore((s) => s.backDiagFlatSectionDepth)
  const doorHandleMaterial = useClosetStore((s) => s.doorHandleMaterial)
  const doorsExtendToFloor = useClosetStore((s) => s.doorsExtendToFloor)
  const needsTopCabinet = useClosetStore((s) => s.needsTopCabinet)
  const topCabinetHeight = useClosetStore((s) => s.topCabinetHeight)
  const moduleLayouts = useClosetStore((s) => s.moduleLayouts)

  const hasTopCabinet = needsTopCabinet()
  const topCabinetHeightCm = topCabinetHeight()

  const engine = pricingData ? new PricingEngine(pricingData) : null

  // --- Module interior costs ---
  const moduleCost = modules.reduce((sum, module) => {
    if (module.layoutId === null || !engine) return sum
    try {
      const type = module.span === 2 ? 'double' : 'single'
      return sum + engine.getModulePrice(module.layoutId, type)
    } catch {
      return sum
    }
  }, 0)

  // --- Door panel costs ---
  let moduleDoorCost = 0
  let moduleDoorCount = 0

  for (const module of modules) {
    if (!module.hasDoor || module.layoutId === null || !engine) continue
    const effectiveMaterialId = module.buitenkantMaterialId ?? buitenkantMaterialId
    const material = MATERIALS.find((m) => m.id === effectiveMaterialId)
    const variant = material?.type === 'texture' ? 'veneer' : 'standard'
    const count = module.span === 2 ? 2 : 1
    moduleDoorCost += engine.getDoorPrice(variant) * count
    moduleDoorCount += count
  }

  // Top cabinet doors are always small variant
  const topCabinetDoorCount = hasTopCabinet ? moduleCount : 0
  const topCabinetDoorCost = topCabinetDoorCount * (engine?.getDoorPrice('small') ?? 0)

  const doorCost = moduleDoorCost + topCabinetDoorCost
  const totalDoorCount = moduleDoorCount + topCabinetDoorCount

  // --- Handle / push-to-open costs ---
  const mechanismCost = engine ? totalDoorCount * engine.getHandlePrice(doorHandleId) : 0

  // --- LED lighting ---
  const ledCost = lightStripsEnabled && engine ? engine.calculateLedPrice(moduleCount) : 0

  // --- Power holes (per module) ---
  const powerHoleCount = modules.filter((m) => m.hasPowerHole).length
  const powerHoleCost = powerHoleCount > 0 && engine ? powerHoleCount * engine.getAccessoryPrice('power-outlet') : 0

  // --- Side panels upgrade (issue 072) — 18mm = standard, 36mm = paid upgrade ---
  const sidePanelCost = sidePanelThickness === '36mm' && engine
    ? engine.getAccessoryPrice('side-panels-36mm')
    : 0

  // --- Sloped-wall surcharges (issue 069) ---
  const surcharges = engine
    ? engine.calculateSurchargesFromSnapshot({ backDiagonal, diagonalSide })
    : { slopedBackWallSurcharge: 0, slopedSideWallSurcharge: 0, total: 0 }
  const slopedBackWallSurcharge = surcharges.slopedBackWallSurcharge
  const slopedSideWallSurcharge = surcharges.slopedSideWallSurcharge

  // --- Delivery & Installation ---
  const deliveryCost = engine?.deliveryPrice ?? 95
  const subtotal =
    moduleCost +
    doorCost +
    mechanismCost +
    ledCost +
    powerHoleCost +
    sidePanelCost +
    slopedBackWallSurcharge +
    slopedSideWallSurcharge +
    deliveryCost
  const installationTier = engine?.getInstallationTier(subtotal) ?? null
  const freeMontage = pricingData?.config.freeMontage ?? false
  const { effectiveInstallationCost, freeMontageDiscount, freeMontageApplied, originalPrice, grandTotal } =
    computeFreeMontage({ subtotal, installationTier, freeMontage })
  const installationCost = effectiveInstallationCost

  const totalPrice =
    moduleCost +
    doorCost +
    mechanismCost +
    ledCost +
    powerHoleCost +
    sidePanelCost +
    slopedBackWallSurcharge +
    slopedSideWallSurcharge

  // Builds the full cart item for the current configuration, including the
  // two 3D captures (doors closed + open). Shared by cart and wishlist saves.
  const buildItem = async (itemId: string): Promise<CartItem> => {
    const configSnapshot: ClosetConfigSnapshot = {
      id: itemId,
      capturedAt: new Date().toISOString(),
      productType: 'kledingkast',
      widthCm: width,
      heightCm: height,
      depthCm: depth,
      moduleCount,
      modules: modules.map((m) => {
        const layout = m.layoutId != null
          ? moduleLayouts.find((l) => l.layoutId === m.layoutId)
          : undefined
        return {
          slotIndex: m.slotIndex,
          layoutId: m.layoutId,
          layoutName: layout?.name ?? null,
          layoutContents: layout
            ? {
                shelves: layout.contents.shelves,
                rods: layout.contents.rods,
                drawers: layout.contents.drawers,
              }
            : undefined,
          hasDoor: m.hasDoor,
          span: m.span,
          buitenkantMaterialId: m.buitenkantMaterialId,
          binnenkantMaterialId: m.binnenkantMaterialId,
          hasPowerHole: m.hasPowerHole ?? false,
        }
      }),
      buitenkantMaterialId,
      binnenkantMaterialId,
      doorHandleId,
      doorHandleName: doorHandleId === 'none'
        ? 'Greeploos (push-to-open)'
        : (engine?.getHandle(doorHandleId)?.nameNl ?? engine?.getHandle(doorHandleId)?.name ?? null),
      diagonalSide,
      leftDiagStartHeight,
      rightDiagStartHeight,
      leftDiagTopWidth,
      rightDiagTopWidth,
      placementType,
      backDiagonal,
      backDiagKinkHeight,
      backDiagFlatSectionDepth,
      doorHandleMaterial,
      doorsExtendToFloor,
      lightStripsEnabled,
      sidePanelThickness,
      hasTopCabinet,
      topCabinetHeightCm,
    }

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
      installationTierName: installationTier?.name ?? null,
      installationCost,
      slopedBackWallSurcharge,
      slopedSideWallSurcharge,
      sidePanelCost,
      freeMontageApplied,
      freeMontageDiscount,
      total: grandTotal,
    }

    const H = useClosetStore.getState().height / 100
    resetToFrontView(H)

    useClosetStore.setState({ doorsOpen: false })
    await new Promise<void>((r) => setTimeout(r, 700))
    const screenshotClosedUrl = (await requestCapture()) ?? undefined

    useClosetStore.setState({ doorsOpen: true })
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
    pricingData,
    editItemId,
    handleAddToCart,
    handleAddToWishlist,
    isCapturing,
    formatter,
  }
}
