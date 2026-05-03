'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useWasmachinekastStore } from '../store'
import { WASHER_LAYOUTS, isLayoutAvailable } from '../moduleLayouts'
import { LAYOUT_SVGS } from '../../kledingkast/components/LayoutSvgs'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'

const MODULES_STEP = 3

export default function ModulePopover() {
  const step             = useWasmachinekastStore((s) => s.step)
  const selectedSlot     = useWasmachinekastStore((s) => s.selectedSlot)
  const setSelectedSlot  = useWasmachinekastStore((s) => s.setSelectedSlot)
  const setModuleLayout  = useWasmachinekastStore((s) => s.setModuleLayout)
  const setModuleSpan    = useWasmachinekastStore((s) => s.setModuleSpan)
  const toggleModuleDoor = useWasmachinekastStore((s) => s.toggleModuleDoor)
  const modules          = useWasmachinekastStore((s) => s.modules)
  const moduleCount      = useWasmachinekastStore((s) => s.moduleCount)
  const moduleWidthCm    = useWasmachinekastStore((s) => s.moduleWidthCm())
  const moduleLayouts    = useWasmachinekastStore((s) => s.moduleLayouts)
  const washerModules    = useWasmachinekastStore((s) => s.washerModules)

  const ref = useRef<HTMLDivElement>(null)

  const washerSlots = new Set(washerModules.map((w) => w.slotIndex))
  const washerIds   = new Set(WASHER_LAYOUTS.map((l) => l.layoutId))

  const isWasherSlot = selectedSlot !== null && washerSlots.has(selectedSlot)
  const isActive = step === MODULES_STEP && selectedSlot !== null && !isWasherSlot

  useEffect(() => {
    if (!isActive) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setSelectedSlot(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedSlot(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [isActive, setSelectedSlot])

  if (!isActive || selectedSlot === null) return null

  const isCoveredSlot =
    selectedSlot > 0 && modules[selectedSlot - 1]?.span === 2
  const isDouble = modules[selectedSlot]?.span === 2

  const nextIsWasher = washerSlots.has(selectedSlot + 1)
  const canBeDouble = selectedSlot < modules.length - 1 && !nextIsWasher

  const availableLayouts = moduleLayouts.filter((l) => !washerIds.has(l.layoutId))

  const center = (selectedSlot + 0.5) / moduleCount
  const leftPct = Math.min(85, Math.max(15, center * 100))

  const activeLayoutId = modules[selectedSlot]?.layoutId

  return (
    <div
      ref={ref}
      data-testid="module-popover"
      className="absolute top-20 z-20 w-[320px] -translate-x-1/2 rounded-xl bg-background/95 backdrop-blur-sm border border-border shadow-lg p-4 space-y-4"
      style={{ left: `${leftPct}%` }}
    >
      <div className="flex items-center gap-2 pb-3 border-b border-border/30">
        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
          {selectedSlot + 1}
        </div>
        <span className="text-sm font-medium flex-1">Vak {selectedSlot + 1} instellen</span>
        <button
          type="button"
          aria-label="Sluiten"
          onClick={() => setSelectedSlot(null)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted/60"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isCoveredSlot ? (
        <p className="text-xs text-muted-foreground">
          Dit vak maakt deel uit van een dubbel module.
        </p>
      ) : (
        <>
          <div className="flex gap-5">
            <div
              data-testid="module-popover-door-toggle"
              className="flex items-center justify-between flex-1"
            >
              <span className="text-sm">Deur</span>
              <Toggle
                checked={modules[selectedSlot]?.hasDoor ?? false}
                onCheckedChange={() => toggleModuleDoor(selectedSlot)}
              />
            </div>
            {canBeDouble && (
              <div
                data-testid="module-popover-double-toggle"
                className="flex items-center justify-between flex-1"
              >
                <span className="text-sm">Dubbele module</span>
                <Toggle
                  checked={isDouble}
                  onCheckedChange={(v) => setModuleSpan(selectedSlot, v ? 2 : 1)}
                />
              </div>
            )}
          </div>

          <div
            data-testid="module-popover-layout-picker"
            className="grid grid-cols-4 gap-2"
          >
            {availableLayouts.map((layout) => {
              const LayoutSvg = LAYOUT_SVGS[layout.layoutId]
              const active = activeLayoutId === layout.layoutId
              const available = isLayoutAvailable(layout, moduleWidthCm)
              return (
                <button
                  key={layout.layoutId}
                  type="button"
                  data-layout-id={layout.layoutId}
                  disabled={!available}
                  onClick={() => setModuleLayout(selectedSlot, layout.layoutId)}
                  style={{ aspectRatio: '1' }}
                  className={cn(
                    'flex items-center justify-center rounded-md transition-all py-2',
                    active
                      ? 'bg-primary text-primary-foreground border-2 border-primary'
                      : available
                        ? 'bg-background text-foreground border border-border/50 hover:border-primary'
                        : 'bg-background text-muted-foreground border border-border/30 opacity-40 cursor-not-allowed',
                  )}
                >
                  {LayoutSvg ? (
                    <LayoutSvg className="w-1/3 h-auto" />
                  ) : (
                    <span className="text-[10px] text-center px-1 leading-tight">{layout.name}</span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
