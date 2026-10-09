/**
 * Top cabinet doors. The top cabinet keeps one compartment per slot, but the
 * two compartments above a double module belong to that module: the customer
 * chooses "Bovenkast deur" once for the double, and both follow that choice.
 * Render, pricing and order spec all read through these helpers so a stale
 * value on the covered half (older snapshots) can never disagree with it.
 */
type TopDoorSlot = { span: 1 | 2; topHasDoor?: boolean }

/** The slot whose choice decides compartment `i`: the double covering it, or itself. */
export function topDoorOwner(modules: readonly TopDoorSlot[], i: number): number {
  return i > 0 && modules[i - 1]?.span === 2 ? i - 1 : i
}

/** Whether compartment `i` gets a door. Absent = door. */
export function hasTopDoorAt(modules: readonly TopDoorSlot[], i: number): boolean {
  return modules[topDoorOwner(modules, i)]?.topHasDoor !== false
}

/** Top cabinet doors to price: one per compartment that keeps its door. */
export function countTopCabinetDoors(modules: readonly TopDoorSlot[]): number {
  let count = 0
  for (let i = 0; i < modules.length; i++) if (hasTopDoorAt(modules, i)) count++
  return count
}

/**
 * Flip the top door of the compartment(s) slot `i` belongs to. Writes both
 * halves of a double so the stored data matches what is rendered and priced.
 */
export function toggleTopDoorIn<T extends TopDoorSlot & { slotIndex: number }>(modules: T[], i: number): T[] {
  const owner = topDoorOwner(modules, i)
  const next = !hasTopDoorAt(modules, owner)
  const last = modules[owner]?.span === 2 ? owner + 1 : owner
  return modules.map((m) =>
    m.slotIndex >= owner && m.slotIndex <= last ? { ...m, topHasDoor: next } : m,
  )
}
