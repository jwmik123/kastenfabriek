/**
 * Compute per-slot widths in meters.
 * Slots with fixedWidth get that width (cm → m). Variable slots share remaining innerW equally.
 */
export function computeSlotWidthsM(
  modules: Array<{ fixedWidth?: number }>,
  innerW: number,
): number[] {
  const totalFixed = modules.reduce((sum, m) => sum + (m.fixedWidth ? m.fixedWidth / 100 : 0), 0)
  const varCount = modules.filter((m) => !m.fixedWidth).length
  const varW = varCount > 0 ? Math.max(0, (innerW - totalFixed) / varCount) : 0
  return modules.map((m) => (m.fixedWidth ? m.fixedWidth / 100 : varW))
}

/**
 * Can a fixed-width module of `candidateWidthCm` be placed at `slotIndex`?
 *
 * Treats the candidate slot as fixed at `candidateWidthCm`, keeps every other
 * slot's existing `fixedWidth`, and checks that the leftover space divided over
 * the remaining variable slots still leaves each at least `minVarWidthCm`.
 * This lets a fixed module shrink its variable neighbours instead of requiring
 * its own slot to already be wide enough.
 *
 * Returns true for non-fixed candidates (candidateWidthCm falsy).
 */
/** Narrowest a variable (non-fixed) module may get when Sanity says nothing. */
export const FALLBACK_MODULE_MIN_WIDTH_CM = 30

/**
 * How many variable slots can sit next to the fixed ones and still each keep a
 * width inside [minVarWidthCm, maxVarWidthCm]?
 *
 * Returns the largest count that is at most `currentVariableCount` — i.e. how
 * many variable slots survive, dropping as few as possible — or null when even
 * a single variable slot cannot be made to fit.
 */
export function fitVariableSlotCount({
  sectionWidthCm,
  totalFixedCm,
  currentVariableCount,
  minVarWidthCm,
  maxVarWidthCm,
}: {
  sectionWidthCm: number
  totalFixedCm: number
  currentVariableCount: number
  minVarWidthCm: number
  maxVarWidthCm: number
}): number | null {
  const free = sectionWidthCm - totalFixedCm
  if (free < 0) return null
  if (currentVariableCount <= 0) return 0

  const mostThatFit = Math.floor(free / minVarWidthCm)
  const fewestAllowed = Math.max(1, Math.ceil(free / maxVarWidthCm))
  const count = Math.min(currentVariableCount, mostThatFit)
  return count >= fewestAllowed ? count : null
}

export function canFitFixedWidth(
  modules: Array<{ fixedWidth?: number }>,
  sectionWidthCm: number,
  slotIndex: number,
  candidateWidthCm: number | undefined,
  minVarWidthCm = 15,
): boolean {
  if (!candidateWidthCm) return true
  if (modules.length === 0 || sectionWidthCm <= 0) return false
  if (slotIndex < 0 || slotIndex >= modules.length) return false

  let totalFixed = 0
  let varCount = 0
  for (let i = 0; i < modules.length; i++) {
    if (i === slotIndex) totalFixed += candidateWidthCm
    else if (modules[i].fixedWidth) totalFixed += modules[i].fixedWidth!
    else varCount += 1
  }
  if (totalFixed > sectionWidthCm) return false
  if (varCount === 0) return true
  return (sectionWidthCm - totalFixed) / varCount >= minVarWidthCm
}
