import { create } from 'zustand'
import type { FullPricingData, ModuleLayout, PricingConstraints } from '@/types/configurator-pricing'
import type { DiagonalSide } from './scene/diagonalUtils'
import { getDiagHeightAt, isFullHeight } from './scene/diagonalUtils'
import { getWidthRange, getStartHeightRange, clamp, diagAmplification } from './diagonalConstraints'
import { MODULE_LAYOUTS } from './scene/moduleLayouts'
import type { ClosetConfigSnapshot } from '@/lib/cart/types'

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
  leftDiagStartHeight: number   // cm
  rightDiagStartHeight: number  // cm
  leftDiagTopWidth: number      // cm — horizontal reach of left diagonal
  rightDiagTopWidth: number     // cm — horizontal reach of right diagonal

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
  setLeftDiagTopWidth: (v: number) => void
  setRightDiagTopWidth: (v: number) => void
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
  restoreConfig: (config: ClosetConfigSnapshot) => void
}

const WALL_M = 0.018

/** Reset span=2 on any slots that fall under the diagonal zone. */
function resetDiagDoubles(modules: ModuleSlot[], diagParams: {
  diagonalSide: DiagonalSide
  leftDiagStartHeight: number
  rightDiagStartHeight: number
  leftDiagTopWidth: number
  rightDiagTopWidth: number
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
  leftDiagTopWidth: 50,
  rightDiagTopWidth: 50,

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

  needsTopCabinet: () => get().height > TOP_CABINET_THRESHOLD,
  topCabinetHeight: () => (get().needsTopCabinet() ? get().height - 225 - SIDE_WALL_EXTRA_CM : 0),
  mainHeight: () => (get().needsTopCabinet() ? 225 : get().height - SIDE_WALL_EXTRA_CM),

  // Actions
  setDiagonalSide: (diagonalSide) => {
    const s = get()
    const mainH = s.mainHeight()
    const hasBoth = diagonalSide === 'both'
    const hasLeft = diagonalSide === 'left' || hasBoth
    const hasRight = diagonalSide === 'right' || hasBoth

    // Compute visual widths (reach at full closet height) for constraint checks
    const leftAmp  = diagAmplification(s.leftDiagStartHeight,  mainH, s.height)
    const rightAmp = diagAmplification(s.rightDiagStartHeight, mainH, s.height)
    const leftVisual  = s.leftDiagTopWidth  * leftAmp
    const rightVisual = s.rightDiagTopWidth * rightAmp

    const leftRange  = hasLeft  ? getWidthRange('left',  s.width, s.moduleCount, hasBoth ? rightVisual : null) : null
    const rightRange = hasRight ? getWidthRange('right', s.width, s.moduleCount, hasBoth ? leftVisual  : null) : null

    // Clamp in visual space, convert back to internal
    const clampedLeft  = leftRange  ? Math.round(clamp(leftVisual,  leftRange.min,  leftRange.max)  / leftAmp)  : s.leftDiagTopWidth
    const clampedRight = rightRange ? Math.round(clamp(rightVisual, rightRange.min, rightRange.max) / rightAmp) : s.rightDiagTopWidth

    const diagParams = {
      diagonalSide,
      leftDiagStartHeight:  Math.min(s.leftDiagStartHeight,  mainH - 20) / 100,
      rightDiagStartHeight: Math.min(s.rightDiagStartHeight, mainH - 20) / 100,
      leftDiagTopWidth:  clampedLeft  / 100,
      rightDiagTopWidth: clampedRight / 100,
      outerWidth: s.width / 100,
      mainHeight: mainH   / 100,
    }
    set({
      diagonalSide,
      leftDiagTopWidth: clampedLeft,
      rightDiagTopWidth: clampedRight,
      modules: resetDiagDoubles(s.modules, diagParams, s.moduleCount, s.width / 100),
    })
  },

  setLeftDiagStartHeight: (v) => {
    const s = get()
    const mainH = s.mainHeight()
    const { min: shMin, max: shMax } = getStartHeightRange(mainH)
    const clamped = clamp(v, shMin, shMax)

    // Maintain the visual width (reach at full closet height) constant across the start-height change
    const oldAmp    = diagAmplification(s.leftDiagStartHeight, mainH, s.height)
    const newAmp    = diagAmplification(clamped,               mainH, s.height)
    const currentVisual = s.leftDiagTopWidth * oldAmp
    const rightVisual   = s.diagonalSide === 'both'
      ? s.rightDiagTopWidth * diagAmplification(s.rightDiagStartHeight, mainH, s.height)
      : null
    const range        = getWidthRange('left', s.width, s.moduleCount, rightVisual)
    const clampedVisual = clamp(currentVisual, range.min, range.max)
    const newInternal  = Math.round(clampedVisual / newAmp)

    const diagParams = {
      diagonalSide: s.diagonalSide,
      leftDiagStartHeight:  Math.min(clamped, mainH - 20) / 100,
      rightDiagStartHeight: Math.min(s.rightDiagStartHeight, mainH - 20) / 100,
      leftDiagTopWidth:  newInternal         / 100,
      rightDiagTopWidth: s.rightDiagTopWidth / 100,
      outerWidth: s.width / 100,
      mainHeight: mainH   / 100,
    }
    set({ leftDiagStartHeight: clamped, leftDiagTopWidth: newInternal, modules: resetDiagDoubles(s.modules, diagParams, s.moduleCount, s.width / 100) })
  },

  setRightDiagStartHeight: (v) => {
    const s = get()
    const mainH = s.mainHeight()
    const { min: shMin, max: shMax } = getStartHeightRange(mainH)
    const clamped = clamp(v, shMin, shMax)

    // Maintain the visual width (reach at full closet height) constant across the start-height change
    const oldAmp    = diagAmplification(s.rightDiagStartHeight, mainH, s.height)
    const newAmp    = diagAmplification(clamped,                mainH, s.height)
    const currentVisual = s.rightDiagTopWidth * oldAmp
    const leftVisual    = s.diagonalSide === 'both'
      ? s.leftDiagTopWidth * diagAmplification(s.leftDiagStartHeight, mainH, s.height)
      : null
    const range         = getWidthRange('right', s.width, s.moduleCount, leftVisual)
    const clampedVisual = clamp(currentVisual, range.min, range.max)
    const newInternal   = Math.round(clampedVisual / newAmp)

    const diagParams = {
      diagonalSide: s.diagonalSide,
      leftDiagStartHeight:  Math.min(s.leftDiagStartHeight, mainH - 20) / 100,
      rightDiagStartHeight: Math.min(clamped, mainH - 20)               / 100,
      leftDiagTopWidth:  s.leftDiagTopWidth / 100,
      rightDiagTopWidth: newInternal        / 100,
      outerWidth: s.width / 100,
      mainHeight: mainH   / 100,
    }
    set({ rightDiagStartHeight: clamped, rightDiagTopWidth: newInternal, modules: resetDiagDoubles(s.modules, diagParams, s.moduleCount, s.width / 100) })
  },

  setLeftDiagTopWidth: (v) => {
    // v is internal (reach at mainH, cm). Clamp in visual space, convert back.
    const s = get()
    const mainH = s.mainHeight()
    const leftAmp    = diagAmplification(s.leftDiagStartHeight, mainH, s.height)
    const rightVisual = s.diagonalSide === 'both'
      ? s.rightDiagTopWidth * diagAmplification(s.rightDiagStartHeight, mainH, s.height)
      : null
    const range          = getWidthRange('left', s.width, s.moduleCount, rightVisual)
    const clampedVisual  = clamp(v * leftAmp, range.min, range.max)
    const clamped        = Math.round(clampedVisual / leftAmp)
    const diagParams = {
      diagonalSide: s.diagonalSide,
      leftDiagStartHeight:  Math.min(s.leftDiagStartHeight,  mainH - 20) / 100,
      rightDiagStartHeight: Math.min(s.rightDiagStartHeight, mainH - 20) / 100,
      leftDiagTopWidth:  clamped             / 100,
      rightDiagTopWidth: s.rightDiagTopWidth / 100,
      outerWidth: s.width / 100,
      mainHeight: mainH   / 100,
    }
    set({ leftDiagTopWidth: clamped, modules: resetDiagDoubles(s.modules, diagParams, s.moduleCount, s.width / 100) })
  },

  setRightDiagTopWidth: (v) => {
    // v is internal (reach at mainH, cm). Clamp in visual space, convert back.
    const s = get()
    const mainH = s.mainHeight()
    const rightAmp   = diagAmplification(s.rightDiagStartHeight, mainH, s.height)
    const leftVisual  = s.diagonalSide === 'both'
      ? s.leftDiagTopWidth * diagAmplification(s.leftDiagStartHeight, mainH, s.height)
      : null
    const range          = getWidthRange('right', s.width, s.moduleCount, leftVisual)
    const clampedVisual  = clamp(v * rightAmp, range.min, range.max)
    const clamped        = Math.round(clampedVisual / rightAmp)
    const diagParams = {
      diagonalSide: s.diagonalSide,
      leftDiagStartHeight:  Math.min(s.leftDiagStartHeight,  mainH - 20) / 100,
      rightDiagStartHeight: Math.min(s.rightDiagStartHeight, mainH - 20) / 100,
      leftDiagTopWidth:  s.leftDiagTopWidth / 100,
      rightDiagTopWidth: clamped            / 100,
      outerWidth: s.width / 100,
      mainHeight: mainH   / 100,
    }
    set({ rightDiagTopWidth: clamped, modules: resetDiagDoubles(s.modules, diagParams, s.moduleCount, s.width / 100) })
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

    // Re-clamp diagonal widths against the new closet width (constraint in visual space)
    const s = get()
    if (s.diagonalSide !== 'none') {
      const mainH   = s.mainHeight()
      const hasBoth = s.diagonalSide === 'both'
      const hasLeft  = s.diagonalSide === 'left'  || hasBoth
      const hasRight = s.diagonalSide === 'right' || hasBoth
      const leftAmp  = diagAmplification(s.leftDiagStartHeight,  mainH, s.height)
      const rightAmp = diagAmplification(s.rightDiagStartHeight, mainH, s.height)
      const leftVisual  = s.leftDiagTopWidth  * leftAmp
      const rightVisual = s.rightDiagTopWidth * rightAmp
      const updates: Partial<ClosetState> = {}
      if (hasLeft) {
        const range = getWidthRange('left', clamped, s.moduleCount, hasBoth ? rightVisual : null)
        const c = Math.round(clamp(leftVisual, range.min, range.max) / leftAmp)
        if (c !== s.leftDiagTopWidth) updates.leftDiagTopWidth = c
      }
      if (hasRight) {
        const range = getWidthRange('right', clamped, s.moduleCount, hasBoth ? leftVisual : null)
        const c = Math.round(clamp(rightVisual, range.min, range.max) / rightAmp)
        if (c !== s.rightDiagTopWidth) updates.rightDiagTopWidth = c
      }
      if (Object.keys(updates).length > 0) set(updates)
    }
  },

  setHeight: (height) => {
    const c = get().constraints?.singleCorpus
    const topMax = get().constraints?.topCabinet.maxHeight ?? 110
    const maxH = (c?.maxHeight ?? 275) + topMax
    const minH = c?.minHeight ?? 200
    set({ height: Math.max(minH, Math.min(maxH, height)) })

    // Re-clamp diagonal start heights against the new mainHeight
    const s = get()
    const { min, max: maxSH } = getStartHeightRange(s.mainHeight())
    const updates: Partial<ClosetState> = {}
    if (s.leftDiagStartHeight > maxSH) updates.leftDiagStartHeight = maxSH
    if (s.leftDiagStartHeight < min) updates.leftDiagStartHeight = min
    if (s.rightDiagStartHeight > maxSH) updates.rightDiagStartHeight = maxSH
    if (s.rightDiagStartHeight < min) updates.rightDiagStartHeight = min
    if (Object.keys(updates).length > 0) set(updates)
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
    // Re-clamp diagonal widths since slot width changes with module count (constraint in visual space)
    const s = get()
    if (s.diagonalSide !== 'none') {
      const mainH   = s.mainHeight()
      const hasBoth = s.diagonalSide === 'both'
      const hasLeft  = s.diagonalSide === 'left'  || hasBoth
      const hasRight = s.diagonalSide === 'right' || hasBoth
      const leftAmp  = diagAmplification(s.leftDiagStartHeight,  mainH, s.height)
      const rightAmp = diagAmplification(s.rightDiagStartHeight, mainH, s.height)
      const leftVisual  = s.leftDiagTopWidth  * leftAmp
      const rightVisual = s.rightDiagTopWidth * rightAmp
      const updates: Partial<ClosetState> = {}
      if (hasLeft) {
        const range = getWidthRange('left', s.width, clamped, hasBoth ? rightVisual : null)
        const c = Math.round(clamp(leftVisual, range.min, range.max) / leftAmp)
        if (c !== s.leftDiagTopWidth) updates.leftDiagTopWidth = c
      }
      if (hasRight) {
        const range = getWidthRange('right', s.width, clamped, hasBoth ? leftVisual : null)
        const c = Math.round(clamp(rightVisual, range.min, range.max) / rightAmp)
        if (c !== s.rightDiagTopWidth) updates.rightDiagTopWidth = c
      }
      if (Object.keys(updates).length > 0) set(updates)
    }
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
  restoreConfig: (config: ClosetConfigSnapshot) => {
    // Support both new per-side format and legacy shared diagTopWidth
    const legacyWidth = (config as { diagTopWidth?: number }).diagTopWidth ?? 50
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
      })),
      buitenkantMaterialId: config.buitenkantMaterialId,
      binnenkantMaterialId: config.binnenkantMaterialId,
      doorHandleId: config.doorHandleId,
      diagonalSide: config.diagonalSide as DiagonalSide,
      leftDiagStartHeight: config.leftDiagStartHeight,
      rightDiagStartHeight: config.rightDiagStartHeight,
      leftDiagTopWidth:  config.leftDiagTopWidth  ?? legacyWidth,
      rightDiagTopWidth: config.rightDiagTopWidth ?? legacyWidth,
      step: 1,
      selectedSlot: null,
    })
  },
  randomFill: () => {
    const { moduleCount, modules, width, diagonalSide, leftDiagStartHeight, rightDiagStartHeight, leftDiagTopWidth, rightDiagTopWidth } = get()
    const widthM = width / 100
    const mainHeightM = get().mainHeight() / 100
    const MODULE_FLOOR_Y = 0.118 // ONDERSTEL_HEIGHT (0.108) + ONDERSTEL_GAP (0.010)
    const slotW = (widthM - WALL_M * 2) / moduleCount
    const diagParams = {
      diagonalSide,
      leftDiagStartHeight:  leftDiagStartHeight  / 100,
      rightDiagStartHeight: rightDiagStartHeight / 100,
      leftDiagTopWidth:  leftDiagTopWidth  / 100,
      rightDiagTopWidth: rightDiagTopWidth / 100,
      outerWidth: widthM,
      mainHeight: mainHeightM,
    }

    const getEffectiveHeight = (slotIndex: number, span: 1 | 2 = 1) => {
      const leftX  = WALL_M + slotIndex * slotW
      const rightX = WALL_M + (slotIndex + span) * slotW
      const leftH  = Math.max(0, getDiagHeightAt(leftX,  diagParams) - MODULE_FLOOR_Y - WALL_M)
      const rightH = Math.max(0, getDiagHeightAt(rightX, diagParams) - MODULE_FLOOR_Y - WALL_M)
      return Math.min(leftH, rightH)
    }

    const newModules: ModuleSlot[] = []
    let i = 0
    while (i < moduleCount) {
      const effectiveHeight = getEffectiveHeight(i)
      const isUnderDiag = effectiveHeight < mainHeightM - 0.01

      const canDouble = i + 1 < moduleCount && !isUnderDiag && isFullHeight(WALL_M + i * slotW, WALL_M + (i + 2) * slotW, diagParams)
      const isDouble = canDouble && Math.random() < 0.3
      const span: 1 | 2 = isDouble ? 2 : 1

      const availableLayouts = MODULE_LAYOUTS.filter((l) => l.specialElement.height <= effectiveHeight)
      const layoutId = availableLayouts[Math.floor(Math.random() * availableLayouts.length)]?.id ?? 1
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
