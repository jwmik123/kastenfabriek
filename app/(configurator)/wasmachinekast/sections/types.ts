import type { BaseModuleSlot } from '../../_shared/store/types'
import type {
  LowSectionSnapshot,
  ModuleSlotSnapshot,
  WasherSection,
  WasmLayout,
} from '@/lib/cart/types'

export type { LowSectionSnapshot, WasherSection, WasmLayout }
export type SectionType = 'high' | 'low' | 'both'

export interface Section {
  width: number
  height: number
  moduleCount: number
  modules: BaseModuleSlot[]
  topPanelThicknessMm?: 18 | 36
  countertopMaterialId?: string
}

export interface SharedMaterials {
  buitenkantMaterialId: string
  binnenkantMaterialId: string
}

export interface WasmSectionsState {
  layout: WasmLayout
  highSection: Section | null
  lowSection: Section | null
  washerSection: WasherSection
}

export interface WasmSectionsSnapshot {
  layout?: WasmLayout
  widthCm: number
  heightCm: number
  moduleCount: number
  modules: ModuleSlotSnapshot[]
  depthCm: number
  washerModules?: { slotIndex: number; layoutId: number }[]
  lowSection?: LowSectionSnapshot
  washerSection?: WasherSection
}

export interface MigratedState {
  layout: WasmLayout
  highSection: Section | null
  lowSection: Section | null
  washerSection: WasherSection
  depth: number
  washerModules: { slotIndex: number; layoutId: number }[]
}
