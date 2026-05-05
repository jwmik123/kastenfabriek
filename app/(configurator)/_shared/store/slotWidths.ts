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
