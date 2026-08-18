import type { FullPricingData, ModuleLayout, PricingConstraints } from '@/types/configurator-pricing'
import type { ClosetConfigSnapshot } from '@/lib/cart/types'
import type { HandleMaterial } from '../constants/handleMaterials'

export interface BaseModuleSlot {
  slotIndex: number
  layoutId: number | null
  hasDoor: boolean
  span: 1 | 2
  buitenkantMaterialId?: string
  binnenkantMaterialId?: string
  hasPowerHole?: boolean
  /** Per-module override: this module opens by pushing, so it carries no handle. */
  pushToOpen?: boolean
  fixedWidth?: number  // cm; when set, slot has fixed width (e.g. washer modules)
}

// Defined here so _shared/store does not depend on kledingkast internals.
// Must remain identical to DiagonalSide in kledingkast/scene/diagonalUtils.ts.
export type DiagonalSide = 'none' | 'left' | 'right' | 'both'

export interface BaseConfiguratorState {
  // Sanity data
  pricingData: FullPricingData | null
  constraints: PricingConstraints | null
  moduleLayouts: ModuleLayout[]

  // Wizard
  step: number

  // Dimensions (cm)
  width: number
  height: number
  depth: number

  // Modules
  moduleCount: number
  modules: BaseModuleSlot[]

  // Appearance
  buitenkantMaterialId: string
  binnenkantMaterialId: string
  doorHandleId: string
  doorHandleMaterial: HandleMaterial
  doorsExtendToFloor: boolean
  lightStripsEnabled: boolean

  // View options
  doorsOpen: boolean
  showMeasurements: boolean
  userZoom: number

  // Selection
  selectedSlot: number | null
  hoveredSlot: number | null

  // Derived
  moduleWidthCm: () => number
  minModules: () => number
  maxModules: () => number
  needsTopCabinet: () => boolean
  topCabinetHeight: () => number
  mainHeight: () => number

  // Actions
  hydrate: (data: FullPricingData) => void
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setWidth: (w: number) => void
  setHeight: (h: number) => void
  setDepth: (d: number) => void
  setModuleCount: (count: number) => void
  setModuleLayout: (slotIndex: number, layoutId: number) => void
  setModuleSpan: (slotIndex: number, span: 1 | 2) => void
  toggleModuleDoor: (slotIndex: number) => void
  setHasPowerHole: (slotIndex: number, value: boolean) => void
  setBuitenkantMaterialId: (id: string) => void
  setBinnenkantMaterialId: (id: string) => void
  setModuleMaterial: (slotIndex: number, variant: 'buitenkant' | 'binnenkant', id: string) => void
  setDoorHandleId: (id: string) => void
  setDoorHandleMaterial: (material: HandleMaterial) => void
  setDoorsExtendToFloor: (v: boolean) => void
  setLightStripsEnabled: (v: boolean) => void
  toggleDoors: () => void
  toggleMeasurements: () => void
  zoomIn: () => void
  zoomOut: () => void
  setSelectedSlot: (slot: number | null) => void
  setHoveredSlot: (slot: number | null) => void
  randomFill: () => void
  restoreConfig: (config: ClosetConfigSnapshot) => void
}

export interface DiagonalSlice {
  diagonalSide: DiagonalSide
  leftDiagStartHeight: number
  rightDiagStartHeight: number
  leftDiagTopWidth: number
  rightDiagTopWidth: number
  backDiagonal: boolean
  backDiagKinkHeight: number
  backDiagFlatSectionDepth: number
  setDiagonalSide: (side: DiagonalSide) => void
  setLeftDiagStartHeight: (v: number) => void
  setRightDiagStartHeight: (v: number) => void
  setLeftDiagTopWidth: (v: number) => void
  setRightDiagTopWidth: (v: number) => void
  setBackDiagonal: (v: boolean) => void
  setBackDiagKinkHeight: (v: number) => void
  setBackDiagFlatSectionDepth: (v: number) => void
}
