/**
 * Pure module — no R3F, Three, or Zustand imports. Tested in isolation.
 *
 * Handle-fit math for sloped doors:
 * - Lowers handle Y when the door is too short at the handle's edge to keep
 *   the full handle on the door panel.
 * - Decides whether a handle can mount at all given the door height at the
 *   handle's edge.
 */

// Safety margin (m). Distance kept between handle end and the nearest door edge.
export const SAFETY = 0.05

// Nominal handle Y on a full-height door (m).
export const DEFAULT_HANDLE_Y = 0.9

// Assumed handle height (cm) used for Y placement when a handle has no
// heightCm in Sanity yet (issue #067 backfill pending). Keeps sloped-door
// handle Y reasonable without yet gating the picker.
export const FALLBACK_HEIGHT_CM = 20

export interface HandleFitDoorContext {
  /** Door height (m) at the X where the handle is mounted. */
  doorHeightAtHandle: number
}

export interface HandleFitHandle {
  /** Vertical extent of the physical handle (cm). Undefined = unknown size. */
  heightCm?: number
}

/**
 * True when the door has room for the full handle plus 2·SAFETY of margin
 * (top + bottom). Handles with unknown `heightCm` are treated as fitting —
 * existing data has no sizes yet (issue #067), so the picker shows them all
 * until an editor fills the field.
 */
export function canMountHandle(
  handle: HandleFitHandle,
  ctx: HandleFitDoorContext,
): boolean {
  if (handle.heightCm == null) return true
  return ctx.doorHeightAtHandle >= handle.heightCm / 100 + 2 * SAFETY
}

/**
 * Y position (m) for the handle on the door. On a full-height door this
 * returns DEFAULT_HANDLE_Y; on a sloped door it lowers the handle so the
 * top of the handle stays SAFETY below the door's top edge at the handle's X.
 */
export function computeHandleY(
  ctx: HandleFitDoorContext,
  handle: HandleFitHandle,
): number {
  const heightCm = handle.heightCm ?? FALLBACK_HEIGHT_CM
  const halfH = heightCm / 200
  return Math.min(DEFAULT_HANDLE_Y, ctx.doorHeightAtHandle - halfH - SAFETY)
}

/**
 * Worst-case door-height at any handle edge given current slope parameters.
 * Used by the picker to disable handles that cannot mount anywhere.
 *
 * Inputs are meters. `mainHeightM` is the corpus/TC separator height; floor
 * + top-wall thickness (`floorAndTopM`) is subtracted to get the usable door
 * height. The minimum is taken at the slope-bottom corner on each active side.
 */
export function minDoorHandleEdgeHeightM(args: {
  diagonalSide: 'none' | 'left' | 'right' | 'both'
  leftDiagStartHeightM: number
  rightDiagStartHeightM: number
  mainHeightM: number
  floorAndTopM: number
}): number {
  const { diagonalSide, leftDiagStartHeightM, rightDiagStartHeightM, mainHeightM, floorAndTopM } = args
  const candidates: number[] = [mainHeightM]
  if (diagonalSide === 'left' || diagonalSide === 'both') candidates.push(leftDiagStartHeightM)
  if (diagonalSide === 'right' || diagonalSide === 'both') candidates.push(rightDiagStartHeightM)
  return Math.max(0, Math.min(...candidates) - floorAndTopM)
}
