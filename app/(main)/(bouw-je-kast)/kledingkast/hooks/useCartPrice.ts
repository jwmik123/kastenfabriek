'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { useClosetStore } from '../store'
import { MATERIALS } from '../materials'
import { addItem } from '@/lib/cart/cart-store'
import { requestCapture, resetToFrontView } from '@/lib/canvas-capture'
import { PricingEngine } from '@/lib/configurator/pricing-engine'
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
  const powerCableHolesEnabled = useClosetStore((s) => s.powerCableHolesEnabled)
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

  // --- Delivery & Installation ---
  const deliveryCost = engine?.deliveryPrice ?? 95
  const subtotal = moduleCost + doorCost + mechanismCost + ledCost + deliveryCost
  const installationTier = engine?.getInstallationTier(subtotal) ?? null
  const installationCost = installationTier?.price ?? 0

  const totalPrice = moduleCost + doorCost + mechanismCost + ledCost
  const grandTotal = subtotal + installationCost

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
      lightStripsEnabled,
      powerCableHolesEnabled,
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

    const cartItem: CartItem = {
      id: itemId,
      addedAt: configSnapshot.capturedAt,
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
    pricingData,
    editItemId,
    handleAddToCart,
    isCapturing,
    formatter,
  }
}
