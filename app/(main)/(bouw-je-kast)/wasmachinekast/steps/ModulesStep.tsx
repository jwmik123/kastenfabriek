'use client'

import { useWasmachinekastStore } from '../store'
import { isLayoutAvailable } from '../moduleLayouts'
import { LAYOUT_SVGS } from '../../kledingkast/components/LayoutSvgs'
import Carousel from '../../kledingkast/components/Carousel'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'
import { Minus, Plus, WashingMachine } from 'lucide-react'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  )
}

export default function ModulesStep() {
  const moduleCount = useWasmachinekastStore((s) => s.moduleCount)
  const modules = useWasmachinekastStore((s) => s.modules)
  const setModuleCount = useWasmachinekastStore((s) => s.setModuleCount)
  const setModuleLayout = useWasmachinekastStore((s) => s.setModuleLayout)
  const setModuleSpan = useWasmachinekastStore((s) => s.setModuleSpan)
  const toggleModuleDoor = useWasmachinekastStore((s) => s.toggleModuleDoor)
  const minModules = useWasmachinekastStore((s) => s.minModules())
  const maxModules = useWasmachinekastStore((s) => s.maxModules())
  const moduleWidthCm = useWasmachinekastStore((s) => s.moduleWidthCm())
  const selectedSlot = useWasmachinekastStore((s) => s.selectedSlot)
  const setSelectedSlot = useWasmachinekastStore((s) => s.setSelectedSlot)
  const doorsExtendToFloor = useWasmachinekastStore((s) => s.doorsExtendToFloor)
  const setDoorsExtendToFloor = useWasmachinekastStore((s) => s.setDoorsExtendToFloor)
  const moduleLayouts = useWasmachinekastStore((s) => s.moduleLayouts)

  const isCoveredSlot =
    selectedSlot !== null &&
    selectedSlot > 0 &&
    modules[selectedSlot - 1]?.span === 2

  const isDouble = selectedSlot !== null && modules[selectedSlot]?.span === 2
  const canBeDouble = selectedSlot !== null && selectedSlot < modules.length - 1

  return (
    <div className="space-y-10">

      {/* ── Aantal modules ── */}
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

      {/* ── Vak instellen ── */}
      <section className="space-y-5">
        <div>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Selecteer een module om de indeling aan te passen
          </p>
        </div>

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

        {selectedSlot !== null && (
          <div className="bg-muted/40 rounded-lg p-4 space-y-4">
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

                <div className="space-y-2.5">
                  <Carousel
                    items={moduleLayouts.map((l) => ({ ...l, id: String(l.layoutId) }))}
                    activeId={modules[selectedSlot]?.layoutId != null ? String(modules[selectedSlot].layoutId) : null}
                    renderItem={(layout, isActive) => {
                      const lid = Number(layout.id)
                      const available = isLayoutAvailable(
                        moduleLayouts.find((l) => l.layoutId === lid) ?? { layoutId: lid, name: '', description: '', contents: { shelves: 0, rods: 0, drawers: 0 }, priceDouble: 0, priceSingle: 0, availableForTopCabinet: false },
                        moduleWidthCm,
                      )
                      const LayoutSvg = LAYOUT_SVGS[lid]
                      const isWasher = layout.layoutId ? layout.layoutId >= 100 : false

                      return (
                        <button
                          onClick={() => available && setModuleLayout(selectedSlot!, lid)}
                          disabled={!available}
                          title={!available && layout.minSlotWidth ? `Minimaal ${layout.minSlotWidth} cm breed` : undefined}
                          style={{ aspectRatio: '1' }}
                          className={cn(
                            'w-full flex flex-col items-center justify-center rounded-md transition-all py-2 gap-1',
                            isActive
                              ? 'bg-primary text-primary-foreground border-2 border-primary'
                              : available
                                ? 'bg-background text-foreground border border-border/50 hover:border-primary'
                                : 'bg-background text-muted-foreground border border-border/30 opacity-40 cursor-not-allowed',
                          )}
                        >
                          {isWasher ? (
                            <WashingMachine className="w-1/3 h-auto" />
                          ) : LayoutSvg ? (
                            <LayoutSvg className="w-1/4 h-auto" />
                          ) : (
                            <span className="text-[10px] text-center px-1 leading-tight">{layout.name}</span>
                          )}
                        </button>
                      )
                    }}
                  />
                  {moduleLayouts.some((l) => l.minSlotWidth && moduleWidthCm < l.minSlotWidth) && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      Vergroot de breedte of verklein het aantal modules voor wasmachine-indelingen.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* ── Deuren tot de vloer ── */}
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
