'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { useWasmachinekastStore } from '../store'
import { MATERIALS } from '../../kledingkast/materials'
import { addItem } from '@/lib/cart/cart-store'
import { requestCapture, resetToFrontView } from '@/lib/canvas-capture'
import { PricingEngine } from '@/lib/configurator/pricing-engine'
import { computeFreeMontage } from '@/lib/configurator/free-montage'
import { countLowDrawerFronts } from '../sections/lowDrawerFronts'
import { getWasmLayoutConfig } from '../moduleLayoutConfigs'
import { WASHER_LAYOUT_IDS } from '../moduleLayouts'
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

  const modules = useWasmachinekastStore((s) => s.modules)
  const moduleCount = useWasmachinekastStore((s) => s.moduleCount)
  const pricingData = useWasmachinekastStore((s) => s.pricingData)
  const buitenkantMaterialId = useWasmachinekastStore((s) => s.buitenkantMaterialId)
  const binnenkantMaterialId = useWasmachinekastStore((s) => s.binnenkantMaterialId)
  const doorHandleId = useWasmachinekastStore((s) => s.doorHandleId)
  const drawerHandleId = useWasmachinekastStore((s) => s.drawerHandleId)
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
  const washerSection = useWasmachinekastStore((s) => s.washerSection)
  const lowSection = useWasmachinekastStore((s) => s.lowSection)
  const topPanelThicknessMm = useWasmachinekastStore((s) => s.topPanelThicknessMm)
  const countertopMaterialId = useWasmachinekastStore((s) => s.countertopMaterialId)
  const sidePanelThickness = useWasmachinekastStore((s) => s.sidePanelThickness)

  const hasTopCabinet = needsTopCabinet()
  const topCabinetHeightCm = topCabinetHeight()

  const engine = pricingData ? new PricingEngine(pricingData) : null

  const allModules = lowSection ? [...modules, ...lowSection.modules] : modules
  const allModuleCount = lowSection ? moduleCount + lowSection.moduleCount : moduleCount

  const moduleCost = allModules.reduce((sum, module) => {
    if (module.layoutId === null || !engine) return sum
    try {
      const type = module.span === 2 ? 'double' : 'single'
      return sum + engine.getModulePrice(module.layoutId, type)
    } catch {
      return sum
    }
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
    if (!low && isWasher) pushDoorCount += count
    else regularDoorCount += count
  }

  const topCabinetDoorCount = hasTopCabinet ? moduleCount : 0
  const topCabinetDoorCost = topCabinetDoorCount * (engine?.getDoorPrice('small') ?? 0)
  const doorCost = moduleDoorCost + topCabinetDoorCost

  const drawerFrontCount = countLowDrawerFronts({
    layout,
    topLevelModules: modules,
    lowSection,
  })
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

  const handleAddToCart = async () => {
    if (!pricingData || isCapturing) return
    setIsCapturing(true)

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
        layoutName: m.layoutId != null
          ? (moduleLayouts.find((l) => l.layoutId === m.layoutId)?.name ?? null)
          : null,
        hasDoor: m.hasDoor,
        span: m.span,
        buitenkantMaterialId: m.buitenkantMaterialId,
        binnenkantMaterialId: m.binnenkantMaterialId,
        hasPowerHole: m.hasPowerHole ?? false,
      })),
      buitenkantMaterialId,
      binnenkantMaterialId,
      doorHandleId,
      doorHandleName: doorHandleId === 'none'
        ? 'Greeploos (push-to-open)'
        : (engine?.getHandle(doorHandleId)?.nameNl ?? engine?.getHandle(doorHandleId)?.name ?? null),
      drawerHandleId,
      diagonalSide: 'none',
      leftDiagStartHeight: 0,
      rightDiagStartHeight: 0,
      leftDiagTopWidth: 0,
      rightDiagTopWidth: 0,
      placementType: 'ingebouwd',
      layout,
      washerSection,
      ...(layout === 'low-only' || lowSection
        ? {
            lowSection: {
              width: layout === 'low-only' ? width : lowSection!.width,
              height: 90,
              moduleCount: layout === 'low-only' ? moduleCount : lowSection!.moduleCount,
              modules: (layout === 'low-only' ? modules : lowSection!.modules).map((m) => ({
                slotIndex: m.slotIndex,
                layoutId: m.layoutId,
                layoutName:
                  m.layoutId != null
                    ? moduleLayouts.find((l) => l.layoutId === m.layoutId)?.name ?? null
                    : null,
                hasDoor: m.hasDoor,
                span: m.span,
                buitenkantMaterialId: m.buitenkantMaterialId,
                binnenkantMaterialId: m.binnenkantMaterialId,
                hasPowerHole: m.hasPowerHole ?? false,
              })),
              topPanelThicknessMm,
              countertopMaterialId: countertopMaterialId ?? buitenkantMaterialId,
            },
          }
        : {}),
      backDiagonal: false,
      backDiagKinkHeight: 0,
      backDiagFlatSectionDepth: 0,
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

    const cartItem: CartItem = {
      id: itemId,
      addedAt: configSnapshot.capturedAt,
      kind: 'closet',
      configuration: configSnapshot,
      priceSnapshot,
      quantity: 1,
      screenshotClosedUrl,
      screenshotOpenUrl,
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
    originalPrice,
    pricingData,
    editItemId,
    handleAddToCart,
    isCapturing,
    formatter,
  }
}
