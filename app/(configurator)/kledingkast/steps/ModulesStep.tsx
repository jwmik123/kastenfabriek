'use client'

import { useMemo } from 'react'
import { useClosetStore } from '../store'
import { getDiagHeightAt, getBackDiagHeightAtZ } from '../scene/diagonalUtils'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'

const WALL = 0.018
const ONDERSTEL_HEIGHT = 0.108
const ONDERSTEL_GAP = 0.010
const MODULE_FLOOR_Y = ONDERSTEL_HEIGHT + ONDERSTEL_GAP

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  )
}

export default function ModulesStep() {
  const moduleCount    = useClosetStore((s) => s.moduleCount)
  const modules        = useClosetStore((s) => s.modules)
  const setModuleCount = useClosetStore((s) => s.setModuleCount)
  const minModules     = useClosetStore((s) => s.minModules())
  const maxModules     = useClosetStore((s) => s.maxModules())
  const moduleWidthCm  = useClosetStore((s) => s.moduleWidthCm())
  const selectedSlot        = useClosetStore((s) => s.selectedSlot)
  const setSelectedSlot     = useClosetStore((s) => s.setSelectedSlot)
  const doorsExtendToFloor  = useClosetStore((s) => s.doorsExtendToFloor)
  const setDoorsExtendToFloor = useClosetStore((s) => s.setDoorsExtendToFloor)

  const diagonalSide          = useClosetStore((s) => s.diagonalSide)
  const leftDiagStartHeight   = useClosetStore((s) => s.leftDiagStartHeight)
  const rightDiagStartHeight  = useClosetStore((s) => s.rightDiagStartHeight)
  const leftDiagTopWidth      = useClosetStore((s) => s.leftDiagTopWidth)
  const rightDiagTopWidth     = useClosetStore((s) => s.rightDiagTopWidth)
  const widthCm               = useClosetStore((s) => s.width)
  const mainHeightCm          = useClosetStore((s) => s.mainHeight())
  const widthM                = widthCm / 100
  const mainHeightM           = mainHeightCm / 100
  const closetHeightCm        = useClosetStore((s) => s.height)
  const backDiagonal          = useClosetStore((s) => s.backDiagonal)
  const sidePanelThickness    = useClosetStore((s) => s.sidePanelThickness)
  const backDiagKinkHeight    = useClosetStore((s) => s.backDiagKinkHeight)
  const backDiagFlatSectionDepth = useClosetStore((s) => s.backDiagFlatSectionDepth)
  const depthCm               = useClosetStore((s) => s.depth)

  const diagParams = useMemo(() => ({
    diagonalSide,
    leftDiagStartHeight:  Math.min(leftDiagStartHeight,  mainHeightCm - 20) / 100,
    rightDiagStartHeight: Math.min(rightDiagStartHeight, mainHeightCm - 20) / 100,
    leftDiagTopWidth:  leftDiagTopWidth  / 100,
    rightDiagTopWidth: rightDiagTopWidth / 100,
    outerWidth:        widthCm           / 100,
    mainHeight:        mainHeightM,
    closetHeight:      closetHeightCm    / 100,
    backDiagonal,
    backDiagKinkHeight:       backDiagKinkHeight       / 100,
    backDiagFlatSectionDepth: backDiagFlatSectionDepth / 100,
    outerDepth:               depthCm                  / 100,
    moduleCapY:               mainHeightM,
    sideWallThickness:        sidePanelThickness === '36mm' ? 0.036 : 0.018,
  }), [diagonalSide, leftDiagStartHeight, rightDiagStartHeight, leftDiagTopWidth, rightDiagTopWidth, widthCm, mainHeightCm, mainHeightM, closetHeightCm, backDiagonal, backDiagKinkHeight, backDiagFlatSectionDepth, depthCm, sidePanelThickness])

  // Retained for ModulePopover parity; not consumed in this panel after the
  // config card was lifted into the canvas popover (issue 031).
  const selectedSlotEffectiveHeightM = (() => {
    if (selectedSlot === null) return mainHeightM
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
  const canBeDouble = selectedSlot !== null && selectedSlot < modules.length - 1 &&
    (diagParams.backDiagonal || !isUnderDiagonal)

  return (
    <div className="space-y-10">

      {/* ── Section 1: Aantal modules ── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <SectionHeading>Aantal modules</SectionHeading>
          <span className="text-xs text-muted-foreground/60">
            {moduleWidthCm.toFixed(0)} cm per module
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModuleCount(moduleCount - 1)}
            disabled={moduleCount <= minModules}
            className={cn(
              'h-11 w-11 shrink-0 flex items-center justify-center rounded-md border border-border/50 bg-transparent transition-colors',
              'hover:bg-muted/60 hover:border-border',
              'disabled:opacity-40 disabled:pointer-events-none',
            )}
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="flex-1 h-11 flex items-center justify-center rounded-md bg-muted/40">
            <span className="text-xl font-medium tabular-nums">{moduleCount}</span>
          </div>

          <button
            onClick={() => setModuleCount(moduleCount + 1)}
            disabled={moduleCount >= maxModules}
            className={cn(
              'h-11 w-11 shrink-0 flex items-center justify-center rounded-md border border-border/50 bg-transparent transition-colors',
              'hover:bg-muted/60 hover:border-border',
              'disabled:opacity-40 disabled:pointer-events-none',
            )}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── Section 2: Vak instellen ── */}
      <section className="space-y-5">
        <div>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Selecteer een module om de indeling aan te passen
          </p>
        </div>

        {/* Bay selector grid */}
        <div className="grid grid-cols-8 gap-1">
          {modules.map((m) => {
            const isSelected = selectedSlot === m.slotIndex
            const isPartOfDouble = m.span === 2 || (m.slotIndex > 0 && modules[m.slotIndex - 1]?.span === 2)
            return (
              <button
                key={m.slotIndex}
                onClick={() => setSelectedSlot(m.slotIndex === selectedSlot ? null : m.slotIndex)}
                className={cn(
                  'aspect-square flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-0'
                    : isPartOfDouble
                      ? 'border border-border/50 bg-transparent text-foreground hover:border-border hover:bg-muted/40'
                      : 'border border-border/50 bg-transparent text-foreground hover:border-border hover:bg-muted/40',
                )}
              >
                {m.slotIndex + 1}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Section 3: Deuren tot de vloer ── */}
      <section className="space-y-5">
        <SectionHeading>Deuren tot de vloer</SectionHeading>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Deuren reiken tot 2 cm boven de vloer
          </span>
          <Toggle
            checked={doorsExtendToFloor}
            onCheckedChange={setDoorsExtendToFloor}
          />
        </div>
      </section>

    </div>
  )
}
