import type { BaseModuleSlot } from '../../_shared/store/types'
import type { ModuleSlotSnapshot } from '@/lib/cart/types'
import type {
  LowSectionSnapshot,
  MigratedState,
  Section,
  WasherPlacement,
  WasmLayout,
  WasmSectionsSnapshot,
} from './types'

const MIN_WASM_DEPTH_CM = 85

/**
 * Older snapshots stored one `washerSection` for every placement. Stamp each
 * entry with its own section and drop the ones whose section the layout no
 * longer has.
 */
function washersFromSnapshot(
  snap: WasmSectionsSnapshot,
  layout: WasmLayout,
): WasherPlacement[] {
  const legacy = snap.washerSection ?? (layout === 'low-only' ? 'low' : 'high')
  return (snap.washerModules ?? [])
    .map((w) => ({ ...w, section: w.section ?? legacy }))
    .filter((w) =>
      w.section === 'high' ? layout !== 'low-only' : layout !== 'high-only',
    )
}

function moduleFromSnapshot(s: ModuleSlotSnapshot): BaseModuleSlot {
  return {
    slotIndex: s.slotIndex,
    layoutId: s.layoutId,
    hasDoor: s.hasDoor,
    span: s.span,
    buitenkantMaterialId: s.buitenkantMaterialId,
    binnenkantMaterialId: s.binnenkantMaterialId,
    hasPowerHole: s.hasPowerHole ?? false,
    pushToOpen: s.pushToOpen ?? false,
  }
}

function moduleToSnapshot(m: BaseModuleSlot): ModuleSlotSnapshot {
  return {
    slotIndex: m.slotIndex,
    layoutId: m.layoutId,
    layoutName: null,
    hasDoor: m.hasDoor,
    span: m.span,
    buitenkantMaterialId: m.buitenkantMaterialId,
    binnenkantMaterialId: m.binnenkantMaterialId,
    hasPowerHole: m.hasPowerHole ?? false,
    pushToOpen: m.pushToOpen ?? false,
  }
}

function highSectionFromSnapshot(snap: WasmSectionsSnapshot): Section {
  return {
    width: snap.widthCm,
    height: snap.heightCm,
    moduleCount: snap.moduleCount,
    modules: snap.modules.map(moduleFromSnapshot),
  }
}

function lowSectionFromSnapshot(low: LowSectionSnapshot): Section {
  return {
    width: low.width,
    height: low.height,
    moduleCount: low.moduleCount,
    modules: low.modules.map(moduleFromSnapshot),
    topPanelThicknessMm: low.topPanelThicknessMm,
    countertopMaterialId: low.countertopMaterialId,
  }
}

export function restore(snap: WasmSectionsSnapshot): MigratedState {
  const depth = Math.max(MIN_WASM_DEPTH_CM, snap.depthCm)

  if (!snap.layout) {
    return {
      layout: 'high-only',
      highSection: highSectionFromSnapshot(snap),
      lowSection: null,
      depth,
      washerModules: washersFromSnapshot(snap, 'high-only'),
    }
  }

  const layout = snap.layout
  const highSection: Section | null =
    layout === 'low-only' ? null : highSectionFromSnapshot(snap)
  const lowSection: Section | null =
    layout !== 'high-only' && snap.lowSection
      ? lowSectionFromSnapshot(snap.lowSection)
      : null

  return {
    layout,
    highSection,
    lowSection,
    depth,
    washerModules: washersFromSnapshot(snap, layout),
  }
}

export function serialize(state: MigratedState): WasmSectionsSnapshot {
  const high = state.highSection
  const low = state.lowSection

  const snap: WasmSectionsSnapshot = {
    layout: state.layout,
    widthCm: high?.width ?? 0,
    heightCm: high?.height ?? 0,
    moduleCount: high?.moduleCount ?? 0,
    modules: high ? high.modules.map(moduleToSnapshot) : [],
    depthCm: state.depth,
    washerModules: state.washerModules,
  }

  if (low) {
    snap.lowSection = {
      width: low.width,
      height: low.height,
      moduleCount: low.moduleCount,
      modules: low.modules.map(moduleToSnapshot),
      topPanelThicknessMm: low.topPanelThicknessMm ?? 18,
      countertopMaterialId: low.countertopMaterialId ?? '',
    }
  }

  return snap
}
