import { create } from 'zustand'
import type { FullPricingData, ModuleLayout, PricingConstraints } from '@/types/configurator-pricing'
import type { DiagonalSide } from './scene/diagonalUtils'
import { isFullHeight } from './scene/diagonalUtils'

export interface ModuleSlot {
  slotIndex: number
  layoutId: number | null // null = empty slot
  hasDoor: boolean
  span: 1 | 2 // 1 = single width, 2 = double (occupies this slot + the next)
  buitenkantMaterialId?: string // overrides global buitenkant for this module
  binnenkantMaterialId?: string // overrides global binnenkant for this module
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

  // Diagonal walls
  diagonalSide: DiagonalSide
  leftDiagStartHeight: number  // cm
  rightDiagStartHeight: number // cm
  diagTopWidth: number         // cm — shared for both sides

  // Modules
  moduleCount: number
  modules: ModuleSlot[]

  // Appearance
  buitenkantMaterialId: string
  binnenkantMaterialId: string
  doorHandleId: string

  // View options
  doorsOpen: boolean
  showMeasurements: boolean
  userZoom: number

  // Selection (shared between 3D scene and step panels)
  selectedSlot: number | null
  hoveredSlot: number | null

  // Derived
  moduleWidthCm: () => number
  minModules: () => number
  maxModules: () => number
  needsTopCabinet: () => boolean
  topCabinetHeight: () => number
  mainHeight: () => number

  // Actions
  setDiagonalSide: (side: DiagonalSide) => void
  setLeftDiagStartHeight: (v: number) => void
  setRightDiagStartHeight: (v: number) => void
  setDiagTopWidth: (v: number) => void
  hydrate: (data: FullPricingData) => void
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setWidth: (w: number) => void
  setHeight: (h: number) => void
  setDepth: (d: number) => void
  setModuleCount: (count: number) => void
  setModuleLayout: (slotIndex: number, layoutId: number) => void
  setModuleSpan: (slotIndex: number, span: 1 | 2) => void
  toggleModuleDoor: (slotIndex: number) => void
  setBuitenkantMaterialId: (id: string) => void
  setBinnenkantMaterialId: (id: string) => void
  setModuleMaterial: (slotIndex: number, variant: 'buitenkant' | 'binnenkant', id: string) => void
  setDoorHandleId: (id: string) => void
  toggleDoors: () => void
  toggleMeasurements: () => void
  zoomIn: () => void
  zoomOut: () => void
  setSelectedSlot: (slot: number | null) => void
  setHoveredSlot: (slot: number | null) => void
  randomFill: () => void
}

const WALL_M = 0.018

/** Reset span=2 on any slots that fall under the diagonal zone. */
function resetDiagDoubles(modules: ModuleSlot[], diagParams: {
  diagonalSide: DiagonalSide
  leftDiagStartHeight: number
  rightDiagStartHeight: number
  diagTopWidth: number
  outerWidth: number
  mainHeight: number
}, moduleCount: number, widthM: number): ModuleSlot[] {
  if (diagParams.diagonalSide === 'none') return modules
  const slotW = (widthM - WALL_M * 2) / moduleCount
  return modules.map((m) => {
    if (m.span !== 2) return m
    const leftX  = WALL_M + m.slotIndex * slotW
    const rightX = WALL_M + (m.slotIndex + m.span) * slotW
    if (!isFullHeight(leftX, rightX, diagParams)) return { ...m, span: 1 as const }
    return m
  })
}

const TOP_CABINET_THRESHOLD = 275
// Side walls always extend 15mm above the interior top panel.
// This is deducted from the usable interior height so modules fit correctly.
const SIDE_WALL_EXTRA_CM = 1.5

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

  diagonalSide: 'none',
  leftDiagStartHeight: 180,
  rightDiagStartHeight: 180,
  diagTopWidth: 50,

  moduleCount: 3,
  modules: [
    { slotIndex: 0, layoutId: null, hasDoor: true, span: 1 },
    { slotIndex: 1, layoutId: null, hasDoor: true, span: 1 },
    { slotIndex: 2, layoutId: null, hasDoor: true, span: 1 },
  ],

  buitenkantMaterialId: 'green-shadow',
  binnenkantMaterialId: 'everest-white',
  doorHandleId: '23',
  doorsOpen: true,
  showMeasurements: false,
  userZoom: 0.5,
  selectedSlot: null,
  hoveredSlot: null,

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

  needsTopCabinet: () => get().diagonalSide === 'none' && get().height > TOP_CABINET_THRESHOLD,
  topCabinetHeight: () => (get().needsTopCabinet() ? get().height - 225 - SIDE_WALL_EXTRA_CM : 0),
  mainHeight: () => (get().needsTopCabinet() ? 225 : get().height - SIDE_WALL_EXTRA_CM),

  // Actions
  setDiagonalSide: (diagonalSide) => {
    const s = get()
    const mainH = s.mainHeight()
    const diagParams = {
      diagonalSide,
      leftDiagStartHeight:  Math.min(s.leftDiagStartHeight,  mainH - 20) / 100,
      rightDiagStartHeight: Math.min(s.rightDiagStartHeight, mainH - 20) / 100,
      diagTopWidth:  s.diagTopWidth / 100,
      outerWidth:    s.width / 100,
      mainHeight:    mainH / 100,
    }
    set({ diagonalSide, modules: resetDiagDoubles(s.modules, diagParams, s.moduleCount, s.width / 100) })
  },

  setLeftDiagStartHeight: (v) => {
    const s = get()
    const mainH = s.mainHeight()
    const clamped = Math.max(100, Math.min(mainH * 100 - 20, v))
    const diagParams = {
      diagonalSide: s.diagonalSide,
      leftDiagStartHeight:  Math.min(clamped, mainH - 20) / 100,
      rightDiagStartHeight: Math.min(s.rightDiagStartHeight, mainH - 20) / 100,
      diagTopWidth:  s.diagTopWidth / 100,
      outerWidth:    s.width / 100,
      mainHeight:    mainH / 100,
    }
    set({ leftDiagStartHeight: clamped, modules: resetDiagDoubles(s.modules, diagParams, s.moduleCount, s.width / 100) })
  },

  setRightDiagStartHeight: (v) => {
    const s = get()
    const mainH = s.mainHeight()
    const clamped = Math.max(100, Math.min(mainH * 100 - 20, v))
    const diagParams = {
      diagonalSide: s.diagonalSide,
      leftDiagStartHeight:  Math.min(s.leftDiagStartHeight, mainH - 20) / 100,
      rightDiagStartHeight: Math.min(clamped, mainH - 20) / 100,
      diagTopWidth:  s.diagTopWidth / 100,
      outerWidth:    s.width / 100,
      mainHeight:    mainH / 100,
    }
    set({ rightDiagStartHeight: clamped, modules: resetDiagDoubles(s.modules, diagParams, s.moduleCount, s.width / 100) })
  },

  setDiagTopWidth: (v) => {
    const s = get()
    const mainH = s.mainHeight()
    const halfWidth = s.width / 2 - 5
    const clamped = Math.max(10, Math.min(halfWidth, v))
    const diagParams = {
      diagonalSide: s.diagonalSide,
      leftDiagStartHeight:  Math.min(s.leftDiagStartHeight,  mainH - 20) / 100,
      rightDiagStartHeight: Math.min(s.rightDiagStartHeight, mainH - 20) / 100,
      diagTopWidth:  clamped / 100,
      outerWidth:    s.width / 100,
      mainHeight:    mainH / 100,
    }
    set({ diagTopWidth: clamped, modules: resetDiagDoubles(s.modules, diagParams, s.moduleCount, s.width / 100) })
  },

  hydrate: (data) => {
    set({
      pricingData: data,
      constraints: data.config.constraints,
      moduleLayouts: data.modules,
    })
  },

  setStep: (step) => set({ step, selectedSlot: null }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 4), selectedSlot: null })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1), selectedSlot: null })),

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
      existing[i] ?? { slotIndex: i, layoutId: null, hasDoor: true, span: 1 }
    ).map((m) =>
      // clear a double that would overflow beyond the new count
      m.span === 2 && m.slotIndex + 1 >= clamped ? { ...m, span: 1 as const } : m
    )
    set({ moduleCount: clamped, modules })
  },

  setModuleLayout: (slotIndex: number, layoutId: number) =>
    set((s) => ({
      modules: s.modules.map((m) => {
        if (m.slotIndex === slotIndex) return { ...m, layoutId }
        // if the previous slot was a double covering this one, clear it
        if (m.slotIndex === slotIndex - 1 && m.span === 2) return { ...m, span: 1 as const }
        return m
      }),
    })),

  setModuleSpan: (slotIndex: number, span: 1 | 2) =>
    set((s) => ({
      modules: s.modules.map((m) => {
        if (m.slotIndex === slotIndex) return { ...m, span }
        // when doubling: clear the secondary slot's layout
        if (span === 2 && m.slotIndex === slotIndex + 1) return { ...m, layoutId: null, span: 1 as const }
        // when doubling: clear any previous double that was covering this slot
        if (span === 2 && m.slotIndex === slotIndex - 1 && m.span === 2) return { ...m, span: 1 as const }
        return m
      }),
    })),

  toggleModuleDoor: (slotIndex) =>
    set((s) => ({
      modules: s.modules.map((m) => (m.slotIndex === slotIndex ? { ...m, hasDoor: !m.hasDoor } : m)),
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
  toggleDoors: () => set((s) => ({ doorsOpen: !s.doorsOpen })),
  toggleMeasurements: () => set((s) => ({ showMeasurements: !s.showMeasurements })),
  zoomIn: () => set((s) => ({ userZoom: Math.max(0, s.userZoom - 0.1) })),
  zoomOut: () => set((s) => ({ userZoom: Math.min(1, s.userZoom + 0.1) })),
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  setHoveredSlot: (slot) => set({ hoveredSlot: slot }),
  randomFill: () => {
    const { moduleCount, modules } = get()
    const layoutIds = [1, 2, 3, 4, 5, 6, 7, 8]
    const newModules: ModuleSlot[] = []
    let i = 0
    while (i < moduleCount) {
      const canDouble = i + 1 < moduleCount
      const isDouble = canDouble && Math.random() < 0.3
      const span: 1 | 2 = isDouble ? 2 : 1
      const layoutId = layoutIds[Math.floor(Math.random() * layoutIds.length)]
      newModules.push({ ...modules[i], slotIndex: i, layoutId, span })
      if (isDouble) {
        newModules.push({ ...modules[i + 1], slotIndex: i + 1, layoutId: null, span: 1 })
        i += 2
      } else {
        i += 1
      }
    }
    set({ modules: newModules })
  },
}))
