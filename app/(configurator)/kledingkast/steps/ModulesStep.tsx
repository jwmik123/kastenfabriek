'use client'

import { useMemo } from 'react'
import { useClosetStore } from '../store'
import { MODULE_LAYOUTS } from '../scene/moduleLayouts'
import { LAYOUT_SVGS } from '../components/LayoutSvgs'
import { getDiagHeightAt, getBackDiagHeightAtZ } from '../scene/diagonalUtils'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'
import Carousel from '../components/Carousel'

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
  const setModuleLayout = useClosetStore((s) => s.setModuleLayout)
  const setModuleSpan  = useClosetStore((s) => s.setModuleSpan)
  const toggleModuleDoor = useClosetStore((s) => s.toggleModuleDoor)
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
  }), [diagonalSide, leftDiagStartHeight, rightDiagStartHeight, leftDiagTopWidth, rightDiagTopWidth, widthCm, mainHeightCm, mainHeightM, closetHeightCm, backDiagonal, backDiagKinkHeight, backDiagFlatSectionDepth, depthCm])

  const isCoveredSlot =
    selectedSlot !== null &&
    selectedSlot > 0 &&
    modules[selectedSlot - 1]?.span === 2

  const isDouble = selectedSlot !== null && modules[selectedSlot]?.span === 2

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

  const availableLayouts = MODULE_LAYOUTS.filter(
    (l) => l.specialElement.height <= selectedSlotEffectiveHeightM
  )

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
          {/* <SectionHeading>Vak instellen</SectionHeading> */}
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

        {/* Config card for selected bay */}
        {selectedSlot !== null && (
          <div className="bg-muted/40 rounded-lg p-4 space-y-4">

            {/* Context chip row */}
            <div className="flex items-center gap-2 pb-3 border-b border-border/30">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                {selectedSlot + 1}
              </div>
              <span className="text-sm font-medium">Vak {selectedSlot + 1} instellen</span>
            </div>

            {isCoveredSlot ? (
              <p className="text-xs text-muted-foreground">
                Dit vak maakt deel uit van een dubbel module.
              </p>
            ) : (
              <>
                {/* Toggles row */}
                <div className="flex gap-5">
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-sm">Deur</span>
                    <Toggle
                      checked={modules[selectedSlot]?.hasDoor ?? false}
                      onCheckedChange={() => toggleModuleDoor(selectedSlot)}
                    />
                  </div>
                  {canBeDouble && (
                    <div className="flex items-center justify-between flex-1">
                      <span className="text-sm">Dubbele module</span>
                      <Toggle
                        checked={isDouble}
                        onCheckedChange={(v) => setModuleSpan(selectedSlot, v ? 2 : 1)}
                      />
                    </div>
                  )}
                </div>

                {/* Indeling carousel */}
                <div className="space-y-2.5">
                  {isUnderDiagonal && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      Schuin vak — hoogte beperkt tot {Math.round(selectedSlotEffectiveHeightM * 100)} cm. Niet alle indelingen passen.
                    </p>
                  )}
                  <Carousel
                    items={availableLayouts.map((l) => ({ ...l, id: String(l.id) }))}
                    activeId={modules[selectedSlot]?.layoutId != null ? String(modules[selectedSlot].layoutId) : null}
                    renderItem={(layout, isActive) => {
                      const LayoutSvg = LAYOUT_SVGS[Number(layout.id)]
                      return (
                        <button
                          onClick={() => setModuleLayout(selectedSlot!, Number(layout.id))}
                          style={{ aspectRatio: '1' }}
                          className={cn(
                            'w-full flex items-center justify-center rounded-md transition-all py-2',
                            isActive
                              ? 'bg-primary text-primary-foreground border-2 border-primary'
                              : 'bg-background text-foreground border border-border/50 hover:border-primary',
                          )}
                        >
                          {LayoutSvg && <LayoutSvg className="w-1/4 h-auto" />}
                        </button>
                      )
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}
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
