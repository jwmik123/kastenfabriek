import { create } from 'zustand'
import type { FullPricingData } from '@/types/configurator-pricing'
import type { BaseConfiguratorState, BaseModuleSlot } from '../_shared/store/types'
import type { ClosetConfigSnapshot } from '@/lib/cart/types'
import { WASHER_LAYOUTS, WASHER_LAYOUT_IDS } from './moduleLayouts'
import type { PopoverClickPoint } from '../_shared/components/popoverPlacement'
import { validateHandleMaterial } from '../_shared/components/validateHandleMaterial'
import { restore as restoreWasmSnapshot } from './sections/wasmSnapshotMigration'
import type {
  Section,
  WasherSection,
  WasmLayout,
  WasmSectionsSnapshot,
  WasmSectionsState,
} from './sections/types'

export type { BaseModuleSlot as ModuleSlot }

export type PlacementType = 'vrijstaand' | 'ingebouwd'

export interface WasherModule {
  slotIndex: number
  layoutId: number
}

const MIN_DEPTH = 85
const FALLBACK_MODULE_MIN_WIDTH = 15
const FALLBACK_MODULE_MAX_WIDTH = 65
const TOP_CABINET_THRESHOLD = 275
const SIDE_WALL_EXTRA_CM = 1.5
const LOW_SECTION_HEIGHT_CM = 90
const DEFAULT_HIGH_HEIGHT_CM = 240

function resizeModules(existing: BaseModuleSlot[], count: number): BaseModuleSlot[] {
  return Array.from({ length: count }, (_, i) =>
    existing[i] ?? { slotIndex: i, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false },
  ).map((m, i) => ({
    ...m,
    slotIndex: i,
    hasPowerHole: m.hasPowerHole ?? false,
    span: (m.span === 2 && m.slotIndex + 1 >= count ? 1 : m.span) as 1 | 2,
  }))
}

interface WasmState extends BaseConfiguratorState {
  placementType: PlacementType
  setPlacementType: (type: PlacementType) => void
  washerModules: WasherModule[]
  addWasherModule: (slotIndex: number, layoutId: number) => void
  removeWasherModule: (slotIndex: number) => void
  clearWasherModules: () => void
  lastClickPoint: PopoverClickPoint
  setSelectedSlot: (slot: number | null, clickPoint?: PopoverClickPoint) => void

  // Sections. Top-level width/height/moduleCount/modules hold the HIGH section's
  // data in any layout that has high (high-only / low-left / low-right). In
  // low-only the top-level holds the LOW section. `lowSection` holds the LOW
  // section's data when the layout includes one.
  layout: WasmLayout
  lowSection: Section | null
  washerSection: WasherSection
  topPanelThicknessMm: 18 | 36
  countertopMaterialId: string | undefined
  activeModulesSection: 'high' | 'low'
  setActiveModulesSection: (section: 'high' | 'low') => void
  highSection: () => Section | null
  setWasherSection: (section: WasherSection) => void
  setLowTopPanelThicknessMm: (t: 18 | 36) => void
  setLowCountertopMaterialId: (id: string) => void
  applySectionsState: (next: WasmSectionsState) => void

  // Dual-layout: low-section field setters (top-level holds high in dual).
  setLowSectionWidth: (cm: number) => void
  setLowSectionModuleCount: (count: number) => void
  setLowSectionModuleLayout: (slotIndex: number, layoutId: number) => void
  setLowSectionModuleSpan: (slotIndex: number, span: 1 | 2) => void
  toggleLowSectionModuleDoor: (slotIndex: number) => void
  setLowSectionHasPowerHole: (slotIndex: number, value: boolean) => void
  setLowSectionModuleMaterial: (
    slotIndex: number,
    variant: 'buitenkant' | 'binnenkant',
    id: string,
  ) => void
}

export const useWasmachinekastStore = create<WasmState>((set, get) => ({
  pricingData: null,
  constraints: null,
  moduleLayouts: [],

  step: 1,

  placementType: 'ingebouwd' as PlacementType,
  setPlacementType: (type) => set({ placementType: type }),

  washerModules: [],

  width: 120,
  height: 240,
  depth: 85,

  layout: 'high-only' as WasmLayout,
  lowSection: null,
  washerSection: null as WasherSection,
  topPanelThicknessMm: 18 as 18 | 36,
  countertopMaterialId: undefined as string | undefined,
  activeModulesSection: 'high' as 'high' | 'low',
  setActiveModulesSection: (section) => {
    const s = get()
    if (section === 'high' && s.layout === 'low-only') return
    if (section === 'low' && s.lowSection === null && s.layout !== 'low-only') return
    set({ activeModulesSection: section, selectedSlot: null, lastClickPoint: null })
  },
  highSection: () => {
    const { layout, width, height, moduleCount, modules } = get()
    if (layout === 'low-only') return null
    return { width, height, moduleCount, modules }
  },
  setWasherSection: (section) => {
    const s = get()
    if (section === 'low' && s.lowSection === null && s.layout !== 'low-only') return
    if (section === 'high' && s.layout === 'low-only') return
    if (section === s.washerSection) return
    // Switching to a different section discards existing washer placements.
    set({
      washerSection: section,
      washerModules: [],
      modules: s.modules.map((m) =>
        m.layoutId !== null && WASHER_LAYOUT_IDS.has(m.layoutId)
          ? { ...m, layoutId: null, fixedWidth: undefined }
          : m,
      ),
      lowSection: s.lowSection
        ? {
            ...s.lowSection,
            modules: s.lowSection.modules.map((m) =>
              m.layoutId !== null && WASHER_LAYOUT_IDS.has(m.layoutId)
                ? { ...m, layoutId: null, fixedWidth: undefined }
                : m,
            ),
          }
        : s.lowSection,
    })
  },
  setLowTopPanelThicknessMm: (t) => {
    const s = get()
    set({
      topPanelThicknessMm: t,
      lowSection: s.lowSection ? { ...s.lowSection, topPanelThicknessMm: t } : s.lowSection,
    })
  },
  setLowCountertopMaterialId: (id) => {
    const s = get()
    set({
      countertopMaterialId: id,
      lowSection: s.lowSection ? { ...s.lowSection, countertopMaterialId: id } : s.lowSection,
    })
  },
  applySectionsState: (next) => {
    const s = get()
    const isMirrorSwap =
      (s.layout === 'low-left' && next.layout === 'low-right') ||
      (s.layout === 'low-right' && next.layout === 'low-left')
    // Top-level mirrors the high section in any layout that has high; only in
    // low-only does it mirror low.
    const topLevel: Section | null =
      next.layout === 'low-only' ? next.lowSection : next.highSection
    if (!topLevel) {
      set({ layout: next.layout, lowSection: next.lowSection, washerSection: next.washerSection })
      return
    }
    const lowSec = next.lowSection
    // Preserve washerModules on mirror swap; otherwise drop entries that target
    // a section that no longer exists.
    const washerPreserved = isMirrorSwap
    const washerStillValid =
      (next.washerSection === 'high' && next.highSection !== null) ||
      (next.washerSection === 'low' && next.lowSection !== null) ||
      next.washerSection === null
    set({
      layout: next.layout,
      lowSection: lowSec,
      washerSection: washerStillValid ? next.washerSection : null,
      width: topLevel.width,
      height: topLevel.height,
      moduleCount: topLevel.moduleCount,
      modules: topLevel.modules,
      topPanelThicknessMm: lowSec?.topPanelThicknessMm ?? s.topPanelThicknessMm,
      countertopMaterialId: lowSec?.countertopMaterialId ?? s.countertopMaterialId,
      washerModules: washerPreserved && washerStillValid ? s.washerModules : [],
      activeModulesSection: next.layout === 'low-only' ? 'low' : 'high',
      selectedSlot: null,
      lastClickPoint: null,
    })
  },

  setLowSectionWidth: (cm) => {
    const s = get()
    if (!s.lowSection) return
    const c = s.constraints?.singleCorpus
    const minW = c?.minWidth ?? FALLBACK_MODULE_MIN_WIDTH
    const maxW = c?.maxWidth ?? FALLBACK_MODULE_MAX_WIDTH
    const maxTotal = maxW * Math.floor(600 / minW)
    const width = Math.max(minW, Math.min(maxTotal, cm))
    const minMods = Math.max(1, Math.ceil(width / maxW))
    const maxMods = Math.floor(width / minW)
    const moduleCount = Math.max(minMods, Math.min(maxMods, s.lowSection.moduleCount))
    const modules = resizeModules(s.lowSection.modules, moduleCount)
    set({ lowSection: { ...s.lowSection, width, moduleCount, modules } })
  },
  setLowSectionModuleCount: (count) => {
    const s = get()
    if (!s.lowSection) return
    const c = s.constraints?.singleCorpus
    const minW = c?.minWidth ?? FALLBACK_MODULE_MIN_WIDTH
    const maxW = c?.maxWidth ?? FALLBACK_MODULE_MAX_WIDTH
    const minMods = Math.max(1, Math.ceil(s.lowSection.width / maxW))
    const maxMods = Math.floor(s.lowSection.width / minW)
    const clamped = Math.max(minMods, Math.min(maxMods, count))
    const modules = resizeModules(s.lowSection.modules, clamped)
    set({ lowSection: { ...s.lowSection, moduleCount: clamped, modules } })
    if (s.washerSection === 'low') {
      const outOfBounds = s.washerModules.filter((w) => w.slotIndex >= clamped)
      if (outOfBounds.length > 0) {
        set({ washerModules: s.washerModules.filter((w) => w.slotIndex < clamped) })
      }
    }
  },
  setLowSectionModuleLayout: (slotIndex, layoutId) => {
    const s = get()
    if (!s.lowSection) return
    const layout = s.moduleLayouts.find((l) => l.layoutId === layoutId)
    const fixedWidth = layout?.minSlotWidth
    set({
      lowSection: {
        ...s.lowSection,
        modules: s.lowSection.modules.map((m) => {
          if (m.slotIndex === slotIndex) return { ...m, layoutId, fixedWidth }
          if (m.slotIndex === slotIndex - 1 && m.span === 2) return { ...m, span: 1 as const }
          return m
        }),
      },
    })
  },
  setLowSectionModuleSpan: (slotIndex, span) => {
    const s = get()
    if (!s.lowSection) return
    set({
      lowSection: {
        ...s.lowSection,
        modules: s.lowSection.modules.map((m) => {
          if (m.slotIndex === slotIndex) return { ...m, span }
          if (span === 2 && m.slotIndex === slotIndex + 1)
            return { ...m, layoutId: null, span: 1 as const, fixedWidth: undefined }
          if (span === 2 && m.slotIndex === slotIndex - 1 && m.span === 2)
            return { ...m, span: 1 as const }
          return m
        }),
      },
    })
  },
  toggleLowSectionModuleDoor: (slotIndex) => {
    const s = get()
    if (!s.lowSection) return
    set({
      lowSection: {
        ...s.lowSection,
        modules: s.lowSection.modules.map((m) =>
          m.slotIndex === slotIndex ? { ...m, hasDoor: !m.hasDoor } : m,
        ),
      },
    })
  },
  setLowSectionHasPowerHole: (slotIndex, value) => {
    const s = get()
    if (!s.lowSection) return
    set({
      lowSection: {
        ...s.lowSection,
        modules: s.lowSection.modules.map((m) =>
          m.slotIndex === slotIndex ? { ...m, hasPowerHole: value } : m,
        ),
      },
    })
  },
  setLowSectionModuleMaterial: (slotIndex, variant, id) => {
    const s = get()
    if (!s.lowSection) return
    const key = variant === 'buitenkant' ? 'buitenkantMaterialId' : 'binnenkantMaterialId'
    set({
      lowSection: {
        ...s.lowSection,
        modules: s.lowSection.modules.map((m) =>
          m.slotIndex === slotIndex ? { ...m, [key]: id } : m,
        ),
      },
    })
  },

  moduleCount: 2,
  modules: [
    { slotIndex: 0, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false },
    { slotIndex: 1, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false },
  ],

  buitenkantMaterialId: 'premium-wit',
  binnenkantMaterialId: 'premium-wit',
  doorHandleId: '23',
  doorHandleMaterial: 'chrome' as const,
  doorsExtendToFloor: false,
  lightStripsEnabled: false,
  doorsOpen: true,
  showMeasurements: false,
  userZoom: 0.5,
  selectedSlot: null,
  hoveredSlot: null,
  lastClickPoint: null,

  moduleWidthCm: () => {
    const { width, moduleCount } = get()
    return moduleCount > 0 ? width / moduleCount : width
  },

  minModules: () => {
    const maxW = get().constraints?.singleCorpus.maxWidth ?? FALLBACK_MODULE_MAX_WIDTH
    return Math.max(1, Math.ceil(get().width / maxW))
  },

  maxModules: () => {
    const minW = get().constraints?.singleCorpus.minWidth ?? FALLBACK_MODULE_MIN_WIDTH
    return Math.floor(get().width / minW)
  },

  needsTopCabinet: () => get().height > TOP_CABINET_THRESHOLD,
  topCabinetHeight: () => (get().needsTopCabinet() ? get().height - 225 - SIDE_WALL_EXTRA_CM : 0),
  mainHeight: () => (get().needsTopCabinet() ? 225 : get().height - SIDE_WALL_EXTRA_CM),

  hydrate: (data: FullPricingData) => {
    const { doorHandleId, doorHandleMaterial } = get()
    const handle = data.handles.find((h) => h.id === doorHandleId)
    const validatedMaterial = validateHandleMaterial(doorHandleMaterial, handle?.allowedMaterials)
    set({
      pricingData: data,
      constraints: data.config.constraints,
      moduleLayouts: data.modules,
      doorHandleMaterial: validatedMaterial,
    })
  },

  addWasherModule: (slotIndex, layoutId) => {
    const s = get()
    const target: WasherSection =
      s.washerSection ?? (s.layout === 'low-only' ? 'low' : 'high')
    set({
      washerModules: [
        ...s.washerModules.filter((w) => w.slotIndex !== slotIndex),
        { slotIndex, layoutId },
      ],
      washerSection: target,
    })
    // top-level modules hold the active editing section: high in any dual or
    // high-only, low in low-only. Write into the right section.
    const topLevelIsTarget =
      (target === 'high' && s.layout !== 'low-only') ||
      (target === 'low' && s.layout === 'low-only')
    if (topLevelIsTarget) {
      get().setModuleLayout(slotIndex, layoutId)
    } else {
      get().setLowSectionModuleLayout(slotIndex, layoutId)
    }
  },

  removeWasherModule: (slotIndex) => {
    const s = get()
    const target: WasherSection = s.washerSection
    const washerModules = s.washerModules.filter((w) => w.slotIndex !== slotIndex)
    set({
      washerModules,
      washerSection: washerModules.length === 0 ? null : s.washerSection,
    })
    const topLevelIsTarget =
      (target === 'high' && s.layout !== 'low-only') ||
      (target === 'low' && s.layout === 'low-only')
    if (topLevelIsTarget) {
      set({
        modules: s.modules.map((m) =>
          m.slotIndex === slotIndex ? { ...m, layoutId: null, fixedWidth: undefined } : m,
        ),
      })
    } else if (target === 'low' && s.lowSection) {
      set({
        lowSection: {
          ...s.lowSection,
          modules: s.lowSection.modules.map((m) =>
            m.slotIndex === slotIndex ? { ...m, layoutId: null, fixedWidth: undefined } : m,
          ),
        },
      })
    }
  },

  clearWasherModules: () => {
    const s = get()
    const washerSlots = new Set(s.washerModules.map((w) => w.slotIndex))
    const target: WasherSection = s.washerSection
    const topLevelIsTarget =
      (target === 'high' && s.layout !== 'low-only') ||
      (target === 'low' && s.layout === 'low-only')
    set({
      washerModules: [],
      washerSection: null,
      modules: topLevelIsTarget
        ? s.modules.map((m) =>
            washerSlots.has(m.slotIndex) ? { ...m, layoutId: null, fixedWidth: undefined } : m,
          )
        : s.modules,
      lowSection:
        target === 'low' && !topLevelIsTarget && s.lowSection
          ? {
              ...s.lowSection,
              modules: s.lowSection.modules.map((m) =>
                washerSlots.has(m.slotIndex)
                  ? { ...m, layoutId: null, fixedWidth: undefined }
                  : m,
              ),
            }
          : s.lowSection,
    })
  },

  setStep: (step) => set({ step, selectedSlot: null, lastClickPoint: null }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 7), selectedSlot: null, lastClickPoint: null })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1), selectedSlot: null, lastClickPoint: null })),

  setWidth: (width) => {
    const minW = get().constraints?.singleCorpus.minWidth ?? FALLBACK_MODULE_MIN_WIDTH
    const maxW = get().constraints?.singleCorpus.maxWidth ?? FALLBACK_MODULE_MAX_WIDTH
    const maxTotal = maxW * Math.floor(600 / minW)
    const clamped = Math.max(minW, Math.min(maxTotal, width))
    set({ width: clamped })

    const state = get()
    const min = state.minModules()
    const max = state.maxModules()
    if (state.moduleCount < min || state.moduleCount > max) {
      state.setModuleCount(Math.max(min, Math.min(max, state.moduleCount)))
    }
  },

  setHeight: (height) => {
    if (get().layout === 'low-only') return
    const c = get().constraints?.singleCorpus
    const topMax = get().constraints?.topCabinet.maxHeight ?? 110
    const maxH = (c?.maxHeight ?? 275) + topMax
    const minH = c?.minHeight ?? 200
    set({ height: Math.max(minH, Math.min(maxH, height)) })
  },

  setDepth: (depth) => {
    const c = get().constraints?.singleCorpus
    const minDepth = Math.max(MIN_DEPTH, c?.minDepth ?? MIN_DEPTH)
    const maxDepth = c?.maxDepth ?? 120
    set({ depth: Math.max(minDepth, Math.min(maxDepth, depth)) })
  },

  setModuleCount: (count) => {
    const min = get().minModules()
    const max = get().maxModules()
    const clamped = Math.max(min, Math.min(max, count))
    const existing = get().modules
    const modules: BaseModuleSlot[] = Array.from({ length: clamped }, (_, i) =>
      existing[i] ?? { slotIndex: i, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false }
    ).map((m) => ({
      ...m,
      hasPowerHole: m.hasPowerHole ?? false,
      span: (m.span === 2 && m.slotIndex + 1 >= clamped ? 1 : m.span) as 1 | 2,
    }))
    set({ moduleCount: clamped, modules })

    const outOfBounds = get().washerModules.filter((w) => w.slotIndex >= clamped)
    if (outOfBounds.length > 0) {
      outOfBounds.forEach((w) => get().removeWasherModule(w.slotIndex))
      if (get().washerModules.length === 0) set({ step: 2 })
    }
  },

  setModuleLayout: (slotIndex: number, layoutId: number) => {
    const layout = get().moduleLayouts.find((l) => l.layoutId === layoutId)
    const fixedWidth = layout?.minSlotWidth
    set((s) => ({
      modules: s.modules.map((m) => {
        if (m.slotIndex === slotIndex) return { ...m, layoutId, fixedWidth }
        if (m.slotIndex === slotIndex - 1 && m.span === 2) return { ...m, span: 1 as const }
        return m
      }),
    }))
  },

  setModuleSpan: (slotIndex: number, span: 1 | 2) =>
    set((s) => ({
      modules: s.modules.map((m) => {
        if (m.slotIndex === slotIndex) return { ...m, span }
        if (span === 2 && m.slotIndex === slotIndex + 1) return { ...m, layoutId: null, span: 1 as const, fixedWidth: undefined }
        if (span === 2 && m.slotIndex === slotIndex - 1 && m.span === 2) return { ...m, span: 1 as const }
        return m
      }),
    })),

  toggleModuleDoor: (slotIndex) =>
    set((s) => ({
      modules: s.modules.map((m) => (m.slotIndex === slotIndex ? { ...m, hasDoor: !m.hasDoor } : m)),
    })),

  setHasPowerHole: (slotIndex, value) =>
    set((s) => ({
      modules: s.modules.map((m) => (m.slotIndex === slotIndex ? { ...m, hasPowerHole: value } : m)),
    })),

  setBuitenkantMaterialId: (buitenkantMaterialId) =>
    set((s) => ({
      buitenkantMaterialId,
      modules: s.modules.map((m) => ({ ...m, buitenkantMaterialId: undefined })),
    })),

  setBinnenkantMaterialId: (binnenkantMaterialId) =>
    set((s) => ({
      binnenkantMaterialId,
      modules: s.modules.map((m) => ({ ...m, binnenkantMaterialId: undefined })),
    })),

  setModuleMaterial: (slotIndex, variant, id) =>
    set((s) => ({
      modules: s.modules.map((m) =>
        m.slotIndex === slotIndex
          ? { ...m, [variant === 'buitenkant' ? 'buitenkantMaterialId' : 'binnenkantMaterialId']: id }
          : m
      ),
    })),

  setDoorHandleId: (doorHandleId) => {
    const { pricingData, doorHandleMaterial } = get()
    const handle = pricingData?.handles.find((h) => h.id === doorHandleId)
    set({
      doorHandleId,
      doorHandleMaterial: validateHandleMaterial(doorHandleMaterial, handle?.allowedMaterials),
    })
  },
  setDoorHandleMaterial: (doorHandleMaterial) => {
    const { pricingData, doorHandleId } = get()
    const handle = pricingData?.handles.find((h) => h.id === doorHandleId)
    set({ doorHandleMaterial: validateHandleMaterial(doorHandleMaterial, handle?.allowedMaterials) })
  },
  setDoorsExtendToFloor: (doorsExtendToFloor) => set({ doorsExtendToFloor }),
  setLightStripsEnabled: (lightStripsEnabled) => set({ lightStripsEnabled }),
  toggleDoors: () => set((s) => ({ doorsOpen: !s.doorsOpen })),
  toggleMeasurements: () => set((s) => ({ showMeasurements: !s.showMeasurements })),
  zoomIn: () => set((s) => ({ userZoom: Math.max(0, s.userZoom - 0.1) })),
  zoomOut: () => set((s) => ({ userZoom: Math.min(1, s.userZoom + 0.1) })),
  setSelectedSlot: (slot, clickPoint) =>
    set({
      selectedSlot: slot,
      lastClickPoint: slot === null ? null : (clickPoint ?? null),
    }),
  setHoveredSlot: (slot) => set({ hoveredSlot: slot }),

  randomFill: () => {
    const { modules, moduleLayouts, washerModules } = get()
    const washerSlots = new Set(washerModules.map((w) => w.slotIndex))
    const washerLayoutIds = new Set(WASHER_LAYOUTS.map((l) => l.layoutId))
    const pool = moduleLayouts.filter((l) => !washerLayoutIds.has(l.layoutId))
    const newModules: BaseModuleSlot[] = modules.map((m, i) => {
      if (washerSlots.has(i)) return m
      const layoutId = pool[Math.floor(Math.random() * pool.length)]?.layoutId ?? null
      return { ...m, slotIndex: i, layoutId }
    })
    set({ modules: newModules })
  },

  restoreConfig: (config: ClosetConfigSnapshot) => {
    const { moduleLayouts } = get()

    const snapshot: WasmSectionsSnapshot = {
      layout: config.layout,
      widthCm: config.widthCm,
      heightCm: config.heightCm,
      moduleCount: config.moduleCount,
      modules: config.modules,
      depthCm: config.depthCm,
      washerModules: config.washerModules,
      lowSection: config.lowSection,
      washerSection: config.washerSection,
    }
    const migrated = restoreWasmSnapshot(snapshot)

    const active: Section | null =
      migrated.layout === 'low-only' ? migrated.lowSection : migrated.highSection
    const width = active?.width ?? config.widthCm
    const height = active?.height ?? config.heightCm
    const moduleCount = active?.moduleCount ?? config.moduleCount
    const modules: BaseModuleSlot[] = (active?.modules ?? []).map((m) => {
      const layout = moduleLayouts.find((l) => l.layoutId === m.layoutId)
      return { ...m, fixedWidth: layout?.minSlotWidth }
    })
    const washerTargetSection: Section | null =
      migrated.washerSection === 'low' ? migrated.lowSection : active
    const washerMax = washerTargetSection?.moduleCount ?? 0
    const washerModules = migrated.washerModules.filter((w) => w.slotIndex < washerMax)
    const washerSection: WasherSection =
      migrated.washerSection ?? (washerModules.length > 0 ? (migrated.layout === 'low-only' ? 'low' : 'high') : null)
    const restoredLowSection: Section | null = migrated.lowSection
      ? {
          ...migrated.lowSection,
          modules: migrated.lowSection.modules.map((m) => {
            const layout = moduleLayouts.find((l) => l.layoutId === m.layoutId)
            return { ...m, fixedWidth: layout?.minSlotWidth }
          }),
        }
      : null

    set({
      width,
      height,
      depth: migrated.depth,
      moduleCount,
      modules,
      layout: migrated.layout,
      lowSection: restoredLowSection,
      washerSection,
      topPanelThicknessMm: migrated.lowSection?.topPanelThicknessMm ?? 18,
      countertopMaterialId:
        migrated.lowSection?.countertopMaterialId ?? config.buitenkantMaterialId,
      buitenkantMaterialId: config.buitenkantMaterialId,
      binnenkantMaterialId: config.binnenkantMaterialId,
      doorHandleId: config.doorHandleId,
      doorHandleMaterial: config.doorHandleMaterial ?? 'chrome',
      doorsExtendToFloor: config.doorsExtendToFloor ?? false,
      lightStripsEnabled: config.lightStripsEnabled,
      placementType: (config.placementType ?? 'ingebouwd') as PlacementType,
      washerModules,
      activeModulesSection: migrated.layout === 'low-only' ? 'low' : 'high',
      step: 1,
      selectedSlot: null,
      lastClickPoint: null,
    })
  },
}))

export { LOW_SECTION_HEIGHT_CM, DEFAULT_HIGH_HEIGHT_CM }
