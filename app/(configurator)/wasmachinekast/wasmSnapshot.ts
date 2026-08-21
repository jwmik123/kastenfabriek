import type { ModuleLayout } from '@/types/configurator-pricing'
import type { ClosetConfigSnapshot, ModuleSlotSnapshot } from '@/lib/cart/types'
import type { BaseModuleSlot } from '../_shared/store/types'
import type { HandleMaterial } from '../_shared/constants/handleMaterials'
import type { Section, WasherPlacement, WasmLayout } from './sections/types'

/**
 * Everything a wasmachinekast snapshot needs, in the shape the store holds it.
 * Both the add-to-cart path and the draft autosave feed this — they used to
 * hand-build the snapshot separately, which is how `washerModules` ended up in
 * the draft but not in the cart item.
 */
export interface WasmSnapshotInput {
  id: string
  width: number
  height: number
  depth: number
  moduleCount: number
  modules: BaseModuleSlot[]
  moduleLayouts: ModuleLayout[]
  layout: WasmLayout
  lowSection: Section | null
  washerModules: WasherPlacement[]
  topPanelThicknessMm: 18 | 36
  countertopMaterialId: string | undefined
  buitenkantMaterialId: string
  binnenkantMaterialId: string
  doorHandleId: string
  doorHandleName: string | null
  drawerHandleId: string
  drawerHandleName: string | null
  doorHandleMaterial: HandleMaterial
  doorsExtendToFloor: boolean
  lightStripsEnabled: boolean
  sidePanelThickness: '18mm' | '36mm'
  placementType: 'vrijstaand' | 'ingebouwd'
  hasTopCabinet: boolean
  topCabinetHeightCm: number
}

function toModuleSnapshot(
  m: BaseModuleSlot,
  moduleLayouts: ModuleLayout[],
): ModuleSlotSnapshot {
  const layout = m.layoutId != null
    ? moduleLayouts.find((l) => l.layoutId === m.layoutId)
    : undefined
  return {
    slotIndex: m.slotIndex,
    layoutId: m.layoutId,
    layoutName: layout?.name ?? null,
    layoutDescription: layout?.description ?? null,
    layoutContents: layout
      ? {
          shelves: layout.contents.shelves,
          rods: layout.contents.rods,
          drawers: layout.contents.drawers,
        }
      : undefined,
    hasDoor: m.hasDoor,
    span: m.span,
    buitenkantMaterialId: m.buitenkantMaterialId,
    binnenkantMaterialId: m.binnenkantMaterialId,
    hasPowerHole: m.hasPowerHole ?? false,
    pushToOpen: m.pushToOpen ?? false,
    fixedWidth: m.fixedWidth,
  }
}

/**
 * Pure: serialize the wasmachinekast store into a cart/draft snapshot.
 *
 * In `low-only` the store's top-level width/height/modules hold the LOW
 * section, so they are mirrored into `lowSection` as well — that is what
 * `restore()` reads back for that layout.
 */
export function buildWasmConfigSnapshot(s: WasmSnapshotInput): ClosetConfigSnapshot {
  const isLowOnly = s.layout === 'low-only'
  const lowModules = isLowOnly ? s.modules : (s.lowSection?.modules ?? [])
  const hasLowSection = isLowOnly || s.lowSection !== null

  return {
    id: s.id,
    capturedAt: new Date().toISOString(),
    productType: 'wasmachinekast',

    widthCm: s.width,
    heightCm: s.height,
    depthCm: s.depth,

    moduleCount: s.moduleCount,
    modules: s.modules.map((m) => toModuleSnapshot(m, s.moduleLayouts)),

    layout: s.layout,
    washerModules: s.washerModules,
    ...(hasLowSection
      ? {
          lowSection: {
            width: isLowOnly ? s.width : s.lowSection!.width,
            height: isLowOnly ? s.height : s.lowSection!.height,
            moduleCount: isLowOnly ? s.moduleCount : s.lowSection!.moduleCount,
            modules: lowModules.map((m) => toModuleSnapshot(m, s.moduleLayouts)),
            topPanelThicknessMm: s.topPanelThicknessMm,
            countertopMaterialId: s.countertopMaterialId ?? s.buitenkantMaterialId,
          },
        }
      : {}),

    buitenkantMaterialId: s.buitenkantMaterialId,
    binnenkantMaterialId: s.binnenkantMaterialId,
    doorHandleId: s.doorHandleId,
    doorHandleName: s.doorHandleName,
    drawerHandleId: s.drawerHandleId,
    drawerHandleName: s.drawerHandleName,
    doorHandleMaterial: s.doorHandleMaterial,
    doorsExtendToFloor: s.doorsExtendToFloor,

    // A wasmachinekast never has diagonal walls.
    diagonalSide: 'none',
    leftDiagStartHeight: 0,
    rightDiagStartHeight: 0,
    leftDiagTopWidth: 0,
    rightDiagTopWidth: 0,
    backDiagonal: false,
    backDiagKinkHeight: 0,
    backDiagFlatSectionDepth: 0,

    placementType: s.placementType,
    lightStripsEnabled: s.lightStripsEnabled,
    sidePanelThickness: s.sidePanelThickness,
    hasTopCabinet: s.hasTopCabinet,
    topCabinetHeightCm: s.topCabinetHeightCm,
  }
}

/** The handle name the pricing data gives for `id`, or the greeploos label. */
export function resolveHandleName(
  id: string,
  handles: { id: string; name: string; nameNl?: string | null }[] | undefined,
): string | null {
  if (id === 'none') return 'Greeploos (push-to-open)'
  const handle = handles?.find((h) => h.id === id)
  return handle?.nameNl ?? handle?.name ?? null
}
