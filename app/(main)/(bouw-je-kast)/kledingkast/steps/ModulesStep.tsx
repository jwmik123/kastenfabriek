'use client'

import { useMemo } from 'react'
import { useClosetStore } from '../store'
import { MODULE_LAYOUTS } from '../scene/moduleLayouts'
import { LAYOUT_SVGS } from '../components/LayoutSvgs'
import { getDiagHeightAt } from '../scene/diagonalUtils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'
import type { ModuleSlot } from '../store'

const WALL = 0.018
const ONDERSTEL_HEIGHT = 0.108
const ONDERSTEL_GAP = 0.010
const MODULE_FLOOR_Y = ONDERSTEL_HEIGHT + ONDERSTEL_GAP

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

  const diagonalSide         = useClosetStore((s) => s.diagonalSide)
  const leftDiagStartHeight  = useClosetStore((s) => s.leftDiagStartHeight)
  const rightDiagStartHeight = useClosetStore((s) => s.rightDiagStartHeight)
  const leftDiagTopWidth     = useClosetStore((s) => s.leftDiagTopWidth)
  const rightDiagTopWidth    = useClosetStore((s) => s.rightDiagTopWidth)
  const widthCm              = useClosetStore((s) => s.width)
  const mainHeightCm         = useClosetStore((s) => s.mainHeight())
  const widthM               = widthCm / 100
  const mainHeightM          = mainHeightCm / 100

  const diagParams = useMemo(() => ({
    diagonalSide,
    leftDiagStartHeight:  Math.min(leftDiagStartHeight,  mainHeightCm - 20) / 100,
    rightDiagStartHeight: Math.min(rightDiagStartHeight, mainHeightCm - 20) / 100,
    leftDiagTopWidth:  leftDiagTopWidth  / 100,
    rightDiagTopWidth: rightDiagTopWidth / 100,
    outerWidth:        widthCm           / 100,
    mainHeight:        mainHeightM,
  }), [diagonalSide, leftDiagStartHeight, rightDiagStartHeight, leftDiagTopWidth, rightDiagTopWidth, widthCm, mainHeightCm, mainHeightM])

  const groups = groupModules(modules)

  const isCoveredSlot =
    selectedSlot !== null &&
    selectedSlot > 0 &&
    modules[selectedSlot - 1]?.span === 2

  const isDouble = selectedSlot !== null && modules[selectedSlot]?.span === 2

  // Effective height of the selected slot for diagonal layout filtering
  const selectedSlotEffectiveHeightM = (() => {
    if (selectedSlot === null || diagParams.diagonalSide === 'none') return mainHeightM
    const innerW = widthM - WALL * 2
    const slotW  = innerW / moduleCount
    const span   = modules[selectedSlot]?.span ?? 1
    const leftX  = WALL + selectedSlot * slotW
    const rightX = WALL + (selectedSlot + span) * slotW
    const leftH  = Math.max(0, getDiagHeightAt(leftX,  diagParams) - MODULE_FLOOR_Y - WALL)
    const rightH = Math.max(0, getDiagHeightAt(rightX, diagParams) - MODULE_FLOOR_Y - WALL)
    return Math.min(leftH, rightH)
  })()

  const isUnderDiagonal = selectedSlotEffectiveHeightM < mainHeightM - 0.01
  const canBeDouble = selectedSlot !== null && selectedSlot < modules.length - 1 && !isUnderDiagonal

  // Only show layouts whose special element fits within the effective height
  const availableLayouts = MODULE_LAYOUTS.filter(
    (l) => l.specialElement.height <= selectedSlotEffectiveHeightM
  )

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
                {isUnderDiagonal && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    Schuin vak — hoogte beperkt tot {Math.round(selectedSlotEffectiveHeightM * 100)} cm. Niet alle indelingen passen.
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  {availableLayouts.map((layout) => {
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
