import type { BaseModuleSlot } from '../../_shared/store/types'
import { getWasmLayoutConfig } from '../moduleLayoutConfigs'
import type { Section, WasmLayout } from './types'

/**
 * Lage-kast-specific layouts (20/21/22, `lowFronts` on their hardcoded
 * config) render kitchen-style fronts (front policy). Handles apply only to
 * those fronts — all wasmachinekast doors are push-to-open. Shared layouts
 * (e.g. Drawers + shelves) keep a deurtje and carry no handle.
 */

function lowModules(
  layout: WasmLayout,
  topLevelModules: BaseModuleSlot[],
  lowSection: Section | null,
): BaseModuleSlot[] {
  // Top-level fields hold the LOW section only in low-only layouts.
  if (layout === 'low-only') return topLevelModules
  return lowSection?.modules ?? []
}

function frontsInLayout(layoutId: number | null): number {
  if (layoutId === null) return 0
  const config = getWasmLayoutConfig(layoutId)
  if (!config?.lowFronts) return 0
  return config.lowFrontCount ?? 0
}

/** True when at least one low-section module shows kitchen-style fronts. */
export function hasLowDrawerFronts(args: {
  layout: WasmLayout
  topLevelModules: BaseModuleSlot[]
  lowSection: Section | null
}): boolean {
  return countLowDrawerFronts(args) > 0
}

/**
 * Total number of handle-bearing fronts across the low section. A module set to
 * push-to-open keeps its fronts but carries no handle, so it counts as zero.
 */
export function countLowDrawerFronts(args: {
  layout: WasmLayout
  topLevelModules: BaseModuleSlot[]
  lowSection: Section | null
}): number {
  return lowModules(args.layout, args.topLevelModules, args.lowSection).reduce(
    (sum, m) => sum + (m.pushToOpen ? 0 : frontsInLayout(m.layoutId)),
    0,
  )
}
