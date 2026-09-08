import { create } from 'zustand'
import { hasSeenTour, markTourSeen } from '../tour/tourStorage'

/** localStorage key: the floor CTA was dismissed or acted upon. */
export const FLOOR_CTA_STORAGE_KEY = 'kf-floor-cta-seen-v1'

interface FloorPickerUiState {
  /** Whether the swatch panel (anchored to the toolbar rail) is open. */
  open: boolean
  /** Whether the "kies je vloer" call-to-action has been dismissed. */
  ctaDismissed: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  /** Hide the CTA for good (persisted). */
  dismissCta: () => void
  /** Read persisted dismissal — call once on the client after mount. */
  hydrateCta: () => void
}

/**
 * Tiny UI store shared by the toolbar button and the canvas CTA so either
 * can open the same swatch panel. Module-level singleton: only one
 * configurator is mounted at a time.
 */
export const useFloorPickerUi = create<FloorPickerUiState>((set) => ({
  open: false,
  ctaDismissed: true, // assume dismissed until hydrated, avoids a flash on load
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
  dismissCta: () => {
    markTourSeen(FLOOR_CTA_STORAGE_KEY)
    set({ ctaDismissed: true })
  },
  hydrateCta: () => set({ ctaDismissed: hasSeenTour(FLOOR_CTA_STORAGE_KEY) }),
}))
