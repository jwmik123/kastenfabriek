'use client'

import { useEffect, useRef } from 'react'
import { Grid2x2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfiguratorStore } from '../store/context'
import { FLOORS, type FloorOption } from '../materials/floors'
import { useFloorPickerUi } from './floorPickerUi'
import ToolBtn from './ToolBtn'

/** CSS-only preview of a floor finish for swatches. */
export function floorSwatchStyle(floor: FloorOption): React.CSSProperties {
  if (floor.palette) {
    const { light, dark, gap } = floor.palette
    if (floor.kind === 'herringbone') {
      return {
        backgroundColor: light,
        backgroundImage:
          `repeating-linear-gradient(45deg, ${dark} 0 5px, ${gap} 5px 6px, ${light} 6px 11px, ${gap} 11px 12px)`,
      }
    }
    return {
      backgroundColor: light,
      backgroundImage:
        `repeating-linear-gradient(0deg, ${dark} 0 6px, ${gap} 6px 7px, ${light} 7px 13px, ${gap} 13px 14px)`,
    }
  }
  return { backgroundColor: floor.color }
}

interface FloorPickerProps {
  tooltipSide: 'right' | 'bottom'
}

/**
 * Toolbar button that opens a small swatch panel to choose the floor finish.
 * Lives inside the toolbar rail; the panel opens to the right of it. The
 * open state is shared with FloorCta via useFloorPickerUi.
 */
export default function FloorPicker({ tooltipSide }: FloorPickerProps) {
  const floorId = useConfiguratorStore((s) => s.floorId)
  const setFloorId = useConfiguratorStore((s) => s.setFloorId)
  const open = useFloorPickerUi((s) => s.open)
  const setOpen = useFloorPickerUi((s) => s.setOpen)
  const toggle = useFloorPickerUi((s) => s.toggle)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null
      if (rootRef.current?.contains(target)) return
      // Clicks on the CTA are handled by the CTA itself.
      if (target?.closest?.('[data-tour="floor-cta"]')) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  // Close the panel when the picker unmounts (e.g. canvas remount).
  useEffect(() => () => setOpen(false), [setOpen])

  const current = FLOORS.find((f) => f.id === floorId) ?? FLOORS[0]

  return (
    // No `relative` here on purpose: the panel anchors to the toolbar rail
    // (the nearest positioned ancestor) so it lines up with the rail's top and
    // stays inside the canvas instead of running past its bottom edge.
    <div ref={rootRef} data-tour="floor-picker">
      <ToolBtn
        onClick={toggle}
        active={open}
        tooltip={`Vloer: ${current.label}`}
        tooltipSide={tooltipSide}
      >
        <Grid2x2 className="size-5" />
      </ToolBtn>

      {open && (
        <div
          role="dialog"
          aria-label="Vloer kiezen"
          className={cn(
            'absolute left-full top-0 ml-3 z-20 w-[292px] rounded-xl border border-border',
            'bg-background/95 backdrop-blur-sm shadow-lg p-3',
          )}
        >
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-xs font-medium text-muted-foreground">Vloer</span>
            <span className="text-xs text-muted-foreground truncate max-w-[60%]">{current.label}</span>
          </div>
          <div className="grid grid-cols-4 gap-x-1 gap-y-2">
            {FLOORS.map((floor) => {
              const selected = floor.id === floorId
              return (
                <button
                  key={floor.id}
                  type="button"
                  title={floor.label}
                  aria-label={floor.label}
                  aria-pressed={selected}
                  onClick={() => setFloorId(floor.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg p-1 transition-colors cursor-pointer',
                    'hover:bg-muted',
                  )}
                >
                  <span
                    aria-hidden
                    style={floorSwatchStyle(floor)}
                    className={cn(
                      'block size-9 shrink-0 rounded-full border shadow-sm',
                      selected ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-border',
                    )}
                  />
                  <span className="w-full text-center text-[10px] leading-[1.15] line-clamp-2">{floor.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
