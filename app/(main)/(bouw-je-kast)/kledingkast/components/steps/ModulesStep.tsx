'use client'

import { useClosetStore } from '../../store'
import { MODULE_LAYOUTS } from '../moduleLayouts'
import { LAYOUT_SVGS } from '../LayoutSvgs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'
import type { ModuleSlot } from '../../store'

type SlotGroup =
  | { type: 'single'; module: ModuleSlot }
  | { type: 'double'; primary: ModuleSlot; secondary: ModuleSlot }

function groupModules(modules: ModuleSlot[]): SlotGroup[] {
  const groups: SlotGroup[] = []
  let i = 0
  while (i < modules.length) {
    const m = modules[i]
    if (m.span === 2 && i + 1 < modules.length) {
      groups.push({ type: 'double', primary: m, secondary: modules[i + 1] })
      i += 2
    } else {
      groups.push({ type: 'single', module: m })
      i++
    }
  }
  return groups
}

export default function ModulesStep() {
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const modules = useClosetStore((s) => s.modules)
  const setModuleCount = useClosetStore((s) => s.setModuleCount)
  const setModuleLayout = useClosetStore((s) => s.setModuleLayout)
  const setModuleSpan = useClosetStore((s) => s.setModuleSpan)
  const toggleModuleDoor = useClosetStore((s) => s.toggleModuleDoor)
  const minModules = useClosetStore((s) => s.minModules())
  const maxModules = useClosetStore((s) => s.maxModules())
  const moduleWidthCm = useClosetStore((s) => s.moduleWidthCm())
  const selectedSlot = useClosetStore((s) => s.selectedSlot)
  const setSelectedSlot = useClosetStore((s) => s.setSelectedSlot)

  const groups = groupModules(modules)

  // Is the selected slot covered by the previous slot's double?
  const isCoveredSlot =
    selectedSlot !== null &&
    selectedSlot > 0 &&
    modules[selectedSlot - 1]?.span === 2

  // Can a double start from this slot? (needs a next slot)
  const canBeDouble = selectedSlot !== null && selectedSlot < modules.length - 1

  const isDouble = selectedSlot !== null && modules[selectedSlot]?.span === 2

  return (
    <div className="space-y-6">
      {/* Module count */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">Aantal modules</span>
          <span className="text-xs text-muted-foreground">{moduleWidthCm.toFixed(0)} cm / module</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setModuleCount(moduleCount - 1)}
            disabled={moduleCount <= minModules}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <div className="flex-1 h-9 flex items-center justify-center rounded-md border bg-muted/40">
            <span className="text-lg font-semibold tabular-nums">{moduleCount}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setModuleCount(moduleCount + 1)}
            disabled={moduleCount >= maxModules}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Slot strip */}
      <div className="space-y-1.5">
        <span className="text-sm font-medium">Vakken</span>
        <div className="flex gap-1.5">
          {groups.map((group) => {
            if (group.type === 'single') {
              const m = group.module
              const isSelected = selectedSlot === m.slotIndex
              const hasLayout = m.layoutId !== null
              return (
                <button
                  key={m.slotIndex}
                  onClick={() => setSelectedSlot(m.slotIndex === selectedSlot ? null : m.slotIndex)}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border-2 transition-all',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : hasLayout
                        ? 'border-border bg-muted/50 text-foreground hover:border-primary/40'
                        : 'border-dashed border-border text-muted-foreground hover:border-primary/30',
                  )}
                >
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isSelected ? 'bg-primary-foreground' : hasLayout ? 'bg-primary' : 'bg-border',
                  )} />
                  <span className="text-[11px] font-medium leading-none">{m.slotIndex + 1}</span>
                </button>
              )
            }

            // Double group — two joined buttons
            const { primary, secondary } = group
            const isPrimarySelected = selectedSlot === primary.slotIndex
            const isSecondarySelected = selectedSlot === secondary.slotIndex
            return (
              <div key={primary.slotIndex} className="flex-[2] flex">
                <button
                  onClick={() => setSelectedSlot(primary.slotIndex === selectedSlot ? null : primary.slotIndex)}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-l-lg border-2 border-r-0 transition-all',
                    isPrimarySelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-primary/40 bg-primary/5 text-foreground hover:border-primary/60 hover:bg-primary/10',
                  )}
                >
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isPrimarySelected ? 'bg-primary-foreground' : 'bg-primary/60',
                  )} />
                  <span className="text-[11px] font-medium leading-none">{primary.slotIndex + 1}</span>
                </button>
                <button
                  onClick={() => setSelectedSlot(secondary.slotIndex === selectedSlot ? null : secondary.slotIndex)}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-r-lg border-2 transition-all',
                    isSecondarySelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-primary/40 bg-primary/5 text-foreground hover:border-primary/60 hover:bg-primary/10',
                  )}
                >
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isSecondarySelected ? 'bg-primary-foreground' : 'bg-primary/60',
                  )} />
                  <span className="text-[11px] font-medium leading-none">{secondary.slotIndex + 1}</span>
                </button>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">Selecteer een vak om de indeling in te stellen</p>
      </div>

      {/* Layout picker + toggles for selected slot */}
      {selectedSlot !== null && (
        <div className="space-y-4">
          {isCoveredSlot ? (
            <p className="text-xs text-muted-foreground">
              Dit vak maakt deel uit van een dubbel module.
            </p>
          ) : (
            <>
              {/* Deur + Dubbel options */}
              <div className="flex gap-2">
                {/* Deur */}
                <div className="flex-1 space-y-1.5">
                  <span className="text-sm font-medium">Deur</span>
                  <div className="flex rounded-lg border overflow-hidden">
                    <button
                      onClick={() => { if (!modules[selectedSlot]?.hasDoor) toggleModuleDoor(selectedSlot) }}
                      className={cn(
                        'flex-1 py-2 text-sm font-medium transition-all',
                        modules[selectedSlot]?.hasDoor
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-muted/60',
                      )}
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => { if (modules[selectedSlot]?.hasDoor) toggleModuleDoor(selectedSlot) }}
                      className={cn(
                        'flex-1 py-2 text-sm font-medium border-l transition-all',
                        !modules[selectedSlot]?.hasDoor
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-muted/60',
                      )}
                    >
                      Nee
                    </button>
                  </div>
                </div>

                {/* Dubbel */}
                {canBeDouble && (
                  <div className="flex-1 space-y-1.5">
                    <span className="text-sm font-medium">Dubbele module?</span>
                    <div className="flex rounded-lg border overflow-hidden">
                      <button
                        onClick={() => { if (!isDouble) setModuleSpan(selectedSlot, 2) }}
                        className={cn(
                          'flex-1 py-2 text-sm font-medium transition-all',
                          isDouble
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background text-muted-foreground hover:bg-muted/60',
                        )}
                      >
                        Ja
                      </button>
                      <button
                        onClick={() => { if (isDouble) setModuleSpan(selectedSlot, 1) }}
                        className={cn(
                          'flex-1 py-2 text-sm font-medium border-l transition-all',
                          !isDouble
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background text-muted-foreground hover:bg-muted/60',
                        )}
                      >
                        Nee
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Layout picker */}
              <div className="space-y-2">
                <span className="text-md font-medium">Indeling</span>
                <div className="flex gap-2 mt-2">
                  {MODULE_LAYOUTS.map((layout) => {
                    const LayoutSvg = LAYOUT_SVGS[layout.id]
                    const isActive = modules[selectedSlot]?.layoutId === layout.id
                    return (
                      <button
                        key={layout.id}
                        onClick={() => setModuleLayout(selectedSlot, layout.id)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all',
                          isActive
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/50',
                        )}
                      >
                        {LayoutSvg && <LayoutSvg className="h-30 w-auto" />}
                        {/* <span className="text-[10px] font-medium leading-snug text-center">{layout.label}</span> */}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
