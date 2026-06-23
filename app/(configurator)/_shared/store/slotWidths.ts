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
