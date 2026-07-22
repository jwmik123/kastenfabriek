'use client'

import { useEffect, useRef } from 'react'
import { useWasmachinekastStore } from '../store'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'
import { Lock, Minus, Plus } from 'lucide-react'
import ModuleConfigCard from '../components/ModuleConfigCard'
import { useIsMobile } from '../../_shared/components/useIsMobile'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  )
}

export default function ModulesStep() {
  const layout = useWasmachinekastStore((s) => s.layout)
  const isDual = layout === 'low-left' || layout === 'low-right'
  const activeModulesSection = useWasmachinekastStore((s) => s.activeModulesSection)
  const setActiveModulesSection = useWasmachinekastStore((s) => s.setActiveModulesSection)

  // Top-level (= high in dual, low in low-only, single section otherwise)
  const moduleCount = useWasmachinekastStore((s) => s.moduleCount)
  const modules = useWasmachinekastStore((s) => s.modules)
  const setModuleCount = useWasmachinekastStore((s) => s.setModuleCount)
  const minModules = useWasmachinekastStore((s) => s.minModules())
  const maxModules = useWasmachinekastStore((s) => s.maxModules())

  const lowSection = useWasmachinekastStore((s) => s.lowSection)
  const setLowSectionModuleCount = useWasmachinekastStore((s) => s.setLowSectionModuleCount)
  const constraints = useWasmachinekastStore((s) => s.constraints)
  const sc = constraints?.singleCorpus
  const lowMinModules = lowSection
    ? Math.max(1, Math.ceil(lowSection.width / (sc?.maxWidth ?? 65)))
    : 1
  const lowMaxModules = lowSection ? Math.floor(lowSection.width / (sc?.minWidth ?? 15)) : 1

  const selectedSlot = useWasmachinekastStore((s) => s.selectedSlot)
  const setSelectedSlot = useWasmachinekastStore((s) => s.setSelectedSlot)
  const isMobile = useIsMobile()
  const configCardRef = useRef<HTMLDivElement>(null)
  const doorsExtendToFloor = useWasmachinekastStore((s) => s.doorsExtendToFloor)
  const setDoorsExtendToFloor = useWasmachinekastStore((s) => s.setDoorsExtendToFloor)
  const washerModules = useWasmachinekastStore((s) => s.washerModules)
  const washerSection = useWasmachinekastStore((s) => s.washerSection)

  // Resolve the section we're editing
  const editingLow = isDual && activeModulesSection === 'low'
  const editingModules = editingLow ? lowSection?.modules ?? [] : modules
  const editingModuleCount = editingLow ? lowSection?.moduleCount ?? 0 : moduleCount
  const editingMin = editingLow ? lowMinModules : minModules
  const editingMax = editingLow ? lowMaxModules : maxModules
  const editingSetCount = editingLow ? setLowSectionModuleCount : setModuleCount

  // Washer slots only apply in the section that hosts them
  const washerLocksThisSection =
    washerSection === 'high' && !editingLow ||
    washerSection === 'low' && editingLow ||
    (layout === 'low-only' && washerSection === 'low')
  const washerSlots = new Set(washerLocksThisSection ? washerModules.map((w) => w.slotIndex) : [])

  // Mobile: the inline config card sits below the fold, so reveal it on select.
  useEffect(() => {
    if (!isMobile || selectedSlot === null) return
    configCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [isMobile, selectedSlot])

  return (
    <div className="space-y-10">
      {isDual && (
        <section className="space-y-3">
          <div className="flex rounded-md border border-border overflow-hidden text-sm font-medium">
            <button
              onClick={() => setActiveModulesSection('high')}
              className={cn(
                'flex-1 py-2 transition-colors',
                activeModulesSection === 'high' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              Hoge kast
            </button>
            <button
              onClick={() => setActiveModulesSection('low')}
              className={cn(
                'flex-1 py-2 transition-colors border-l border-border',
                activeModulesSection === 'low' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              Lage kast
            </button>
          </div>
        </section>
      )}

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <SectionHeading>Aantal modules</SectionHeading>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => editingSetCount(editingModuleCount - 1)}
            disabled={editingModuleCount <= editingMin}
            className={cn(
              'h-11 w-11 shrink-0 flex items-center justify-center rounded-md border border-border/50 bg-transparent transition-colors',
              'hover:bg-muted/60 hover:border-border',
              'disabled:opacity-40 disabled:pointer-events-none',
            )}
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="flex-1 h-11 flex items-center justify-center rounded-md bg-muted/40">
            <span className="text-xl font-medium tabular-nums">{editingModuleCount}</span>
          </div>

          <button
            onClick={() => editingSetCount(editingModuleCount + 1)}
            disabled={editingModuleCount >= editingMax}
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

      <section className="space-y-5">
        <div>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Selecteer een module om de indeling aan te passen
          </p>
        </div>

        <div className="grid grid-cols-8 gap-1">
          {editingModules.map((m) => {
            const isSelected = selectedSlot === m.slotIndex
            const isWasherSlot = washerSlots.has(m.slotIndex)
            const isPartOfDouble = m.span === 2 || (m.slotIndex > 0 && editingModules[m.slotIndex - 1]?.span === 2)
            return (
              <button
                key={m.slotIndex}
                onClick={() => {
                  if (isWasherSlot) return
                  setSelectedSlot(m.slotIndex === selectedSlot ? null : m.slotIndex)
                }}
                className={cn(
                  'aspect-square flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                  isWasherSlot
                    ? 'border border-border/50 bg-muted/20 text-muted-foreground opacity-60 cursor-not-allowed'
                    : isSelected
                      ? 'bg-primary text-primary-foreground border-0'
                      : isPartOfDouble
                        ? 'border border-border/50 bg-transparent text-foreground hover:border-border hover:bg-muted/40'
                        : 'border border-border/50 bg-transparent text-foreground hover:border-border hover:bg-muted/40',
                )}
              >
                {isWasherSlot ? <Lock className="w-3 h-3" /> : m.slotIndex + 1}
              </button>
            )
          })}
        </div>

        {/* Mobile: configure the selected slot inline (desktop uses the canvas popover) */}
        {selectedSlot !== null && (
          <div ref={configCardRef} className="md:hidden scroll-mt-4">
            <ModuleConfigCard />
          </div>
        )}
      </section>

      <section className="space-y-5">
        <SectionHeading>Deuren tot de vloer</SectionHeading>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Deuren en lades reiken tot 2 cm boven de vloer
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
