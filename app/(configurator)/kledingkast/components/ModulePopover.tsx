'use client'

import { useEffect, useMemo, useRef } from 'react'
import { X } from 'lucide-react'
import { useClosetStore } from '../store'
import { MODULE_LAYOUTS } from '../scene/moduleLayouts'
import { LAYOUT_SVGS } from './LayoutSvgs'
import { getDiagHeightAt, getBackDiagHeightAtZ } from '../scene/diagonalUtils'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'

const WALL = 0.018
const ONDERSTEL_HEIGHT = 0.108
const ONDERSTEL_GAP = 0.010
const MODULE_FLOOR_Y = ONDERSTEL_HEIGHT + ONDERSTEL_GAP
const MODULES_STEP = 2

export default function ModulePopover() {
  const step             = useClosetStore((s) => s.step)
  const selectedSlot     = useClosetStore((s) => s.selectedSlot)
  const setSelectedSlot  = useClosetStore((s) => s.setSelectedSlot)
  const setModuleLayout  = useClosetStore((s) => s.setModuleLayout)
  const setModuleSpan    = useClosetStore((s) => s.setModuleSpan)
  const toggleModuleDoor = useClosetStore((s) => s.toggleModuleDoor)
  const modules          = useClosetStore((s) => s.modules)
  const moduleCount      = useClosetStore((s) => s.moduleCount)

  const diagonalSide          = useClosetStore((s) => s.diagonalSide)
  const leftDiagStartHeight   = useClosetStore((s) => s.leftDiagStartHeight)
  const rightDiagStartHeight  = useClosetStore((s) => s.rightDiagStartHeight)
  const leftDiagTopWidth      = useClosetStore((s) => s.leftDiagTopWidth)
  const rightDiagTopWidth     = useClosetStore((s) => s.rightDiagTopWidth)
  const widthCm               = useClosetStore((s) => s.width)
  const mainHeightCm          = useClosetStore((s) => s.mainHeight())
  const closetHeightCm        = useClosetStore((s) => s.height)
  const backDiagonal          = useClosetStore((s) => s.backDiagonal)
  const backDiagKinkHeight    = useClosetStore((s) => s.backDiagKinkHeight)
  const backDiagFlatSectionDepth = useClosetStore((s) => s.backDiagFlatSectionDepth)
  const depthCm               = useClosetStore((s) => s.depth)

  const ref = useRef<HTMLDivElement>(null)

  const isActive = step === MODULES_STEP && selectedSlot !== null

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

  const widthM = widthCm / 100
  const mainHeightM = mainHeightCm / 100

  const diagParams = useMemo(() => ({
    diagonalSide,
    leftDiagStartHeight:  Math.min(leftDiagStartHeight,  mainHeightCm - 20) / 100,
    rightDiagStartHeight: Math.min(rightDiagStartHeight, mainHeightCm - 20) / 100,
    leftDiagTopWidth:  leftDiagTopWidth  / 100,
    rightDiagTopWidth: rightDiagTopWidth / 100,
    outerWidth:        widthM,
    mainHeight:        mainHeightM,
    closetHeight:      closetHeightCm    / 100,
    backDiagonal,
    backDiagKinkHeight:       backDiagKinkHeight       / 100,
    backDiagFlatSectionDepth: backDiagFlatSectionDepth / 100,
    outerDepth:               depthCm                  / 100,
  }), [diagonalSide, leftDiagStartHeight, rightDiagStartHeight, leftDiagTopWidth, rightDiagTopWidth, widthM, mainHeightCm, mainHeightM, closetHeightCm, backDiagonal, backDiagKinkHeight, backDiagFlatSectionDepth, depthCm])

  if (!isActive || selectedSlot === null) return null

  const isCoveredSlot =
    selectedSlot > 0 && modules[selectedSlot - 1]?.span === 2
  const isDouble = modules[selectedSlot]?.span === 2

  const selectedSlotEffectiveHeightM = (() => {
    if (diagParams.backDiagonal) {
      return Math.max(0, Math.min(getBackDiagHeightAtZ(WALL, diagParams), diagParams.mainHeight) - MODULE_FLOOR_Y - WALL)
    }
    if (diagParams.diagonalSide === 'none') return mainHeightM
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
  const canBeDouble = selectedSlot < modules.length - 1 &&
    (diagParams.backDiagonal || !isUnderDiagonal)

  const availableLayouts = MODULE_LAYOUTS.filter(
    (l) => l.specialElement.height <= selectedSlotEffectiveHeightM
  )

  // Approximate horizontal position above the bay: percentage along the canvas
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

          <div className="space-y-2">
            {isUnderDiagonal && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                Schuin vak — hoogte beperkt tot {Math.round(selectedSlotEffectiveHeightM * 100)} cm.
              </p>
            )}
            <div
              data-testid="module-popover-layout-picker"
              className="grid grid-cols-4 gap-2"
            >
              {availableLayouts.map((layout) => {
                const LayoutSvg = LAYOUT_SVGS[layout.id]
                const active = activeLayoutId === layout.id
                return (
                  <button
                    key={layout.id}
                    type="button"
                    data-layout-id={layout.id}
                    onClick={() => setModuleLayout(selectedSlot, layout.id)}
                    style={{ aspectRatio: '1' }}
                    className={cn(
                      'flex items-center justify-center rounded-md transition-all py-2',
                      active
                        ? 'bg-primary text-primary-foreground border-2 border-primary'
                        : 'bg-background text-foreground border border-border/50 hover:border-primary',
                    )}
                  >
                    {LayoutSvg && <LayoutSvg className="w-1/3 h-auto" />}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
