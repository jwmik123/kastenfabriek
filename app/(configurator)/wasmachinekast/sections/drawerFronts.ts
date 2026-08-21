import type { BaseModuleSlot } from '../../_shared/store/types'
import { getWasmLayoutConfig } from '../moduleLayoutConfigs'
import { WASHER_LAYOUT_IDS } from '../moduleLayouts'
import type { Section, WasmLayout } from './types'

/**
 * Handle-bearing drawer fronts in a wasmachinekast (front policy):
 *
 * - Lage-kast-specific layouts (20/21/22, `lowFronts` on their hardcoded
 *   config) render kitchen-style fronts in the low section.
 * - The machine modules (11/13/14) render the drawers under the washing
 *   machine in the high section.
 *
 * Both carry the cabinet's handle, mounted horizontally. Every other front is
 * a door: shared layouts (e.g. Drawers + shelves) keep a deurtje, and the door
 * above a washing machine is always push-to-open and never counted here.
 */

type SectionedModule = { module: BaseModuleSlot; section: 'high' | 'low' }

type DrawerFrontArgs = {
  layout: WasmLayout
  topLevelModules: BaseModuleSlot[]
  lowSection: Section | null
}

function sectionedModules({
  layout,
  topLevelModules,
  lowSection,
}: DrawerFrontArgs): SectionedModule[] {
  // Top-level fields hold the LOW section only in low-only layouts.
  const topLevel: 'high' | 'low' = layout === 'low-only' ? 'low' : 'high'
  return [
    ...topLevelModules.map((module) => ({ module, section: topLevel })),
    ...(topLevel === 'high' ? lowSection?.modules ?? [] : []).map((module) => ({
      module,
      section: 'low' as const,
    })),
  ]
}

function frontsInModule({ module, section }: SectionedModule): number {
  if (module.layoutId === null) return 0
  const config = getWasmLayoutConfig(module.layoutId)
  if (!config) return 0
  const isWasher = WASHER_LAYOUT_IDS.has(module.layoutId)
  const showsFronts = section === 'high' ? isWasher : config.lowFronts === true
  if (!showsFronts) return 0
  return config.drawerFrontCount ?? 0
}

/** True when at least one module in the cabinet shows drawer fronts. */
export function hasDrawerFronts(args: DrawerFrontArgs): boolean {
  return countDrawerFronts(args) > 0
}

/**
 * Total number of handle-bearing drawer fronts in the cabinet. A module set to
 * push-to-open keeps its fronts but carries no handle, so it counts as zero.
 */
export function countDrawerFronts(args: DrawerFrontArgs): number {
  return sectionedModules(args).reduce(
    (sum, entry) => sum + (entry.module.pushToOpen ? 0 : frontsInModule(entry)),
    0,
  )
}
