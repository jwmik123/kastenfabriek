'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { useWasmachinekastStore } from '../store'
import { MATERIALS } from '../../kledingkast/materials'
import { addItem } from '@/lib/cart/cart-store'
import { addWishlistItem } from '@/lib/wishlist/wishlist-store'
import { requestCapture, resetToFrontView } from '@/lib/canvas-capture'
import { PricingEngine } from '@/lib/configurator/pricing-engine'
import { computeFreeMontage } from '@/lib/configurator/free-montage'
import { countDrawerFronts } from '../sections/drawerFronts'
import { getWasmLayoutConfig } from '../moduleLayoutConfigs'
import { WASHER_LAYOUT_IDS } from '../moduleLayouts'
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

  const engine = pricingData ? new PricingEngine(pricingData) : null

  const allModules = lowSection ? [...modules, ...lowSection.modules] : modules
  const allModuleCount = lowSection ? moduleCount + lowSection.moduleCount : moduleCount

  const moduleCost = allModules.reduce((sum, module) => {
    if (module.layoutId === null || !engine) return sum
    const type = module.span === 2 ? 'double' : 'single'
    return sum + engine.getModulePrice(module.layoutId, type)
  }, 0)

  // Doors carry the door handle; only the door above the washer and the top
  // cabinet are push-to-open. Lage-kast lowFronts layouts render drawer
  // fronts instead of a door (no door cost) with their own handle choice.
  const isLowOnly = layout === 'low-only'
  const sectionedModules = [
    ...(isLowOnly ? [] : modules).map((m) => ({ module: m, low: false })),
    ...(isLowOnly ? modules : lowSection?.modules ?? []).map((m) => ({ module: m, low: true })),
  ]

  let moduleDoorCost = 0
  let regularDoorCount = 0
  let pushDoorCount = 0

  for (const { module, low } of sectionedModules) {
    if (!module.hasDoor || module.layoutId === null || !engine) continue
    const cfg = getWasmLayoutConfig(module.layoutId)
    const isWasher = WASHER_LAYOUT_IDS.has(module.layoutId)
    if (low && (isWasher || cfg?.lowFronts)) continue
    const effectiveMaterialId = module.buitenkantMaterialId ?? buitenkantMaterialId
    const material = MATERIALS.find((m) => m.id === effectiveMaterialId)
    const variant = material?.type === 'texture' ? 'veneer' : 'standard'
    const count = module.span === 2 ? 2 : 1
    moduleDoorCost += engine.getDoorPrice(variant) * count
    // A washer door and a module the customer set to push-to-open both go
    // without a handle.
    if ((!low && isWasher) || module.pushToOpen) pushDoorCount += count
    else regularDoorCount += count
  }

  const topCabinetDoorCount = hasTopCabinet ? moduleCount : 0
  const topCabinetDoorCost = topCabinetDoorCount * (engine?.getDoorPrice('small') ?? 0)
  const doorCost = moduleDoorCost + topCabinetDoorCost

  const drawerFrontCount = countDrawerFronts({
    layout,
    topLevelModules: modules,
    lowSection,
  })
  // Drawer fronts — lage kast and the drawers under a washing machine alike —
  // carry the same handle as the doors, unless that handle does not fit a
  // drawer front, then they stay push-to-open.
  const drawerHandleId =
    pricingData?.handles.find((h) => h.id === doorHandleId)?.fitsLowModule === false
      ? 'none'
      : doorHandleId
  const mechanismCost = engine
    ? regularDoorCount * engine.getHandlePrice(doorHandleId) +
      (pushDoorCount + topCabinetDoorCount) * engine.getHandlePrice('none') +
      drawerFrontCount * engine.getHandlePrice(drawerHandleId)
    : 0
  const ledCost = lightStripsEnabled && engine ? engine.calculateLedPrice(allModuleCount) : 0

  const powerHoleCount = allModules.filter((m) => m.hasPowerHole).length
  const powerHoleCost = powerHoleCount > 0 && engine ? powerHoleCount * engine.getAccessoryPrice('power-outlet') : 0

  // --- Side panels upgrade — 18mm = standard, 36mm = paid upgrade ---
  const sidePanelCost = sidePanelThickness === '36mm' && engine
    ? engine.getAccessoryPrice('side-panels-36mm')
    : 0

  const deliveryCost = engine?.deliveryPrice ?? 95
  const subtotal = moduleCost + doorCost + mechanismCost + ledCost + powerHoleCost + sidePanelCost + deliveryCost
  const installationTier = engine?.getInstallationTier(subtotal) ?? null
  const freeMontage = pricingData?.config.freeMontage ?? false
  const { effectiveInstallationCost, freeMontageDiscount, freeMontageApplied, originalPrice, grandTotal } =
    computeFreeMontage({ subtotal, installationTier, freeMontage })
  const installationCost = effectiveInstallationCost

  const totalPrice = moduleCost + doorCost + mechanismCost + ledCost + powerHoleCost + sidePanelCost

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
    pricingData,
    editItemId,
    handleAddToCart,
    handleAddToWishlist,
    isCapturing,
    formatter,
  }
}
