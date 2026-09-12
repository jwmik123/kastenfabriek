'use client'

import { useMemo } from 'react'
import { useWasmachinekastStore } from '../store'
import type { FillerPanel } from '../sections/sectionPlan'

/**
 * The afwerkpaneel of one section, as a stable object. The store derives the
 * panel on every call, so selecting `fillerPanel(section)` straight from a
 * component would hand React a fresh object each render; this selects the two
 * primitives instead and memoises the pair.
 */
export function useFillerPanel(section: 'high' | 'low'): FillerPanel | null {
  const side = useWasmachinekastStore((s) => s.fillerPanelSide[section])
  const widthCm = useWasmachinekastStore((s) => s.fillerPanel(section)?.widthCm ?? 0)
  return useMemo(() => (widthCm > 0 ? { side, widthCm } : null), [side, widthCm])
}
