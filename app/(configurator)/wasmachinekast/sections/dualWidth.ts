/**
 * Hoge + lage kast naast elkaar (low-left / low-right): the customer gives one
 * total width and says where the space next to the machines should go — to
 * the vakken of the hoge kast or of the lage kast. This decides the width of
 * each part.
 *
 * Each part first gets what it cannot do without: its side panels and the
 * machines placed in it. The part that does not get the rest also keeps the
 * vakken the customer put there, at their minimum width, so adding a vak there
 * takes it from the rest. Whatever is left over goes entirely to the part the
 * customer chose; that part widens, adds or sheds its own vakken to fill it,
 * exactly as a single cabinet does when its width changes.
 *
 * Pure: the store applies the outcome and reconciles the vakken.
 */

export type RestPreference = 'high' | 'low'

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
  high: DualPartInput
  low: DualPartInput
  /** Narrowest vak. */
  minVarWidthCm: number
  preference: RestPreference
}

export interface DualWidthResult {
  highWidthCm: number
  lowWidthCm: number
  /** Width left over after both parts have their minimum; goes to `preference`. */
  restCm: number
  /** False when the minimum of both parts is wider than the total. */
  fits: boolean
  /** Narrowest total that still fits: both parts at their minimum. */
  minTotalCm: number
}

const EPS = 1e-6

/** Millimetre precision, so the split never drifts by float noise. */
function mm(cm: number): number {
  return Math.round(cm * 10) / 10
}

/**
 * The narrowest a part can be. `keepVakken` is false for the part that gets
 * the rest: its vakken follow its width, so only the one slot every part keeps
 * (when it has no machine) counts.
 */
export function dualPartMinimumCm(part: DualPartInput, minVarWidthCm: number, keepVakken = true): number {
  const machines = part.fixedWidthsCm.reduce((sum, w) => sum + w, 0)
  const hasMachines = part.fixedWidthsCm.length > 0
  const vakken = keepVakken
    ? hasMachines ? part.variableCount : Math.max(1, part.variableCount)
    : hasMachines ? 0 : 1
  return part.wallsCm + machines + vakken * minVarWidthCm
}

export function splitDualWidth({ totalCm, high, low, minVarWidthCm, preference }: DualWidthInput): DualWidthResult {
  const highMin = mm(dualPartMinimumCm(high, minVarWidthCm, preference !== 'high'))
  const lowMin = mm(dualPartMinimumCm(low, minVarWidthCm, preference !== 'low'))
  const minTotalCm = mm(highMin + lowMin)
  const restCm = mm(totalCm - minTotalCm)
  const fits = restCm >= -EPS
  const rest = Math.max(0, restCm)
  return {
    highWidthCm: mm(highMin + (preference === 'high' ? rest : 0)),
    lowWidthCm: mm(lowMin + (preference === 'low' ? rest : 0)),
    restCm,
    fits,
    minTotalCm,
  }
}

/**
 * The preference an existing pair of widths reads as, for configurations saved
 * before the question existed: whichever part holds more than its minimum.
 */
export function inferRestPreference(
  highWidthCm: number,
  lowWidthCm: number,
  high: DualPartInput,
  low: DualPartInput,
  minVarWidthCm: number,
): RestPreference {
  // Measured against the tight-fit minimum: the part that got the rest has
  // width to spare beyond machines and one vak.
  const highSpare = highWidthCm - dualPartMinimumCm(high, minVarWidthCm, false)
  const lowSpare = lowWidthCm - dualPartMinimumCm(low, minVarWidthCm, false)
  return lowSpare > highSpare ? 'low' : 'high'
}
