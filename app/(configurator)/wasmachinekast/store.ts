import { create } from 'zustand'
import type { FullPricingData } from '@/types/configurator-pricing'
import type { BaseConfiguratorState, BaseModuleSlot } from '../_shared/store/types'
import type { ClosetConfigSnapshot } from '@/lib/cart/types'
import { WASHER_LAYOUT_IDS } from './moduleLayouts'
import { filterForSection } from './sections/wasmModuleLayoutFilter'
import type { PopoverClickPoint } from '../_shared/components/popoverPlacement'
import { validateHandleMaterial } from '../_shared/components/validateHandleMaterial'
import { maxTotalWidthCm } from '@/lib/configurator/dimensions'
import { DEFAULT_FLOOR_ID, FLOOR_IDS } from '../_shared/materials/floors'
import { FALLBACK_MODULE_MIN_WIDTH_CM } from '../_shared/store/slotWidths'
import { restore as restoreWasmSnapshot } from './sections/wasmSnapshotMigration'
import {
  fillerWidthCm,
  planSectionWidths,
  reconcileSlots,
  type FillerPanel,
  type FillerSide,
} from './sections/sectionPlan'
import type {
  Section,
  WasherPlacement,
  WasmLayout,
  WasmSectionsSnapshot,
  WasmSectionsState,
} from './sections/types'

export type { BaseModuleSlot as ModuleSlot }

export type PlacementType = 'vrijstaand' | 'ingebouwd'
export type SidePanelThickness = '18mm' | '36mm'

export type WasherModule = WasherPlacement

/** Section the top-level width/height/modules fields stand for. */
function topLevelSection(layout: WasmLayout): 'high' | 'low' {
  return layout === 'low-only' ? 'low' : 'high'
}

/** Shallowest cabinet the customer can pick; a washer still fits at 75 cm. */
export const WASM_MIN_DEPTH_CM = 75
const FALLBACK_MODULE_MIN_WIDTH = FALLBACK_MODULE_MIN_WIDTH_CM
const FALLBACK_MODULE_MAX_WIDTH = 65
const TOP_CABINET_THRESHOLD = 275
const SIDE_WALL_EXTRA_CM = 1.5
const LOW_SECTION_HEIGHT_CM = 90
const DEFAULT_HIGH_HEIGHT_CM = 240

const POWER_OUTLET_ACCESSORY_ID = 'power-outlet'

function powerOutletHiddenForLowOnly(
  pricingData: FullPricingData | null,
  layout: WasmLayout,
): boolean {
  if (layout !== 'low-only') return false
  const acc = pricingData?.accessories.find((a) => a.id === POWER_OUTLET_ACCESSORY_ID)
  return acc?.availableForLowSection === false
}

function clearPowerHoles(modules: BaseModuleSlot[]): { modules: BaseModuleSlot[]; cleared: boolean } {
  let cleared = false
  const next = modules.map((m) => {
    if (m.hasPowerHole) {
      cleared = true
      return { ...m, hasPowerHole: false }
    }
    return m
  })
  return { modules: next, cleared }
}

/** Side-panel thickness in cm the customer chose. */
function sideWallCm(s: Pick<WasmState, 'sidePanelThickness'>): number {
  return s.sidePanelThickness === '36mm' ? 3.6 : 1.8
}

/**
 * Total wall thickness a section loses from its outer width. In a dual layout
 * the low section shares the seam panel with the high one, so it has only one
 * panel of its own — mirrors `lowSharedSideWall` in the scene.
 */
function sectionWallsCm(
  s: Pick<WasmState, 'sidePanelThickness' | 'layout'>,
  section: 'high' | 'low',
): number {
  const isDual = s.layout === 'low-left' || s.layout === 'low-right'
  const panels = isDual && section === 'low' ? 1 : 2
  return sideWallCm(s) * panels
}

function sectionOuterWidthCm(s: WasmState, section: 'high' | 'low'): number {
  return section === topLevelSection(s.layout) ? s.width : s.lowSection?.width ?? 0
}

function sectionInnerWidthCm(s: WasmState, section: 'high' | 'low'): number {
  return sectionOuterWidthCm(s, section) - sectionWallsCm(s, section)
}

function variableBounds(s: Pick<WasmState, 'constraints'>) {
  return {
    minVarWidthCm: s.constraints?.singleCorpus.minWidth ?? FALLBACK_MODULE_MIN_WIDTH,
    maxVarWidthCm: s.constraints?.singleCorpus.maxWidth ?? FALLBACK_MODULE_MAX_WIDTH,
  }
}

/** Module count bounds of a section: its fixed slots plus what the rest holds. */
function moduleCountBounds(
  s: WasmState,
  section: 'high' | 'low',
  modules: BaseModuleSlot[] = sectionModules(s, section),
): { min: number; max: number } {
  const fixed = modules.filter((m) => m.fixedWidth).map((m) => m.fixedWidth!)
  const plan = planSectionWidths({
    innerWidthCm: sectionInnerWidthCm(s, section),
    fixedWidthsCm: fixed,
    ...variableBounds(s),
  })
  const min = fixed.length + plan.minVariable
  // At the narrowest widths not even one module reaches its minimum; the
  // section still keeps its one vak, so the range never reads "1–0".
  return { min, max: Math.max(min, fixed.length + plan.maxVariable) }
}

/**
 * Bring one section's slots in line with its width (see `reconcileSlots`) and
 * follow the machine placements and the selection to their new indexes.
 * Returns the module count the section ended up with when it changed.
 */
function reconcileSection(
  get: () => WasmState,
  set: (patch: Partial<WasmState>) => void,
  section: 'high' | 'low',
  { mode = 'strict' }: { mode?: 'strict' | 'lenient' } = {},
): number | null {
  const s = get()
  if (section === 'high' && s.layout === 'low-only') return null
  if (section === 'low' && s.lowSection === null && s.layout !== 'low-only') return null
  const modules = sectionModules(s, section)
  const result = reconcileSlots({
    modules,
    innerWidthCm: sectionInnerWidthCm(s, section),
    ...variableBounds(s),
    mode,
  })
  if (result.modules === modules) return null

  const washerModules = s.washerModules.flatMap((w) => {
    if (w.section !== section) return [w]
    const next = result.indexMap.get(w.slotIndex)
    return next === undefined ? [] : [{ ...w, slotIndex: next }]
  })
  const isTopLevel = section === topLevelSection(s.layout)
  const selectedSlot =
    s.selectedSlot !== null && s.activeModulesSection === section
      ? result.indexMap.get(s.selectedSlot) ?? null
      : s.selectedSlot
  set({
    washerModules,
    selectedSlot,
    ...(isTopLevel
      ? { modules: result.modules, moduleCount: result.modules.length }
      : s.lowSection
        ? { lowSection: { ...s.lowSection, modules: result.modules, moduleCount: result.modules.length } }
        : {}),
  })
  return result.modules.length
}

/**
 * Resolve where a washer would land and which slots survive, or null when it
 * cannot be placed. The washer's own slot turns fixed-width; the variable slots
 * that no longer fit beside it are dropped, last one first, and what is left
 * over below a module's minimum width becomes the afwerkpaneel.
 */
function washerFitPlan(
  s: WasmState,
  slotIndex: number,
  layoutId: number,
  section: 'high' | 'low',
): {
  modules: BaseModuleSlot[]
  /** Old slot index → new one for every slot that survives the placement. */
  indexMap: Map<number, number>
  slotIndex: number
  currentModuleCount: number
  targetIsTopLevel: boolean
} | null {
  if (section === 'high' && s.layout === 'low-only') return null
  if (section === 'low' && s.lowSection === null && s.layout !== 'low-only') return null
  const targetIsTopLevel = section === topLevelSection(s.layout)
  const current = sectionModules(s, section)
  if (slotIndex < 0 || slotIndex >= current.length) return null

  const candidateWidth = s.moduleLayouts.find((l) => l.layoutId === layoutId)?.minSlotWidth
  const withCandidate = current.map((m) =>
    m.slotIndex === slotIndex ? { ...m, fixedWidth: candidateWidth } : m,
  )
  const result = reconcileSlots({
    modules: withCandidate,
    innerWidthCm: sectionInnerWidthCm(s, section),
    ...variableBounds(s),
  })
  // Placing this washer may never cost a machine — this one or another.
  if (result.droppedFixed.length > 0) return null
  const landed = result.indexMap.get(slotIndex)
  if (landed === undefined) return null
  return {
    modules: result.modules === withCandidate ? current : result.modules,
    indexMap: result.indexMap,
    slotIndex: landed,
    currentModuleCount: current.length,
    targetIsTopLevel,
  }
}

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

/**
 * LED strips light the high cabinet, so a low-only layout cannot carry them.
 * Returns the patch that switches them off, or null when nothing changes.
 */
function clearLightStripsForLowOnly(
  s: Pick<WasmState, 'layout' | 'lightStripsEnabled'>,
): { lightStripsEnabled: false; lowOnlyAccessoryNotice: true } | null {
  if (s.layout !== 'low-only' || !s.lightStripsEnabled) return null
  return { lightStripsEnabled: false, lowOnlyAccessoryNotice: true }
}

/** Sections the current layout actually has, in cabinet order. */
function sectionsPresent(s: WasmState): ('high' | 'low')[] {
  const out: ('high' | 'low')[] = []
  if (s.layout !== 'low-only') out.push('high')
  if (s.layout === 'low-only' || s.lowSection !== null) out.push('low')
  return out
}

function sectionModules(s: WasmState, section: 'high' | 'low'): BaseModuleSlot[] {
  return section === topLevelSection(s.layout) ? s.modules : s.lowSection?.modules ?? []
}

function pickRandom<T>(items: T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)]
}

/** Most washer modules randomFill puts in a cabinet. */
const RANDOM_WASHER_MAX = 2

/**
 * Drop up to `target` washers into random free slots of one section.
 *
 * Reads the store fresh every round: a washer is fixed-width, so placing one
 * can shrink the section (addWasherModule drops trailing modules), which
 * changes both the slot count and which slots are still free. Slots that fail
 * `canPlaceWasher` are remembered so the loop cannot spin on them. Slots
 * covered by a dubbele module are skipped — a washer there would collapse it.
 *
 * Returns how many landed.
 */
function placeRandomWashers(
  get: () => WasmState,
  section: 'high' | 'low',
  target: number,
): number {
  const pool = filterForSection(
    get().moduleLayouts.filter((l) => WASHER_LAYOUT_IDS.has(l.layoutId)),
    section,
  )
  if (pool.length === 0) return 0

  const tried = new Set<number>()
  let placed = 0
  while (placed < target) {
    const s = get()
    const taken = new Set(
      s.washerModules.filter((w) => w.section === section).map((w) => w.slotIndex),
    )
    const slotsHere = sectionModules(s, section)
    const free = slotsHere
      .map((_, i) => i)
      // A dubbele module the customer set stays: neither its own slot nor the
      // one it covers takes a washer, which would collapse it.
      .filter(
        (i) =>
          !tried.has(i) &&
          !taken.has(i) &&
          slotsHere[i].span !== 2 &&
          !isCoveredSlot(slotsHere, i),
      )
    if (free.length === 0) break

    const slot = free[Math.floor(Math.random() * free.length)]
    tried.add(slot)
    const layoutId = pickRandom(pool)!.layoutId
    if (!s.canPlaceWasher(slot, layoutId, section)) continue
    get().addWasherModule(slot, layoutId, section)
    placed += 1
  }
  return placed
}

/** A dubbele module is refused on a fixed-width slot (the wasmachine modules). */
function isFixedWidthSlot(
  modules: BaseModuleSlot[],
  slotIndex: number,
  span: 1 | 2,
): boolean {
  return span === 2 && modules[slotIndex]?.fixedWidth !== undefined
}

/**
 * Apply a layout to one slot, keeping the two span invariants:
 *
 * - a fixed-width layout (the wasmachine modules, 68.6 cm) can never be a
 *   dubbele module — its width is the machine's, not the slot's, so it drops
 *   back to a single slot and frees the vak it covered;
 * - the slot before it gives up its span, because this vak is now in use.
 */
function applyLayoutToSlot(
  modules: BaseModuleSlot[],
  slotIndex: number,
  layoutId: number,
  fixedWidth: number | undefined,
): BaseModuleSlot[] {
  const wasDouble = modules[slotIndex]?.span === 2
  const collapse = wasDouble && fixedWidth !== undefined
  return modules.map((m) => {
    if (m.slotIndex === slotIndex) {
      return { ...m, layoutId, fixedWidth, span: (collapse ? 1 : m.span) as 1 | 2 }
    }
    if (m.slotIndex === slotIndex - 1 && m.span === 2) return { ...m, span: 1 as const }
    return m
  })
}

/** True when the slot before this one spans two, so this slot is covered. */
function isCoveredSlot(modules: BaseModuleSlot[], index: number): boolean {
  return index > 0 && modules[index - 1].span === 2
}

/**
 * Random non-washer layout for every slot of a section; washer slots kept.
 *
 * A slot covered by a dubbele module keeps its empty layout — the same
 * invariant `setModuleSpan` and `setModuleLayout` hold. Filling it would draw a
 * second module inside the double one.
 */
function fillSectionModules(s: WasmState, section: 'high' | 'low'): BaseModuleSlot[] {
  const washerSlots = new Set(
    s.washerModules.filter((w) => w.section === section).map((w) => w.slotIndex),
  )
  const pool = filterForSection(
    s.moduleLayouts.filter((l) => !WASHER_LAYOUT_IDS.has(l.layoutId)),
    section,
  )
  const modules = sectionModules(s, section)
  return modules.map((m, i) => {
    if (isCoveredSlot(modules, i)) {
      return { ...m, slotIndex: i, layoutId: null, span: 1 as const, fixedWidth: undefined }
    }
    if (washerSlots.has(i)) return { ...m, slotIndex: i }
    return { ...m, slotIndex: i, layoutId: pickRandom(pool)?.layoutId ?? null }
  })
}

interface WasmState extends BaseConfiguratorState {
  placementType: PlacementType
  setPlacementType: (type: PlacementType) => void
  sidePanelThickness: SidePanelThickness
  setSidePanelThickness: (v: SidePanelThickness) => void
  // Placed washers, each in its own section — high and low may both hold some.
  // `section` defaults to the one the top-level fields stand for.
  washerModules: WasherModule[]
  addWasherModule: (slotIndex: number, layoutId: number, section?: 'high' | 'low') => void
  removeWasherModule: (slotIndex: number, section?: 'high' | 'low') => void
  clearWasherModules: () => void
  lastClickPoint: PopoverClickPoint
  setSelectedSlot: (
    slot: number | null,
    clickPoint?: PopoverClickPoint,
    section?: 'high' | 'low',
  ) => void

  // Sections. Top-level width/height/moduleCount/modules hold the HIGH section's
  // data in any layout that has high (high-only / low-left / low-right). In
  // low-only the top-level holds the LOW section. `lowSection` holds the LOW
  // section's data when the layout includes one.
  layout: WasmLayout
  lowSection: Section | null
  // Returns true iff a washer of `layoutId` can go in `slotIndex` of `section` —
  // either straight away, or after dropping trailing modules so the remaining
  // non-washer slots keep their minimum width. addWasherModule performs that drop.
  canPlaceWasher: (slotIndex: number, layoutId: number, section?: 'high' | 'low') => boolean

  // Module count the last washer placement shrank the section to, so the step
  // can say so once. Null when the placement changed nothing.
  washerModuleCountNotice: number | null
  dismissWasherModuleCountNotice: () => void
  // Which side of a section its afwerkpaneel sits on, should it need one. The
  // panel itself is derived: it exists when the section holds nothing but
  // machines and the rest is too narrow for a module.
  fillerPanelSide: Record<'high' | 'low', FillerSide>
  setFillerPanelSide: (section: 'high' | 'low', side: FillerSide) => void
  fillerPanel: (section: 'high' | 'low') => FillerPanel | null
  /** Module count bounds of one section — the top-level min/maxModules for high. */
  minModulesFor: (section: 'high' | 'low') => number
  maxModulesFor: (section: 'high' | 'low') => number
  topPanelThicknessMm: 18 | 36
  countertopMaterialId: string | undefined
  activeModulesSection: 'high' | 'low'
  setActiveModulesSection: (section: 'high' | 'low') => void
  hoveredSection: 'high' | 'low' | null
  setHoveredSection: (section: 'high' | 'low' | null) => void
  highSection: () => Section | null
  setLowTopPanelThicknessMm: (t: 18 | 36) => void
  setLowCountertopMaterialId: (id: string) => void
  applySectionsState: (next: WasmSectionsState) => void

  // Set when entering low-only forces the socket reset because Sanity marks
  // power-outlet as not available for the low section. AccessoiresStep clears
  // it after showing a one-time notice.
  lowOnlyAccessoryNotice: boolean
  dismissLowOnlyAccessoryNotice: () => void

  // Dual-layout: low-section field setters (top-level holds high in dual).
  setLowSectionWidth: (cm: number) => void
  setLowSectionModuleCount: (count: number) => void
  setLowSectionModuleLayout: (slotIndex: number, layoutId: number) => void
  setLowSectionModuleSpan: (slotIndex: number, span: 1 | 2) => void
  toggleLowSectionModuleDoor: (slotIndex: number) => void
  toggleLowSectionModulePushToOpen: (slotIndex: number) => void
  /** Per-module push-to-open: the module keeps its front but drops the handle. */
  toggleModulePushToOpen: (slotIndex: number) => void
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

  sidePanelThickness: '18mm' as SidePanelThickness,
  // Thicker panels eat into the interior, so the sections may have to shed or
  // gain a vak.
  setSidePanelThickness: (sidePanelThickness) => {
    set({ sidePanelThickness })
    for (const section of sectionsPresent(get())) reconcileSection(get, set, section)
  },

  washerModules: [],

  width: 120,
  height: 240,
  depth: 85,

  layout: 'high-only' as WasmLayout,
  lowSection: null,
  topPanelThicknessMm: 18 as 18 | 36,
  countertopMaterialId: undefined as string | undefined,
  lowOnlyAccessoryNotice: false,
  dismissLowOnlyAccessoryNotice: () => set({ lowOnlyAccessoryNotice: false }),
  hoveredSection: null as 'high' | 'low' | null,
  setHoveredSection: (section) => set({ hoveredSection: section }),
  // Section the module editing UI is bound to. No longer a mode the customer
  // sets: selecting a slot moves it, so both sections stay clickable.
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
    // A mirror swap only moves the sections around, so every placement survives;
    // otherwise a washer goes only if its own section is gone.
    const survivesLayout = (w: WasherModule) =>
      isMirrorSwap ||
      (w.section === 'high' ? next.highSection !== null : next.lowSection !== null)
    const nextWashers = s.washerModules.filter(survivesLayout)
    if (!topLevel) {
      set({ layout: next.layout, lowSection: next.lowSection, washerModules: nextWashers })
      return
    }
    const lowSec = next.lowSection
    set({
      layout: next.layout,
      lowSection: lowSec,
      width: topLevel.width,
      height: topLevel.height,
      moduleCount: topLevel.moduleCount,
      modules: topLevel.modules,
      topPanelThicknessMm: lowSec?.topPanelThicknessMm ?? s.topPanelThicknessMm,
      countertopMaterialId: lowSec?.countertopMaterialId ?? s.countertopMaterialId,
      washerModules: nextWashers,
      activeModulesSection: next.layout === 'low-only' ? 'low' : 'high',
      selectedSlot: null,
      lastClickPoint: null,
    })
    for (const section of sectionsPresent(get())) reconcileSection(get, set, section)
    const post = get()
    const stripPatch = clearLightStripsForLowOnly(post)
    if (stripPatch) set(stripPatch)
    if (powerOutletHiddenForLowOnly(post.pricingData, post.layout)) {
      const top = clearPowerHoles(post.modules)
      const low = post.lowSection
        ? clearPowerHoles(post.lowSection.modules)
        : { modules: [], cleared: false }
      if (top.cleared || low.cleared) {
        set({
          modules: top.modules,
          lowSection: post.lowSection
            ? { ...post.lowSection, modules: low.modules }
            : post.lowSection,
          lowOnlyAccessoryNotice: true,
        })
      }
    }
  },

  setLowSectionWidth: (cm) => {
    const s = get()
    if (!s.lowSection) return
    const minW = s.constraints?.singleCorpus.minWidth ?? FALLBACK_MODULE_MIN_WIDTH
    const maxTotal = maxTotalWidthCm(s.constraints)
    const width = Math.max(minW, Math.min(maxTotal, cm))
    set({ lowSection: { ...s.lowSection, width } })
    reconcileSection(get, set, 'low')
  },
  setLowSectionModuleCount: (count) => {
    const s = get()
    if (!s.lowSection) return
    const { min: minMods, max: maxMods } = moduleCountBounds(s, 'low')
    const clamped = Math.max(minMods, Math.min(maxMods, count))
    const modules = resizeModules(s.lowSection.modules, clamped)
    set({ lowSection: { ...s.lowSection, moduleCount: clamped, modules } })
    // Only low-section washers can fall outside the low section's new count.
    const outOfBounds = s.washerModules.filter(
      (w) => w.section === 'low' && w.slotIndex >= clamped,
    )
    if (outOfBounds.length > 0) {
      set({
        washerModules: s.washerModules.filter(
          (w) => w.section !== 'low' || w.slotIndex < clamped,
        ),
      })
    }
  },
  setLowSectionModuleLayout: (slotIndex, layoutId) => {
    const s = get()
    if (!s.lowSection) return
    const layout = s.moduleLayouts.find((l) => l.layoutId === layoutId)
    set({
      lowSection: {
        ...s.lowSection,
        modules: applyLayoutToSlot(
          s.lowSection.modules,
          slotIndex,
          layoutId,
          layout?.minSlotWidth,
        ),
      },
    })
  },
  setLowSectionModuleSpan: (slotIndex, span) => {
    const s = get()
    if (!s.lowSection) return
    if (isFixedWidthSlot(s.lowSection.modules, slotIndex, span)) return
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
  toggleLowSectionModulePushToOpen: (slotIndex) => {
    const s = get()
    if (!s.lowSection) return
    set({
      lowSection: {
        ...s.lowSection,
        modules: s.lowSection.modules.map((m) =>
          m.slotIndex === slotIndex ? { ...m, pushToOpen: !m.pushToOpen } : m,
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

  buitenkantMaterialId: 'h3158-vicenza-eik-grijs',
  binnenkantMaterialId: 'zwart',
  doorHandleId: '23',
  // Drawer fronts (lage kast) have their own handle choice and start
  // greeploos; the wizard can add a handle separately from the doors.
  doorHandleMaterial: 'chrome' as const,
  doorsExtendToFloor: false,
  lightStripsEnabled: false,
  doorsOpen: true,
  showMeasurements: false,
  userZoom: 0.5,
  floorId: DEFAULT_FLOOR_ID,
  selectedSlot: null,
  hoveredSlot: null,
  lastClickPoint: null,

  moduleWidthCm: () => {
    const { width, moduleCount } = get()
    return moduleCount > 0 ? width / moduleCount : width
  },

  // Bounds of the top-level section: its machines plus what the rest holds.
  minModules: () => moduleCountBounds(get(), topLevelSection(get().layout)).min,
  maxModules: () => moduleCountBounds(get(), topLevelSection(get().layout)).max,

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
    const post = get()
    const stripPatch = clearLightStripsForLowOnly(post)
    if (stripPatch) set(stripPatch)
    if (powerOutletHiddenForLowOnly(post.pricingData, post.layout)) {
      const top = clearPowerHoles(post.modules)
      const low = post.lowSection
        ? clearPowerHoles(post.lowSection.modules)
        : { modules: [], cleared: false }
      if (top.cleared || low.cleared) {
        set({
          modules: top.modules,
          lowSection: post.lowSection
            ? { ...post.lowSection, modules: low.modules }
            : post.lowSection,
          lowOnlyAccessoryNotice: true,
        })
      }
    }
  },

  canPlaceWasher: (slotIndex, layoutId, section) =>
    washerFitPlan(get(), slotIndex, layoutId, section ?? topLevelSection(get().layout)) !== null,

  washerModuleCountNotice: null,
  dismissWasherModuleCountNotice: () => set({ washerModuleCountNotice: null }),

  fillerPanelSide: { high: 'right', low: 'right' } as Record<'high' | 'low', FillerSide>,
  setFillerPanelSide: (section, side) =>
    set((s) => ({ fillerPanelSide: { ...s.fillerPanelSide, [section]: side } })),
  fillerPanel: (section) => {
    const s = get()
    if (section === 'high' && s.layout === 'low-only') return null
    if (section === 'low' && s.lowSection === null && s.layout !== 'low-only') return null
    const widthCm = fillerWidthCm(sectionModules(s, section), sectionInnerWidthCm(s, section))
    return widthCm > 0 ? { side: s.fillerPanelSide[section], widthCm } : null
  },
  minModulesFor: (section) => moduleCountBounds(get(), section).min,
  maxModulesFor: (section) => moduleCountBounds(get(), section).max,

  addWasherModule: (slotIndex, layoutId, section) => {
    const target = section ?? topLevelSection(get().layout)
    const plan = washerFitPlan(get(), slotIndex, layoutId, target)
    if (!plan) return
    // Two fixed-width washers can squeeze the remaining slots below their
    // minimum; those slots go first so the placement fits. Existing washers
    // and the selection follow their slots to the new indexes.
    if (plan.modules.length !== plan.currentModuleCount) {
      const s = get()
      const washerModules = s.washerModules.flatMap((w) => {
        if (w.section !== target) return [w]
        const next = plan.indexMap.get(w.slotIndex)
        return next === undefined ? [] : [{ ...w, slotIndex: next }]
      })
      set({
        washerModules,
        washerModuleCountNotice: plan.modules.length,
        selectedSlot:
          s.selectedSlot !== null && s.activeModulesSection === target
            ? plan.indexMap.get(s.selectedSlot) ?? null
            : s.selectedSlot,
        ...(plan.targetIsTopLevel
          ? { modules: plan.modules, moduleCount: plan.modules.length }
          : s.lowSection
            ? { lowSection: { ...s.lowSection, modules: plan.modules, moduleCount: plan.modules.length } }
            : {}),
      })
    }
    const landed = plan.slotIndex
    const s = get()
    set({
      washerModules: [
        ...s.washerModules.filter(
          (w) => w.section !== target || w.slotIndex !== landed,
        ),
        { slotIndex: landed, layoutId, section: target },
      ],
    })
    if (plan.targetIsTopLevel) {
      get().setModuleLayout(landed, layoutId)
    } else {
      get().setLowSectionModuleLayout(landed, layoutId)
    }
  },

  removeWasherModule: (slotIndex, section) => {
    const s = get()
    const target = section ?? topLevelSection(s.layout)
    const clearSlot = (m: BaseModuleSlot) =>
      m.slotIndex === slotIndex ? { ...m, layoutId: null, fixedWidth: undefined } : m
    set({
      washerModules: s.washerModules.filter(
        (w) => w.section !== target || w.slotIndex !== slotIndex,
      ),
    })
    if (target === topLevelSection(s.layout)) {
      set({ modules: s.modules.map(clearSlot) })
    } else if (s.lowSection) {
      set({ lowSection: { ...s.lowSection, modules: s.lowSection.modules.map(clearSlot) } })
    }
  },

  clearWasherModules: () => {
    const s = get()
    const topLevel = topLevelSection(s.layout)
    const slotsIn = (section: 'high' | 'low') =>
      new Set(s.washerModules.filter((w) => w.section === section).map((w) => w.slotIndex))
    const clearSlots = (modules: BaseModuleSlot[], slots: Set<number>) =>
      modules.map((m) =>
        slots.has(m.slotIndex) ? { ...m, layoutId: null, fixedWidth: undefined } : m,
      )
    const lowIsTopLevel = topLevel === 'low'
    set({
      washerModules: [],
      modules: clearSlots(s.modules, slotsIn(topLevel)),
      lowSection:
        !lowIsTopLevel && s.lowSection
          ? { ...s.lowSection, modules: clearSlots(s.lowSection.modules, slotsIn('low')) }
          : s.lowSection,
    })
  },

  setStep: (step) => set({ step, selectedSlot: null, lastClickPoint: null }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 6), selectedSlot: null, lastClickPoint: null })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1), selectedSlot: null, lastClickPoint: null })),

  setWidth: (width) => {
    const minW = get().constraints?.singleCorpus.minWidth ?? FALLBACK_MODULE_MIN_WIDTH
    const maxTotal = maxTotalWidthCm(get().constraints)
    const clamped = Math.max(minW, Math.min(maxTotal, width))
    set({ width: clamped })
    reconcileSection(get, set, topLevelSection(get().layout))
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
    const minDepth = Math.max(WASM_MIN_DEPTH_CM, c?.minDepth ?? WASM_MIN_DEPTH_CM)
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

    // The top-level fields hold one section; only its washers can fall outside.
    const section = topLevelSection(get().layout)
    const outOfBounds = get().washerModules.filter(
      (w) => w.section === section && w.slotIndex >= clamped,
    )
    outOfBounds.forEach((w) => get().removeWasherModule(w.slotIndex, section))
  },

  setModuleLayout: (slotIndex: number, layoutId: number) => {
    const layout = get().moduleLayouts.find((l) => l.layoutId === layoutId)
    set((s) => ({
      modules: applyLayoutToSlot(s.modules, slotIndex, layoutId, layout?.minSlotWidth),
    }))
  },

  setModuleSpan: (slotIndex: number, span: 1 | 2) => {
    const s = get()
    // A fixed-width module carries the machine's width, not the slot's — it can
    // never span two vakken.
    if (isFixedWidthSlot(s.modules, slotIndex, span)) return
    set({
      modules: s.modules.map((m) => {
        if (m.slotIndex === slotIndex) return { ...m, span }
        if (span === 2 && m.slotIndex === slotIndex + 1) return { ...m, layoutId: null, span: 1 as const, fixedWidth: undefined }
        if (span === 2 && m.slotIndex === slotIndex - 1 && m.span === 2) return { ...m, span: 1 as const }
        return m
      }),
    })
  },

  toggleModuleDoor: (slotIndex) =>
    set((s) => ({
      modules: s.modules.map((m) => (m.slotIndex === slotIndex ? { ...m, hasDoor: !m.hasDoor } : m)),
    })),

  toggleModulePushToOpen: (slotIndex) =>
    set((s) => ({
      modules: s.modules.map((m) =>
        m.slotIndex === slotIndex ? { ...m, pushToOpen: !m.pushToOpen } : m,
      ),
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
  setFloorId: (floorId) => set({ floorId: FLOOR_IDS.includes(floorId) ? floorId : DEFAULT_FLOOR_ID }),
  zoomIn: () => set((s) => ({ userZoom: Math.max(0, s.userZoom - 0.1) })),
  zoomOut: () => set((s) => ({ userZoom: Math.min(1, s.userZoom + 0.1) })),
  // A slot index alone is ambiguous in a dual layout — high vak 2 and low vak 2
  // share it. Callers that know which section was clicked pass it along, and the
  // selection moves the editing section with it, so every module in the scene
  // can be selected directly instead of switching sections first.
  setSelectedSlot: (slot, clickPoint, section) => {
    const s = get()
    const sectionExists =
      section === undefined
        ? false
        : section === 'high'
          ? s.layout !== 'low-only'
          : s.lowSection !== null || s.layout === 'low-only'
    set({
      selectedSlot: slot,
      lastClickPoint: slot === null ? null : (clickPoint ?? null),
      ...(section !== undefined && sectionExists ? { activeModulesSection: section } : {}),
    })
  },
  setHoveredSlot: (slot) => set({ hoveredSlot: slot }),

  randomFill: () => {
    // Washers go in first: one is fixed-width and may force the section to drop
    // trailing modules, so the slots left to fill are only known afterwards.
    get().clearWasherModules()

    const sections = sectionsPresent(get())
    // Washers stay in a single section — a cabinet never shows them in both.
    // The other section is only tried when the first one has no room at all.
    const order = Math.random() < 0.5 ? sections : [...sections].reverse()
    const target = 1 + Math.floor(Math.random() * RANDOM_WASHER_MAX)
    for (const section of order) {
      if (placeRandomWashers(get, section, target) > 0) break
    }

    const s = get()
    const patch: { modules?: BaseModuleSlot[]; lowSection?: Section } = {}
    for (const section of sectionsPresent(s)) {
      const filled = fillSectionModules(s, section)
      if (filled.length === 0) continue
      if (section === topLevelSection(s.layout)) patch.modules = filled
      else if (s.lowSection) patch.lowSection = { ...s.lowSection, modules: filled }
    }
    set(patch)
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
    // Each placement is bounded by its own section's module count.
    const sectionFor = (section: 'high' | 'low'): Section | null =>
      section === topLevelSection(migrated.layout) ? active : migrated.lowSection
    const washerModules = migrated.washerModules.filter(
      (w) => w.slotIndex < (sectionFor(w.section)?.moduleCount ?? 0),
    )
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
      topPanelThicknessMm: migrated.lowSection?.topPanelThicknessMm ?? 18,
      countertopMaterialId:
        migrated.lowSection?.countertopMaterialId ?? config.buitenkantMaterialId,
      buitenkantMaterialId: config.buitenkantMaterialId,
      binnenkantMaterialId: config.binnenkantMaterialId,
      doorHandleId: config.doorHandleId,
      doorHandleMaterial: config.doorHandleMaterial ?? 'chrome',
      doorsExtendToFloor: config.doorsExtendToFloor ?? false,
      lightStripsEnabled: config.lightStripsEnabled,
      sidePanelThickness: config.sidePanelThickness ?? '18mm',
      placementType: (config.placementType ?? 'ingebouwd') as PlacementType,
      washerModules,
      fillerPanelSide: {
        high: config.fillerPanel?.side ?? 'right',
        low: (migrated.layout === 'low-only' ? config.fillerPanel?.side : config.lowSection?.fillerPanel?.side) ?? 'right',
      },
      activeModulesSection: migrated.layout === 'low-only' ? 'low' : 'high',
      lowOnlyAccessoryNotice: false,
      step: 1,
      selectedSlot: null,
      lastClickPoint: null,
    })
    // A saved cabinet keeps its vakken; only what no longer fits is corrected.
    for (const section of sectionsPresent(get())) {
      reconcileSection(get, set, section, { mode: 'lenient' })
    }
    const post = get()
    const stripPatch = clearLightStripsForLowOnly(post)
    if (stripPatch) set(stripPatch)
    if (powerOutletHiddenForLowOnly(post.pricingData, post.layout)) {
      const top = clearPowerHoles(post.modules)
      const low = post.lowSection
        ? clearPowerHoles(post.lowSection.modules)
        : { modules: [], cleared: false }
      if (top.cleared || low.cleared) {
        set({
          modules: top.modules,
          lowSection: post.lowSection
            ? { ...post.lowSection, modules: low.modules }
            : post.lowSection,
          lowOnlyAccessoryNotice: true,
        })
      }
    }
  },
}))

export { LOW_SECTION_HEIGHT_CM, DEFAULT_HIGH_HEIGHT_CM }
