import type { BaseModuleSlot } from '../../_shared/store/types'

/**
 * How a section's inner width is divided between the fixed-width slots (the
 * machine modules), the variable slots and — when what is left is too narrow
 * for a module — an afwerkpaneel that closes the rest off flush with the doors.
 *
 * Pure: the store enforces these rules, the scene, the pricing and the order
 * documents only read the outcome.
 */

export type FillerSide = 'left' | 'right' | 'both'

export interface FillerPanel {
  /** Resolved side: 'both' only when each half is at least the minimum width. */
  side: FillerSide
  /** Total panel width; with 'both' it is split in two equal halves. */
  widthCm: number
}

/** One physical panel: 'both' resolves into two of these. */
export interface FillerPiece {
  side: 'left' | 'right'
  widthCm: number
}

/**
 * Narrowest afwerkpaneel worth producing. A rest below this is not a panel:
 * it disappears into the two side panels, half on each side. Owner-configurable
 * in the pricing config; this is the fallback.
 */
export const DEFAULT_MIN_FILLER_CM = 3

/** Below this the rest is rounding noise, not a panel. */
const EPS = 1e-6

export interface SectionWidthPlan {
  /** Inner width minus every fixed slot. Negative when the machines overflow. */
  freeCm: number
  /** False when the fixed slots alone are wider than the section. */
  fits: boolean
  /** Fewest variable slots the free width may be divided into; 0 = panel. */
  minVariable: number
  /** Most variable slots the free width holds at their minimum width. */
  maxVariable: number
  /** Width of the afwerkpaneel, 0 when a module fits in the free width. */
  fillerWidthCm: number
  /** Rest too narrow for a panel; absorbed into the side panels instead. */
  absorbedRestCm: number
}

export function planSectionWidths({
  innerWidthCm,
  fixedWidthsCm,
  minVarWidthCm,
  maxVarWidthCm,
  minFillerCm = 0,
}: {
  innerWidthCm: number
  fixedWidthsCm: number[]
  minVarWidthCm: number
  maxVarWidthCm: number
  /** Rest below this becomes side-panel thickness rather than a panel. */
  minFillerCm?: number
}): SectionWidthPlan {
  const totalFixed = fixedWidthsCm.reduce((sum, w) => sum + w, 0)
  const freeCm = innerWidthCm - totalFixed
  const fits = freeCm >= -EPS
  if (!fits) {
    return { freeCm, fits, minVariable: 0, maxVariable: 0, fillerWidthCm: 0, absorbedRestCm: 0 }
  }
  const maxVariable = Math.floor((freeCm + EPS) / minVarWidthCm)
  // A section without machines always keeps at least one vak — an empty
  // cabinet is nothing but a panel.
  const minVariable =
    maxVariable === 0
      ? fixedWidthsCm.length === 0
        ? 1
        : 0
      : Math.max(1, Math.ceil((freeCm - EPS) / maxVarWidthCm))
  const rest = maxVariable === 0 && fixedWidthsCm.length > 0 && freeCm > EPS ? freeCm : 0
  const isPanel = rest >= minFillerCm - EPS
  return {
    freeCm,
    fits,
    minVariable,
    maxVariable,
    fillerWidthCm: isPanel ? rest : 0,
    absorbedRestCm: isPanel ? 0 : rest,
  }
}

/**
 * The rest a section is left with when it holds nothing but fixed slots: the
 * store only ever leaves a section like that when the rest was too narrow for
 * a module. Zero when a variable slot is present.
 */
function fixedOnlyRestCm(
  modules: Array<{ fixedWidth?: number }>,
  innerWidthCm: number,
): number {
  if (modules.length === 0) return 0
  if (modules.some((m) => !m.fixedWidth)) return 0
  const totalFixed = modules.reduce((sum, m) => sum + (m.fixedWidth ?? 0), 0)
  const free = innerWidthCm - totalFixed
  return free > EPS ? free : 0
}

/**
 * Width of the afwerkpaneel a section shows, from its slots alone. A rest
 * narrower than `minFillerCm` is no panel (see `absorbedRestCm`).
 */
export function fillerWidthCm(
  modules: Array<{ fixedWidth?: number }>,
  innerWidthCm: number,
  minFillerCm = 0,
): number {
  const rest = fixedOnlyRestCm(modules, innerWidthCm)
  return rest >= minFillerCm - EPS ? rest : 0
}

/**
 * The rest that is too narrow for a panel and goes into the side panels
 * instead — half on each side, so the cabinet still fills its width exactly.
 */
export function absorbedRestCm(
  modules: Array<{ fixedWidth?: number }>,
  innerWidthCm: number,
  minFillerCm = 0,
): number {
  const rest = fixedOnlyRestCm(modules, innerWidthCm)
  return rest > 0 && rest < minFillerCm - EPS ? rest : 0
}

/** 'Beide zijden' is only offered when each half is a real panel. */
export function canSplitFiller(widthCm: number, minFillerCm: number): boolean {
  return widthCm / 2 >= minFillerCm - EPS
}

/** The side that applies: a 'both' that no longer splits falls back to the right. */
export function resolveFillerSide(side: FillerSide, widthCm: number, minFillerCm: number): FillerSide {
  return side === 'both' && !canSplitFiller(widthCm, minFillerCm) ? 'right' : side
}

/** The physical panels of a section: none, one, or two halves. */
export function fillerPieces(panel: FillerPanel | null | undefined): FillerPiece[] {
  if (!panel || panel.widthCm <= 0) return []
  if (panel.side === 'both') {
    const half = panel.widthCm / 2
    return [
      { side: 'left', widthCm: half },
      { side: 'right', widthCm: half },
    ]
  }
  return [{ side: panel.side, widthCm: panel.widthCm }]
}

/**
 * Interior a section loses on each side, in cm: the panel piece(s) plus half
 * the absorbed rest per side. The scene, the measurements and the drawings all
 * start the modules after this.
 */
export function fillerInsetsCm(
  panel: FillerPanel | null | undefined,
  absorbedCm = 0,
): { left: number; right: number } {
  const half = absorbedCm > 0 ? absorbedCm / 2 : 0
  let left = half
  let right = half
  for (const piece of fillerPieces(panel)) {
    if (piece.side === 'left') left += piece.widthCm
    else right += piece.widthCm
  }
  return { left, right }
}

export interface ReconcileResult {
  /** The same array when nothing had to change. */
  modules: BaseModuleSlot[]
  /** Old slot index → new slot index for every slot that survived. */
  indexMap: Map<number, number>
  /** Old indexes of fixed slots that were dropped because they overflowed. */
  droppedFixed: number[]
}

function emptySlot(i: number): BaseModuleSlot {
  return { slotIndex: i, layoutId: null, hasDoor: true, span: 1, hasPowerHole: false }
}

/**
 * Bring a section's slots in line with its inner width:
 *
 * - machines that no longer fit go, last one first;
 * - variable slots beyond what the free width holds go, last one first, so a
 *   machine behind them shifts left instead of falling off the end;
 * - a free width that grew wide enough for a module gets empty slots appended.
 *
 * Slot indexes are compacted afterwards; `indexMap` lets the caller follow the
 * machine placements and the selection to their new positions.
 */
export function reconcileSlots({
  modules,
  innerWidthCm,
  minVarWidthCm,
  maxVarWidthCm,
  mode = 'strict',
}: {
  modules: BaseModuleSlot[]
  innerWidthCm: number
  minVarWidthCm: number
  maxVarWidthCm: number
  /**
   * `strict` holds the variable count inside its bounds, appending or dropping
   * vakken as the width asks. `lenient` is for restoring a saved cabinet: what
   * the customer saved stays as it was — possibly under older width limits —
   * and only what physically cannot be built is corrected: machines that
   * overflow, and variable vakken squeezed below a module's minimum.
   */
  mode?: 'strict' | 'lenient'
}): ReconcileResult {
  let kept = modules.map((m, i) => ({ m, oldIndex: i }))
  const droppedFixed: number[] = []

  const fixedWidths = () => kept.filter((k) => k.m.fixedWidth).map((k) => k.m.fixedWidth!)
  let plan = planSectionWidths({ innerWidthCm, fixedWidthsCm: fixedWidths(), minVarWidthCm, maxVarWidthCm })

  while (!plan.fits) {
    let last = -1
    for (let i = kept.length - 1; i >= 0; i--) {
      if (kept[i].m.fixedWidth) { last = i; break }
    }
    if (last < 0) break
    droppedFixed.push(kept[last].oldIndex)
    kept = kept.filter((_, i) => i !== last)
    plan = planSectionWidths({ innerWidthCm, fixedWidthsCm: fixedWidths(), minVarWidthCm, maxVarWidthCm })
  }

  const variableCount = kept.filter((k) => !k.m.fixedWidth).length
  // Lenient keeps whatever count was saved, unless no variable vak fits at all:
  // then only the panel (with machines) or the single mandatory vak remains.
  const target =
    mode === 'strict'
      ? Math.max(plan.minVariable, Math.min(plan.maxVariable, variableCount))
      : plan.maxVariable === 0
        ? plan.minVariable
        : variableCount

  if (target < variableCount) {
    let toDrop = variableCount - target
    for (let i = kept.length - 1; i >= 0 && toDrop > 0; i--) {
      if (!kept[i].m.fixedWidth) {
        kept.splice(i, 1)
        toDrop -= 1
      }
    }
  }

  const appended = target > variableCount ? target - variableCount : 0
  const unchanged =
    droppedFixed.length === 0 &&
    appended === 0 &&
    kept.length === modules.length &&
    kept.every((k, i) => k.oldIndex === i)

  const indexMap = new Map<number, number>()
  if (unchanged) {
    modules.forEach((_, i) => indexMap.set(i, i))
    return { modules, indexMap, droppedFixed }
  }

  const next: BaseModuleSlot[] = kept.map((k, i) => {
    indexMap.set(k.oldIndex, i)
    return { ...k.m, slotIndex: i }
  })
  for (let i = 0; i < appended; i++) next.push(emptySlot(next.length))
  // A dubbele module cannot reach past the last slot any more.
  for (let i = 0; i < next.length; i++) {
    if (next[i].span === 2 && i + 1 >= next.length) next[i] = { ...next[i], span: 1 }
  }
  return { modules: next, indexMap, droppedFixed }
}
