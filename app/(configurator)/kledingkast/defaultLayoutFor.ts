import { MODULE_LAYOUTS } from './scene/moduleLayouts'

const OUTER_PREFERENCE = [5, 6, 1]
const MIDDLE_PREFERENCE = [2, 7, 1]

export function defaultLayoutFor(
  slotIndex: number,
  _slotWidthCm: number,
  effectiveHeightCm: number,
  totalModules: number,
): number {
  const isOuter = totalModules <= 2 || slotIndex === 0 || slotIndex === totalModules - 1
  const preference = isOuter ? OUTER_PREFERENCE : MIDDLE_PREFERENCE
  const heightM = effectiveHeightCm / 100

  for (const id of preference) {
    const layout = MODULE_LAYOUTS.find((l) => l.id === id)
    if (layout && (layout.minSlotHeight ?? 0) <= heightM) {
      return id
    }
  }

  return 1
}
