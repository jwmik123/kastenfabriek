'use client'

import { useClosetStore } from '../../store'
import { MODULE_LAYOUTS } from '../moduleLayouts'
import { LAYOUT_SVGS } from '../LayoutSvgs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'

export default function ModulesStep() {
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const modules = useClosetStore((s) => s.modules)
  const setModuleCount = useClosetStore((s) => s.setModuleCount)
  const setModuleLayout = useClosetStore((s) => s.setModuleLayout)
  const minModules = useClosetStore((s) => s.minModules())
  const maxModules = useClosetStore((s) => s.maxModules())
  const moduleWidthCm = useClosetStore((s) => s.moduleWidthCm())
  const selectedSlot = useClosetStore((s) => s.selectedSlot)
  const setSelectedSlot = useClosetStore((s) => s.setSelectedSlot)

  return (
    <div className="space-y-7">
      {/* <div>
        <h2 className="text-base font-semibold">Modules</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kies het aantal modules en vul elk vak met een indeling.
        </p>
      </div> */}

      {/* Module count +/- */}
      <div className="space-y-2">
        <span className="text-sm font-medium">Aantal modules</span>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setModuleCount(moduleCount - 1)}
            disabled={moduleCount <= minModules}
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>
          <span className="w-6 text-center tabular-nums font-semibold text-sm">{moduleCount}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setModuleCount(moduleCount + 1)}
            disabled={moduleCount >= maxModules}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground ml-1">
            {moduleWidthCm.toFixed(0)} cm / module
          </span>
        </div>
      </div>

      {/* Slot strip */}
      <div className="space-y-2">
        <span className="text-sm font-medium">Klik op een vak om een indeling te kiezen</span>
        <div className="flex gap-1 flex-wrap mt-4">
          {modules.map((m) => {
            const isSelected = selectedSlot === m.slotIndex
            const hasLayout = m.layoutId !== null

            return (
              <button
                key={m.slotIndex}
                onClick={() => setSelectedSlot(m.slotIndex === selectedSlot ? null : m.slotIndex)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 w-14 h-7 rounded-md border-2 transition-all',
                  isSelected
                    ? 'border-foreground bg-accent text-foreground'
                    : hasLayout
                      ? 'border-border bg-muted text-foreground hover:border-foreground/40'
                      : 'border-dashed border-border text-muted-foreground hover:border-foreground/40',
                )}
              >
                
                <span className="text-[10px] leading-none">Kolom {m.slotIndex + 1}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Layout picker for selected slot */}
      {selectedSlot !== null && (
        <div className="space-y-4">
          <span className="text-sm font-medium">
            Kies je indeling voor kolom {selectedSlot + 1}
          </span>
          <div className="flex flex-row gap-4 flex-wrap mt-4">
            {MODULE_LAYOUTS.map((layout) => {
              const LayoutSvg = LAYOUT_SVGS[layout.id]
              const isActive = modules[selectedSlot]?.layoutId === layout.id

              return (
                <button
                  key={layout.id}
                  onClick={() => setModuleLayout(selectedSlot, layout.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-md border-2 transition-all',
                    isActive
                      ? 'border-primary bg-primary text-background'
                      : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted',
                  )}
                >
                  {LayoutSvg && <LayoutSvg className="h-32" />}
                  {/* <span className="text-[11px] font-medium leading-snug text-center">{layout.label}</span> */}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
