import type { DoorVariant, FullPricingData, InstallationTier } from '@/types/configurator-pricing'
import { PricingEngine } from '@/lib/configurator/pricing-engine'
import { computeFreeMontage } from '@/lib/configurator/free-montage'
import { computeInstallationBasis } from '@/lib/configurator/installation-basis'
import { MATERIALS } from '../../kledingkast/materials'
import { getWasmLayoutConfig } from '../moduleLayoutConfigs'
import { WASHER_LAYOUT_IDS } from '../moduleLayouts'
import { frontsInModule, sectionedModules } from '../sections/drawerFronts'
import type { Section, WasmLayout } from '../sections/types'
import type { ModuleSlot } from '../store'

/** Delivery price used when the pricing data has not loaded yet. */
const DELIVERY_FALLBACK = 95

export interface WasmPricingInput {
  pricingData: FullPricingData | null
  layout: WasmLayout
  /** Top-level modules: the HIGH section, except in low-only. */
  modules: ModuleSlot[]
  lowSection: Section | null
  /** Modules in the top-level section — drives LED and top-cabinet counts. */
  moduleCount: number
  buitenkantMaterialId: string
  doorHandleId: string
  lightStripsEnabled: boolean
  hasTopCabinet: boolean
  sidePanelThickness: '18mm' | '36mm'
}

/** One module slot with every price line it contributes. */
export interface WasmPriceRow {
  section: 'high' | 'low'
  slotIndex: number
  layoutId: number | null
  layoutName: string | null
  isEmpty: boolean
  /** False when Sanity has no moduleLayout document — the module prices at 0. */
  hasPriceDoc: boolean
  isWasher: boolean
  pushToOpen: boolean
  pricingTier: 'single' | 'double' | null
  interiorCost: number
  hasDoor: boolean
  doorVariant: DoorVariant | null
  doorCount: number
  doorCost: number
  /** Handle charged for this row's doors; 'none' is push-to-open. */
  handleId: string | null
  handleCount: number
  handleCost: number
  drawerFrontCount: number
  drawerHandleId: string | null
  drawerHandleCost: number
  powerHoleCost: number
  subtotal: number
}

export interface WasmTopCabinetRow {
  doorCount: number
  doorVariant: DoorVariant
  doorCost: number
  handleCost: number
  subtotal: number
}

export interface WasmPricingTotals {
  moduleCost: number
  doorCost: number
  mechanismCost: number
  ledCost: number
  ledModuleCount: number
  powerHoleCount: number
  powerHoleCost: number
  sidePanelCost: number
  deliveryCost: number
  /** Cabinet only — everything except delivery and montage. */
  cabinetCost: number
  subtotal: number
  installationBasis: number
  installationTier: InstallationTier | null
  installationCost: number
  freeMontageApplied: boolean
  freeMontageDiscount: number
  originalPrice: number | undefined
  grandTotal: number
}

export interface WasmPricingResult {
  rows: WasmPriceRow[]
  topCabinet: WasmTopCabinetRow | null
  totals: WasmPricingTotals
  handles: {
    doorHandleId: string
    doorHandlePrice: number
    /** Falls back to push-to-open when the door handle does not fit a front. */
    drawerHandleId: string
    drawerHandlePrice: number
    pushToOpenPrice: number
  }
}

/** Doors of a module priced as veneer when its outside material is a texture. */
function doorVariantFor(module: ModuleSlot, buitenkantMaterialId: string): DoorVariant {
  const effectiveMaterialId = module.buitenkantMaterialId ?? buitenkantMaterialId
  const material = MATERIALS.find((m) => m.id === effectiveMaterialId)
  return material?.type === 'texture' ? 'veneer' : 'standard'
}

/**
 * Every price line of a wasmachinekast configuration, per module and in total.
 *
 * Pure, so the cart price and the debug panel read the same numbers: a second
 * implementation of this arithmetic is how a debug breakdown starts disagreeing
 * with the price the customer pays.
 *
 * Modules are counted once, through their section — the top-level fields hold
 * the LOW section in low-only layouts, where `lowSection` mirrors them.
 */
export function computeWasmPricing(input: WasmPricingInput): WasmPricingResult {
  const {
    pricingData,
    layout,
    modules,
    lowSection,
    moduleCount,
    buitenkantMaterialId,
    doorHandleId,
    lightStripsEnabled,
    hasTopCabinet,
    sidePanelThickness,
  } = input

  const engine = pricingData ? new PricingEngine(pricingData) : null

  const doorHandlePrice = engine?.getHandlePrice(doorHandleId) ?? 0
  const pushToOpenPrice = engine?.getHandlePrice('none') ?? 0
  // Drawer fronts carry the cabinet's handle, unless that handle does not fit a
  // front — then they stay push-to-open.
  const drawerHandleId =
    pricingData?.handles.find((h) => h.id === doorHandleId)?.fitsLowModule === false
      ? 'none'
      : doorHandleId
  const drawerHandlePrice = engine?.getHandlePrice(drawerHandleId) ?? 0
  const powerHolePrice = engine?.getAccessoryPrice('power-outlet') ?? 0

  const rows: WasmPriceRow[] = sectionedModules({
    layout,
    topLevelModules: modules,
    lowSection,
  }).map(({ module, section }) => {
    const isWasher = module.layoutId !== null && WASHER_LAYOUT_IDS.has(module.layoutId)
    const config = module.layoutId !== null ? getWasmLayoutConfig(module.layoutId) : undefined
    const pushToOpen = module.pushToOpen === true

    if (module.layoutId === null) {
      return {
        section,
        slotIndex: module.slotIndex,
        layoutId: null,
        layoutName: null,
        isEmpty: true,
        hasPriceDoc: true,
        isWasher: false,
        pushToOpen,
        pricingTier: null,
        interiorCost: 0,
        hasDoor: false,
        doorVariant: null,
        doorCount: 0,
        doorCost: 0,
        handleId: null,
        handleCount: 0,
        handleCost: 0,
        drawerFrontCount: 0,
        drawerHandleId: null,
        drawerHandleCost: 0,
        powerHoleCost: 0,
        subtotal: 0,
      }
    }

    const pricingTier = module.span === 2 ? ('double' as const) : ('single' as const)
    // The section decides which catalogue document prices this module: the
    // same layoutId exists as a high and a low variant at different prices.
    const interiorCost = engine?.getModulePrice(module.layoutId, pricingTier, section) ?? 0
    const layoutDoc = engine?.getModule(module.layoutId, section)

    // A washer door and a lage-kast front layout are drawn as fronts, not as a
    // priced door — the low section never charges a door for either.
    const doorSkipped = section === 'low' && (isWasher || config?.lowFronts === true)
    const hasDoor = module.hasDoor && !doorSkipped

    let doorVariant: DoorVariant | null = null
    let doorCount = 0
    let doorCost = 0
    let handleId: string | null = null
    let handleCost = 0

    if (hasDoor) {
      doorVariant = doorVariantFor(module, buitenkantMaterialId)
      doorCount = module.span === 2 ? 2 : 1
      doorCost = (engine?.getDoorPrice(doorVariant) ?? 0) * doorCount
      // The door above a washing machine is always push-to-open, as is any
      // module the customer set to push-to-open.
      const isPush = (section === 'high' && isWasher) || pushToOpen
      handleId = isPush ? 'none' : doorHandleId
      handleCost = doorCount * (isPush ? pushToOpenPrice : doorHandlePrice)
    }

    // Push-to-open modules keep their fronts but carry no handle.
    const drawerFrontCount = pushToOpen ? 0 : frontsInModule({ module, section })
    const drawerHandleCost = drawerFrontCount * drawerHandlePrice

    const powerHoleCost = module.hasPowerHole ? powerHolePrice : 0

    return {
      section,
      slotIndex: module.slotIndex,
      layoutId: module.layoutId,
      layoutName: layoutDoc?.name ?? config?.label ?? null,
      isEmpty: false,
      hasPriceDoc: layoutDoc !== undefined,
      isWasher,
      pushToOpen,
      pricingTier,
      interiorCost,
      hasDoor,
      doorVariant,
      doorCount,
      doorCost,
      handleId,
      handleCount: doorCount,
      handleCost,
      drawerFrontCount,
      drawerHandleId: drawerFrontCount > 0 ? drawerHandleId : null,
      drawerHandleCost,
      powerHoleCost,
      subtotal: interiorCost + doorCost + handleCost + drawerHandleCost + powerHoleCost,
    }
  })

  const topCabinetDoorCount = hasTopCabinet ? moduleCount : 0
  const topCabinet: WasmTopCabinetRow | null =
    topCabinetDoorCount > 0
      ? {
          doorCount: topCabinetDoorCount,
          doorVariant: 'small',
          doorCost: topCabinetDoorCount * (engine?.getDoorPrice('small') ?? 0),
          // Top-cabinet doors are push-to-open.
          handleCost: topCabinetDoorCount * pushToOpenPrice,
          subtotal: 0,
        }
      : null
  if (topCabinet) topCabinet.subtotal = topCabinet.doorCost + topCabinet.handleCost

  const sum = (pick: (row: WasmPriceRow) => number) => rows.reduce((t, r) => t + pick(r), 0)

  const moduleCost = sum((r) => r.interiorCost)
  const doorCost = sum((r) => r.doorCost) + (topCabinet?.doorCost ?? 0)
  const mechanismCost =
    sum((r) => r.handleCost + r.drawerHandleCost) + (topCabinet?.handleCost ?? 0)

  // LED strips light the high cabinet only, so they are priced over the high
  // section's modules — a low-only cabinet cannot carry them at all.
  const ledModuleCount = layout === 'low-only' ? 0 : moduleCount
  const ledCost =
    lightStripsEnabled && engine && ledModuleCount > 0 ? engine.calculateLedPrice(ledModuleCount) : 0

  const powerHoleCount = rows.filter((r) => r.powerHoleCost > 0).length
  const powerHoleCost = sum((r) => r.powerHoleCost)

  // 18mm side panels are standard; 36mm is a paid upgrade.
  const sidePanelCost =
    sidePanelThickness === '36mm' ? engine?.getAccessoryPrice('side-panels-36mm') ?? 0 : 0

  const deliveryCost = engine?.deliveryPrice ?? DELIVERY_FALLBACK
  const cabinetCost = moduleCost + doorCost + mechanismCost + ledCost + powerHoleCost + sidePanelCost
  const subtotal = cabinetCost + deliveryCost

  const installationBasis = computeInstallationBasis({ subtotal, deliveryCost, ledCost })
  const installationTier = engine?.getInstallationTier(installationBasis) ?? null
  const freeMontage = pricingData?.config.freeMontage ?? false
  const { effectiveInstallationCost, freeMontageDiscount, freeMontageApplied, originalPrice, grandTotal } =
    computeFreeMontage({ subtotal, installationTier, freeMontage })

  return {
    rows,
    topCabinet,
    totals: {
      moduleCost,
      doorCost,
      mechanismCost,
      ledCost,
      ledModuleCount,
      powerHoleCount,
      powerHoleCost,
      sidePanelCost,
      deliveryCost,
      cabinetCost,
      subtotal,
      installationBasis,
      installationTier,
      installationCost: effectiveInstallationCost,
      freeMontageApplied,
      freeMontageDiscount,
      originalPrice,
      grandTotal,
    },
    handles: {
      doorHandleId,
      doorHandlePrice,
      drawerHandleId,
      drawerHandlePrice,
      pushToOpenPrice,
    },
  }
}
