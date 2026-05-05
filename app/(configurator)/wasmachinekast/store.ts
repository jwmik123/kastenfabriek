import { create } from 'zustand'
import type { FullPricingData } from '@/types/configurator-pricing'
import type { BaseConfiguratorState, BaseModuleSlot } from '../_shared/store/types'
import type { ClosetConfigSnapshot } from '@/lib/cart/types'
import { WASHER_LAYOUTS } from './moduleLayouts'
import type { PopoverClickPoint } from '../_shared/components/popoverPlacement'

export type { BaseModuleSlot as ModuleSlot }

export type PlacementType = 'vrijstaand' | 'ingebouwd'

export interface WasherModule {
  slotIndex: number
  layoutId: number
}

const MIN_DEPTH = 65
const FALLBACK_MODULE_MIN_WIDTH = 15
const FALLBACK_MODULE_MAX_WIDTH = 65
const TOP_CABINET_THRESHOLD = 275
const SIDE_WALL_EXTRA_CM = 1.5

interface WasmState extends BaseConfiguratorState {
  placementType: PlacementType
  setPlacementType: (type: PlacementType) => void
  washerModules: WasherModule[]
  addWasherModule: (slotIndex: number, layoutId: number) => void
  removeWasherModule: (slotIndex: number) => void
  clearWasherModules: () => void
  lastClickPoint: PopoverClickPoint
  setSelectedSlot: (slot: number | null, clickPoint?: PopoverClickPoint) => void
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
  depth: 65,

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
    set({
      pricingData: data,
      constraints: data.config.constraints,
      moduleLayouts: data.modules,
    })
  },

  addWasherModule: (slotIndex, layoutId) => {
    set((s) => ({
      washerModules: [
        ...s.washerModules.filter((w) => w.slotIndex !== slotIndex),
        { slotIndex, layoutId },
      ],
    }))
    get().setModuleLayout(slotIndex, layoutId)
  },

  removeWasherModule: (slotIndex) => {
    set((s) => ({
      washerModules: s.washerModules.filter((w) => w.slotIndex !== slotIndex),
      modules: s.modules.map((m) =>
        m.slotIndex === slotIndex ? { ...m, layoutId: null, fixedWidth: undefined } : m
      ),
    }))
  },

  clearWasherModules: () => {
    const { washerModules } = get()
    const washerSlots = new Set(washerModules.map((w) => w.slotIndex))
    set((s) => ({
      washerModules: [],
      modules: s.modules.map((m) =>
        washerSlots.has(m.slotIndex) ? { ...m, layoutId: null, fixedWidth: undefined } : m
      ),
    }))
  },

  setStep: (step) => set({ step, selectedSlot: null, lastClickPoint: null }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 6), selectedSlot: null, lastClickPoint: null })),
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

  setDoorHandleId: (doorHandleId) => set({ doorHandleId }),
  setDoorHandleMaterial: (doorHandleMaterial) => set({ doorHandleMaterial }),
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
    const washerModules: WasherModule[] = (config.washerModules ?? []).filter(
      (w) => w.slotIndex < config.moduleCount
    )
    set({
      width: config.widthCm,
      height: config.heightCm,
      depth: config.depthCm,
      moduleCount: config.moduleCount,
      modules: config.modules.map((m) => {
        const layout = moduleLayouts.find((l) => l.layoutId === m.layoutId)
        return {
          slotIndex: m.slotIndex,
          layoutId: m.layoutId,
          hasDoor: m.hasDoor,
          span: m.span,
          buitenkantMaterialId: m.buitenkantMaterialId,
          binnenkantMaterialId: m.binnenkantMaterialId,
          hasPowerHole: m.hasPowerHole ?? false,
          fixedWidth: layout?.minSlotWidth,
        }
      }),
      buitenkantMaterialId: config.buitenkantMaterialId,
      binnenkantMaterialId: config.binnenkantMaterialId,
      doorHandleId: config.doorHandleId,
      doorHandleMaterial: config.doorHandleMaterial ?? 'chrome',
      doorsExtendToFloor: config.doorsExtendToFloor ?? false,
      lightStripsEnabled: config.lightStripsEnabled,
      placementType: (config.placementType ?? 'ingebouwd') as PlacementType,
      washerModules,
      step: 1,
      selectedSlot: null,
      lastClickPoint: null,
    })
  },
}))
