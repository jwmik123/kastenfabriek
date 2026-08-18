import type { BaseModuleSlot } from '../../_shared/store/types'
import type {
  LowSectionSnapshot,
  ModuleSlotSnapshot,
  WasherSection,
  WasmLayout,
} from '@/lib/cart/types'

export type { LowSectionSnapshot, WasherSection, WasmLayout }
export type SectionType = 'high' | 'low' | 'both'

/**
 * A placed washer. Carries its own section: washers may sit in the high and the
 * low section at the same time, so a slot index alone does not identify one.
 */
export interface WasherPlacement {
  slotIndex: number
  layoutId: number
  section: 'high' | 'low'
}

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
}

export interface WasmSectionsSnapshot {
  layout?: WasmLayout
  widthCm: number
  heightCm: number
  moduleCount: number
  modules: ModuleSlotSnapshot[]
  depthCm: number
  // `section` is absent in snapshots written before washers could sit in both
  // sections; `washerSection` held it for the whole set back then.
  washerModules?: { slotIndex: number; layoutId: number; section?: 'high' | 'low' }[]
  lowSection?: LowSectionSnapshot
  washerSection?: WasherSection
}

export interface MigratedState {
  layout: WasmLayout
  highSection: Section | null
  lowSection: Section | null
  depth: number
  washerModules: WasherPlacement[]
}
