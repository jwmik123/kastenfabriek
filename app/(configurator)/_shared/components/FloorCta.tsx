'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfiguratorStore } from '../store/context'
import { DEFAULT_FLOOR_ID, getFloor } from '../materials/floors'
import { useFloorPickerUi } from './floorPickerUi'
import { floorSwatchStyle } from './FloorPicker'

/** Finish previewed in the CTA swatch — the one people ask for most. */
const CTA_PREVIEW_FLOOR_ID = 'lichthout-visgraat'

/**
 * Canvas call-to-action nudging users to try their own floor under the
 * cabinet. Opens the same swatch panel as the toolbar button. Hidden once
 * the user picks a floor, opens the picker from here, or dismisses it
 * (persisted in localStorage).
 */
export default function FloorCta() {
  const floorId = useConfiguratorStore((s) => s.floorId)
  const ctaDismissed = useFloorPickerUi((s) => s.ctaDismissed)
  const hydrateCta = useFloorPickerUi((s) => s.hydrateCta)
  const dismissCta = useFloorPickerUi((s) => s.dismissCta)
  const setOpen = useFloorPickerUi((s) => s.setOpen)

  useEffect(() => {
    hydrateCta()
  }, [hydrateCta])

  if (ctaDismissed || floorId !== DEFAULT_FLOOR_ID) return null

  const preview = getFloor(CTA_PREVIEW_FLOOR_ID)

  return (
    <div
      data-tour="floor-cta"
      className={cn(
        'absolute z-10 flex items-center gap-3 rounded-xl border border-border',
        'bg-background/90 backdrop-blur-sm shadow-lg pl-3 pr-2 py-2',
        // Mobile: bottom-right, clear of the mobile header. Desktop: top-right,
        // clear of the price panel along the bottom.
        'right-3 bottom-3 md:bottom-auto md:right-4 md:top-4',
      )}
    >
      <span
        aria-hidden
        style={floorSwatchStyle(preview)}
        className="block size-9 shrink-0 rounded-full border border-border shadow-sm"
      />
      <div className="hidden sm:flex flex-col leading-tight">
        <span className="text-sm font-medium">Zo staat je kast op jouw vloer</span>
        <span className="text-xs text-muted-foreground">Kies uit visgraat, eiken, betonlook en meer</span>
      </div>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          dismissCta()
        }}
        className={cn(
          'ml-1 shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-background',
          'transition-colors hover:bg-primary/90 cursor-pointer',
        )}
      >
        Vloer kiezen
      </button>
      <button
        type="button"
        aria-label="Sluiten"
        onClick={dismissCta}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
