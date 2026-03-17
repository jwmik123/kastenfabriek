// Corpus wall thickness in cm (matches CORPUS_WALL = 0.018m in scene files)
const CORPUS_WALL_CM = 1.8

/**
 * Amplification factor: how much the diagonal's horizontal reach is multiplied from mainH
 * to full closet height. visual_width = internal_width * diagAmplification(startH, mainH, closetH).
 *
 * For non-TC closets (closetH ≈ mainH) this is ~1.
 * For TC closets (closetH >> mainH) this can be 4-5×.
 */
export function diagAmplification(
  startHeightCm: number,
  mainHeightCm: number,
  closetHeightCm: number,
): number {
  const den = mainHeightCm - startHeightCm
  return den > 0 ? (closetHeightCm - startHeightCm) / den : 1
}

/**
 * Returns the allowed { min, max } range (cm) for a diagonal start height.
 *
 * The geometric bound is mainHeight - 20 to prevent numerical instability
 * (topX = diagTopWidth * (topY - startH) / (mainH - startH) blows up as startH → mainH).
 * For TC closets mainHeight = 225cm, so the max stored start height is 205cm.
 */
export function getStartHeightRange(mainHeightCm: number): { min: number; max: number } {
  return { min: 100, max: Math.floor(mainHeightCm - 20) }
}

/**
 * Returns the allowed { min, max } range (cm) for one side's VISUAL diagonal width
 * (= horizontal reach at full closet height, which is what the user sees in the 3D view).
 *
 * Uses diagAmplification to project the internal reach (at mainH) all the way to
 * closetHeight, so constraints are enforced in the space the user actually perceives.
 *
 * @param otherSideVisualWidthCm  The other side's current VISUAL width in cm, or null if inactive
 */
export function getWidthRange(
  side: 'left' | 'right',
  closetWidthCm: number,
  moduleCount: number,
  otherSideVisualWidthCm: number | null,
): { min: number; max: number } {
  const innerWidth = closetWidthCm - 2 * CORPUS_WALL_CM
  const slotWidth = innerWidth / moduleCount

  let max: number
  if (otherSideVisualWidthCm !== null) {
    // Both diagonals active: must leave a minimum flat gap between them (in visual space)
    const minFlatGap = Math.max(30, closetWidthCm / moduleCount)
    max = innerWidth - otherSideVisualWidthCm - minFlatGap
  } else {
    // Single diagonal: must leave at least one full-height module slot (in visual space)
    max = innerWidth - slotWidth
  }

  return {
    min: 10,
    max: Math.max(10, Math.floor(max)),
  }
}

/**
 * Clamp a value to [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
