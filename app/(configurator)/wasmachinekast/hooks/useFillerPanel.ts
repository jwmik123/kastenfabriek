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
  // The resolved side: a 'both' that no longer splits reads as 'right'.
  const side = useWasmachinekastStore((s) => s.fillerPanel(section)?.side ?? 'right')
  const widthCm = useWasmachinekastStore((s) => s.fillerPanel(section)?.widthCm ?? 0)
  return useMemo(() => (widthCm > 0 ? { side, widthCm } : null), [side, widthCm])
}

/** Extra thickness per side panel of a section from an absorbed rest, in cm. */
export function useSideWallExtraCm(section: 'high' | 'low'): number {
  return useWasmachinekastStore((s) => s.sideWallExtraCm(section))
}

/** Whether the section's panel may be split over both sides. */
export function useCanSplitFiller(section: 'high' | 'low'): boolean {
  return useWasmachinekastStore((s) => {
    const panel = s.fillerPanel(section)
    return panel ? panel.widthCm / 2 >= s.minFillerPanelCm() - 1e-6 : false
  })
}
