'use client'

import { useClosetStore } from '../store'
import { MATERIALS } from '../materials'
import { PricingEngine } from '@/lib/configurator/pricing-engine'
import type { FullPricingData, ModuleLayout } from '@/types/configurator-pricing'
import type { ModuleSlot } from '../store'
import { WALL, MODULE_WALL, MODULE_FLOOR_Y, CLOSET_INSIDE_INSET } from '../scene/closetConstants'

export interface DebugDimensions {
  nominal: { w: number; h: number; d: number }
  innerClear: { w: number; h: number; d: number }
}

export function moduleDebugDimensions(params: {
  totalWidthM: number
  mainHeightM: number
  depthM: number
  moduleCount: number
  span: number
}): DebugDimensions {
  const { totalWidthM, mainHeightM, depthM, moduleCount, span } = params
  const slotW = (totalWidthM - WALL * 2) / moduleCount

  return {
    nominal: {
      w: (totalWidthM / moduleCount) * span,
      h: mainHeightM,
      d: depthM,
    },
    innerClear: {
      w: slotW * span - MODULE_WALL * 2,
      h: mainHeightM - WALL - MODULE_FLOOR_Y,
      d: depthM - WALL - CLOSET_INSIDE_INSET,
    },
  }
}

export interface DebugPricingGlobal {
  ledCost: number
  ledModuleCount: number
  deliveryCost: number
  installationTierName: string | null
  installationCost: number
  subtotal: number
  grandTotal: number
}

export interface DebugSlotRow {
  slotIndex: number
  isEmpty: boolean
  layoutId: number | null
  layoutName: string | null
  pricingTier: 'single' | 'double' | null
  interiorCost: number
  hasDoor: boolean
  doorVariant: 'standard' | 'veneer' | null
  doorCount: number
  doorCost: number
  handleCost: number
  powerHoleCost: number
  slotSubtotal: number
  dimensions: DebugDimensions
}

export interface DebugTopCabinetRow {
  doorCount: number
  doorVariant: 'small'
  doorCost: number
  handleCost: number
  subtotal: number
}

export interface DebugPricingResult {
  slots: DebugSlotRow[]
  topCabinet: DebugTopCabinetRow | null
  global: DebugPricingGlobal
}

export function computeDebugGlobal(params: {
  pricingData: FullPricingData
  modules: ModuleSlot[]
  moduleCount: number
  buitenkantMaterialId: string
  doorHandleId: string
  lightStripsEnabled: boolean
  hasTopCabinet: boolean
}): DebugPricingGlobal {
  const { pricingData, modules, moduleCount, buitenkantMaterialId, doorHandleId, lightStripsEnabled, hasTopCabinet } = params
  const engine = new PricingEngine(pricingData)

  const moduleCost = modules.reduce((sum, m) => {
    if (m.layoutId === null) return sum
    try {
      return sum + engine.getModulePrice(m.layoutId, m.span === 2 ? 'double' : 'single')
    } catch { return sum }
  }, 0)

  let moduleDoorCost = 0
  let moduleDoorCount = 0
  for (const m of modules) {
    if (!m.hasDoor || m.layoutId === null) continue
    const effectiveMaterialId = m.buitenkantMaterialId ?? buitenkantMaterialId
    const material = MATERIALS.find((mat) => mat.id === effectiveMaterialId)
    const variant = material?.type === 'texture' ? 'veneer' : 'standard'
    const count = m.span === 2 ? 2 : 1
    moduleDoorCost += engine.getDoorPrice(variant) * count
    moduleDoorCount += count
  }

  const topCabinetDoorCount = hasTopCabinet ? moduleCount : 0
  const topCabinetDoorCost = topCabinetDoorCount * engine.getDoorPrice('small')
  const doorCost = moduleDoorCost + topCabinetDoorCost
  const totalDoorCount = moduleDoorCount + topCabinetDoorCount

  const mechanismCost = totalDoorCount * engine.getHandlePrice(doorHandleId)

  const ledModuleCount = moduleCount
  const ledCost = lightStripsEnabled ? engine.calculateLedPrice(moduleCount) : 0

  const powerHoleCount = modules.filter((m) => m.hasPowerHole).length
  const powerHoleCost = powerHoleCount > 0 ? powerHoleCount * engine.getAccessoryPrice('power-cable-holes') : 0

  const deliveryCost = engine.deliveryPrice
  const subtotal = moduleCost + doorCost + mechanismCost + ledCost + powerHoleCost + deliveryCost
  const installationTier = engine.getInstallationTier(subtotal) ?? null
  const installationCost = installationTier?.price ?? 0
  const grandTotal = subtotal + installationCost

  return {
    ledCost,
    ledModuleCount,
    deliveryCost,
    installationTierName: installationTier?.name ?? null,
    installationCost,
    subtotal,
    grandTotal,
  }
}

export function computeDebugSlots(params: {
  pricingData: FullPricingData
  modules: ModuleSlot[]
  moduleCount: number
  buitenkantMaterialId: string
  doorHandleId: string
  moduleLayouts: ModuleLayout[]
  hasTopCabinet: boolean
  totalWidthM: number
  mainHeightM: number
  depthM: number
}): { slots: DebugSlotRow[]; topCabinet: DebugTopCabinetRow | null } {
  const { pricingData, modules, moduleCount, buitenkantMaterialId, doorHandleId, moduleLayouts, hasTopCabinet, totalWidthM, mainHeightM, depthM } = params
  const engine = new PricingEngine(pricingData)
  const handlePrice = engine.getHandlePrice(doorHandleId)
  const powerHolePrice = engine.getAccessoryPrice('power-cable-holes')

  const slots: DebugSlotRow[] = modules.map((m) => {
    const dimensions = moduleDebugDimensions({ totalWidthM, mainHeightM, depthM, moduleCount, span: m.span ?? 1 })

    if (m.layoutId === null) {
      return {
        slotIndex: m.slotIndex,
        isEmpty: true,
        layoutId: null,
        layoutName: null,
        pricingTier: null,
        interiorCost: 0,
        hasDoor: false,
        doorVariant: null,
        doorCount: 0,
        doorCost: 0,
        handleCost: 0,
        powerHoleCost: 0,
        slotSubtotal: 0,
        dimensions,
      }
    }

    const pricingTier = m.span === 2 ? 'double' : 'single'
    let interiorCost = 0
    try {
      interiorCost = engine.getModulePrice(m.layoutId, pricingTier)
    } catch { /* unknown layout — cost stays 0 */ }

    const layoutEntry = moduleLayouts.find((l) => l.layoutId === m.layoutId)
    const layoutName = layoutEntry?.name ?? null

    let doorVariant: 'standard' | 'veneer' | null = null
    let doorCount = 0
    let doorCost = 0
    let handleCost = 0

    if (m.hasDoor) {
      const effectiveMaterialId = m.buitenkantMaterialId ?? buitenkantMaterialId
      const material = MATERIALS.find((mat) => mat.id === effectiveMaterialId)
      doorVariant = material?.type === 'texture' ? 'veneer' : 'standard'
      doorCount = m.span === 2 ? 2 : 1
      doorCost = engine.getDoorPrice(doorVariant) * doorCount
      handleCost = handlePrice * doorCount
    }

    const powerHoleCost = m.hasPowerHole ? powerHolePrice : 0
    const slotSubtotal = interiorCost + doorCost + handleCost + powerHoleCost

    return {
      slotIndex: m.slotIndex,
      isEmpty: false,
      layoutId: m.layoutId,
      layoutName,
      pricingTier,
      interiorCost,
      hasDoor: m.hasDoor,
      doorVariant,
      doorCount,
      doorCost,
      handleCost,
      powerHoleCost,
      slotSubtotal,
      dimensions,
    }
  })

  let topCabinet: DebugTopCabinetRow | null = null
  if (hasTopCabinet) {
    const doorCount = moduleCount
    const doorCost = doorCount * engine.getDoorPrice('small')
    const handleCost = doorCount * handlePrice
    topCabinet = {
      doorCount,
      doorVariant: 'small',
      doorCost,
      handleCost,
      subtotal: doorCost + handleCost,
    }
  }

  return { slots, topCabinet }
}

export function useDebugPricing(): DebugPricingResult | null {
  const modules = useClosetStore((s) => s.modules)
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const pricingData = useClosetStore((s) => s.pricingData)
  const buitenkantMaterialId = useClosetStore((s) => s.buitenkantMaterialId)
  const doorHandleId = useClosetStore((s) => s.doorHandleId)
  const lightStripsEnabled = useClosetStore((s) => s.lightStripsEnabled)
  const needsTopCabinet = useClosetStore((s) => s.needsTopCabinet)
  const moduleLayouts = useClosetStore((s) => s.moduleLayouts)
  const totalWidthM = useClosetStore((s) => s.width) / 100
  const mainHeightM = useClosetStore((s) => s.mainHeight()) / 100
  const depthM = useClosetStore((s) => s.depth) / 100

  if (!pricingData) return null

  const hasTopCabinet = needsTopCabinet()

  const global = computeDebugGlobal({
    pricingData,
    modules,
    moduleCount,
    buitenkantMaterialId,
    doorHandleId,
    lightStripsEnabled,
    hasTopCabinet,
  })

  const { slots, topCabinet } = computeDebugSlots({
    pricingData,
    modules,
    moduleCount,
    buitenkantMaterialId,
    doorHandleId,
    moduleLayouts,
    hasTopCabinet,
    totalWidthM,
    mainHeightM,
    depthM,
  })

  return { slots, topCabinet, global }
}
