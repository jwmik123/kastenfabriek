import type { BaseModuleSlot } from '../../_shared/store/types'
import type { Section, SharedMaterials } from './types'

const LOW_SECTION_HEIGHT_CM = 90
const LOW_SECTION_DEFAULT_MODULE_COUNT = 2
const LOW_SECTION_FALLBACK_WIDTH_CM = 120

function emptyModules(count: number): BaseModuleSlot[] {
  return Array.from({ length: count }, (_, i) => ({
    slotIndex: i,
    layoutId: null,
    hasDoor: true,
    span: 1 as 1,
    hasPowerHole: false,
  }))
}

export function defaultLowSection(
  highSection: Section | null,
  shared: SharedMaterials
): Section {
  const width = highSection?.width ?? LOW_SECTION_FALLBACK_WIDTH_CM
  const moduleCount = LOW_SECTION_DEFAULT_MODULE_COUNT
  return {
    width,
    height: LOW_SECTION_HEIGHT_CM,
    moduleCount,
    modules: emptyModules(moduleCount),
    topPanelThicknessMm: 18,
    countertopMaterialId: shared.buitenkantMaterialId,
  }
}
