'use client'

import { useClosetStore } from '../store'
import { MATERIALS } from '../materials'
import { PricingEngine } from '@/lib/configurator/pricing-engine'
import type { FullPricingData } from '@/types/configurator-pricing'
import type { ModuleSlot } from '../store'

export interface DebugPricingGlobal {
  ledCost: number
  ledModuleCount: number
  deliveryCost: number
  installationTierName: string | null
  installationCost: number
  subtotal: number
  grandTotal: number
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

export function useDebugPricing(): DebugPricingGlobal | null {
  const modules = useClosetStore((s) => s.modules)
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const pricingData = useClosetStore((s) => s.pricingData)
  const buitenkantMaterialId = useClosetStore((s) => s.buitenkantMaterialId)
  const doorHandleId = useClosetStore((s) => s.doorHandleId)
  const lightStripsEnabled = useClosetStore((s) => s.lightStripsEnabled)
  const needsTopCabinet = useClosetStore((s) => s.needsTopCabinet)

  if (!pricingData) return null

  return computeDebugGlobal({
    pricingData,
    modules,
    moduleCount,
    buitenkantMaterialId,
    doorHandleId,
    lightStripsEnabled,
    hasTopCabinet: needsTopCabinet(),
  })
}
