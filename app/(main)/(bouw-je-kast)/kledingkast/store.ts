import { create } from 'zustand'
import type { FullPricingData, ModuleLayout, PricingConstraints } from '@/types/configurator-pricing'

export interface ModuleSlot {
  slotIndex: number
  layoutId: number | null // null = empty slot
}

interface ClosetState {
  // Sanity data
  pricingData: FullPricingData | null
  constraints: PricingConstraints | null
  moduleLayouts: ModuleLayout[]

  // Wizard
  step: number

  // Dimensions (cm) — total closet dimensions
  width: number
  height: number
  depth: number

  // Modules
  moduleCount: number
  modules: ModuleSlot[]

  // Appearance
  materialId: string
  doorHandleId: string

  // View options
  doorsOpen: boolean
  showMeasurements: boolean
  userZoom: number

  // Selection (shared between 3D scene and step panels)
  selectedSlot: number | null

  // Derived
  moduleWidthCm: () => number
  minModules: () => number
  maxModules: () => number
  needsTopCabinet: () => boolean
  topCabinetHeight: () => number
  mainHeight: () => number

  // Actions
  hydrate: (data: FullPricingData) => void
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setWidth: (w: number) => void
  setHeight: (h: number) => void
  setDepth: (d: number) => void
  setModuleCount: (count: number) => void
  setModuleLayout: (slotIndex: number, layoutId: number) => void
  setMaterialId: (id: string) => void
  setDoorHandleId: (id: string) => void
  toggleDoors: () => void
  toggleMeasurements: () => void
  zoomIn: () => void
  zoomOut: () => void
  setSelectedSlot: (slot: number | null) => void
}

const TOP_CABINET_THRESHOLD = 275

// Fallback constraints before Sanity data loads
const FALLBACK_MODULE_MIN_WIDTH = 15
const FALLBACK_MODULE_MAX_WIDTH = 65

export const useClosetStore = create<ClosetState>((set, get) => ({
  pricingData: null,
  constraints: null,
  moduleLayouts: [],

  step: 1,

  width: 180,
  height: 240,
  depth: 60,

  moduleCount: 3,
  modules: [
    { slotIndex: 0, layoutId: null },
    { slotIndex: 1, layoutId: null },
    { slotIndex: 2, layoutId: null },
  ],

  materialId: 'white',
  doorHandleId: 'default',
  doorsOpen: false,
  showMeasurements: false,
  userZoom: 0.5,
  selectedSlot: null,

  // Derived
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
  topCabinetHeight: () => {
    const h = get().height
    return h > TOP_CABINET_THRESHOLD ? h - TOP_CABINET_THRESHOLD : 0
  },
  mainHeight: () => Math.min(get().height, TOP_CABINET_THRESHOLD),

  // Actions
  hydrate: (data) => {
    set({
      pricingData: data,
      constraints: data.config.constraints,
      moduleLayouts: data.modules,
    })
  },

  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 3) })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1) })),

  setWidth: (width) => {
    const minW = get().constraints?.singleCorpus.minWidth ?? FALLBACK_MODULE_MIN_WIDTH
    const maxW = get().constraints?.singleCorpus.maxWidth ?? FALLBACK_MODULE_MAX_WIDTH
    const maxTotal = maxW * Math.floor(600 / minW) // reasonable upper bound
    const clamped = Math.max(minW, Math.min(maxTotal, width))
    set({ width: clamped })

    // Auto-adjust moduleCount if current count is out of new valid range
    const state = get()
    const min = state.minModules()
    const max = state.maxModules()
    if (state.moduleCount < min || state.moduleCount > max) {
      const newCount = Math.max(min, Math.min(max, state.moduleCount))
      state.setModuleCount(newCount)
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
    if (c) {
      set({ depth: Math.max(c.minDepth, Math.min(c.maxDepth, depth)) })
    } else {
      set({ depth })
    }
  },

  setModuleCount: (count) => {
    const min = get().minModules()
    const max = get().maxModules()
    const clamped = Math.max(min, Math.min(max, count))
    const existing = get().modules
    const modules: ModuleSlot[] = Array.from({ length: clamped }, (_, i) =>
      existing[i] ?? { slotIndex: i, layoutId: null }
    )
    set({ moduleCount: clamped, modules })
  },

  setModuleLayout: (slotIndex, layoutId) =>
    set((s) => ({
      modules: s.modules.map((m) => (m.slotIndex === slotIndex ? { ...m, layoutId } : m)),
    })),

  setMaterialId: (materialId) => set({ materialId }),
  setDoorHandleId: (doorHandleId) => set({ doorHandleId }),
  toggleDoors: () => set((s) => ({ doorsOpen: !s.doorsOpen })),
  toggleMeasurements: () => set((s) => ({ showMeasurements: !s.showMeasurements })),
  zoomIn: () => set((s) => ({ userZoom: Math.max(0, s.userZoom - 0.1) })),
  zoomOut: () => set((s) => ({ userZoom: Math.min(1, s.userZoom + 0.1) })),
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
}))
