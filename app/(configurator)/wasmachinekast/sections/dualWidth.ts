/**
 * Hoge + lage kast naast elkaar (low-left / low-right): the customer gives one
 * total width and the width of the lage kast; the hoge kast gets the rest.
 *
 * The chosen lage-kast width stays put while the customer adds or removes
 * vakken — a vak less means wider vakken, not a narrower kast, and the vak
 * count stops where the vakken would leave their allowed width. Only two things
 * move it: a part that would get narrower than its machines (plus one vak when
 * it has none), and a total that no longer holds both parts.
 *
 * Pure: the store applies the outcome and reconciles the vakken.
 */

export interface DualPartInput {
  /** Side panels this part owns, in cm (the low part shares the seam panel). */
  wallsCm: number
  /** Widths of the fixed-width slots (machines) placed in this part. */
  fixedWidthsCm: number[]
  /** Vakken without a machine in this part. */
  variableCount: number
}

export interface DualWidthInput {
  totalCm: number
  /** The lage-kast width the customer chose. */
  lowWidthCm: number
  high: DualPartInput
  low: DualPartInput
  /** Narrowest vak. */
  minVarWidthCm: number
}

export interface DualWidthResult {
  highWidthCm: number
  lowWidthCm: number
  /** False when the minimum of both parts is wider than the total. */
  fits: boolean
  /** Narrowest total that still fits: both parts at their minimum. */
  minTotalCm: number
  /** Range the lage-kast width can take within this total. */
  minLowCm: number
  maxLowCm: number
}

/** Millimetre precision, so the split never drifts by float noise. */
function mm(cm: number): number {
  return Math.round(cm * 10) / 10
}

/**
 * The narrowest a part can be: its side panels and machines, plus one vak
 * when it has no machine. Its other vakken follow its width, like a single
 * cabinet's do.
 */
export function dualPartMinimumCm(part: DualPartInput, minVarWidthCm: number): number {
  const machines = part.fixedWidthsCm.reduce((sum, w) => sum + w, 0)
  const vakken = part.fixedWidthsCm.length > 0 ? 0 : 1
  return part.wallsCm + machines + vakken * minVarWidthCm
}

export function splitDualWidth({ totalCm, lowWidthCm, high, low, minVarWidthCm }: DualWidthInput): DualWidthResult {
  const highMin = mm(dualPartMinimumCm(high, minVarWidthCm))
  const lowMin = mm(dualPartMinimumCm(low, minVarWidthCm))
  const minTotalCm = mm(highMin + lowMin)
  const fits = totalCm >= minTotalCm - 1e-6
  const total = mm(Math.max(totalCm, minTotalCm))
  const maxLowCm = mm(total - highMin)
  const lowWidth = mm(Math.min(maxLowCm, Math.max(lowMin, lowWidthCm)))
  return {
    highWidthCm: mm(total - lowWidth),
    lowWidthCm: lowWidth,
    fits,
    minTotalCm,
    minLowCm: lowMin,
    maxLowCm,
  }
}
