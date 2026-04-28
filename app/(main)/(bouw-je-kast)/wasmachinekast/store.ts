import { create } from 'zustand'
import type { FullPricingData, ModuleLayout, PricingConstraints } from '@/types/configurator-pricing'
import type { BaseConfiguratorState, BaseModuleSlot } from '../_shared/store/types'
import type { ClosetConfigSnapshot } from '@/lib/cart/types'

export type { BaseModuleSlot as ModuleSlot }

const MIN_DEPTH = 65

const FALLBACK_MODULE_MIN_WIDTH = 15
const FALLBACK_MODULE_MAX_WIDTH = 65

const TOP_CABINET_THRESHOLD = 275
const SIDE_WALL_EXTRA_CM = 1.5

interface WasmState extends BaseConfiguratorState {}

export const useWasmachinekastStore = create<WasmState>((set, get) => ({
  pricingData: null,
  constraints: null,
  moduleLayouts: [],

  step: 1,

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

  setStep: (step) => set({ step, selectedSlot: null }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 5), selectedSlot: null })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1), selectedSlot: null })),

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
  },

  setModuleLayout: (slotIndex: number, layoutId: number) => {
    const s = get()
    const layout = s.moduleLayouts.find((l) => l.layoutId === layoutId)
    if (layout?.minSlotWidth && s.moduleWidthCm() < layout.minSlotWidth) {
      return // slot too narrow — no-op
    }
    set((s) => ({
      modules: s.modules.map((m) => {
        if (m.slotIndex === slotIndex) return { ...m, layoutId }
        if (m.slotIndex === slotIndex - 1 && m.span === 2) return { ...m, span: 1 as const }
        return m
      }),
    }))
  },

  setModuleSpan: (slotIndex: number, span: 1 | 2) =>
    set((s) => ({
      modules: s.modules.map((m) => {
        if (m.slotIndex === slotIndex) return { ...m, span }
        if (span === 2 && m.slotIndex === slotIndex + 1) return { ...m, layoutId: null, span: 1 as const }
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
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  setHoveredSlot: (slot) => set({ hoveredSlot: slot }),

  randomFill: () => {
    const { moduleCount, modules, moduleLayouts } = get()
    const newModules: BaseModuleSlot[] = modules.map((m, i) => {
      const layoutId = moduleLayouts[Math.floor(Math.random() * moduleLayouts.length)]?.layoutId ?? null
      return { ...m, slotIndex: i, layoutId }
    })
    set({ modules: newModules })
  },

  restoreConfig: (config: ClosetConfigSnapshot) => {
    set({
      width: config.widthCm,
      height: config.heightCm,
      depth: config.depthCm,
      moduleCount: config.moduleCount,
      modules: config.modules.map((m) => ({
        slotIndex: m.slotIndex,
        layoutId: m.layoutId,
        hasDoor: m.hasDoor,
        span: m.span,
        buitenkantMaterialId: m.buitenkantMaterialId,
        binnenkantMaterialId: m.binnenkantMaterialId,
        hasPowerHole: m.hasPowerHole ?? false,
      })),
      buitenkantMaterialId: config.buitenkantMaterialId,
      binnenkantMaterialId: config.binnenkantMaterialId,
      doorHandleId: config.doorHandleId,
      doorHandleMaterial: config.doorHandleMaterial ?? 'chrome',
      doorsExtendToFloor: config.doorsExtendToFloor ?? false,
      lightStripsEnabled: config.lightStripsEnabled,
      step: 1,
      selectedSlot: null,
    })
  },
}))
