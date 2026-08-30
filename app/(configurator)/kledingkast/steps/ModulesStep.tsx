'use client'

import { useEffect, useRef } from 'react'
import { useClosetStore } from '../store'
import { useIsMobile } from '../../_shared/components/useIsMobile'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'
import ModuleConfigCard from '../components/ModuleConfigCard'

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
  const isMobile            = useIsMobile()
  const configCardRef       = useRef<HTMLDivElement>(null)
  const doorsExtendToFloor  = useClosetStore((s) => s.doorsExtendToFloor)
  const setDoorsExtendToFloor = useClosetStore((s) => s.setDoorsExtendToFloor)

  // The indeling step is about the interior — open the doors on entry so the
  // slots are visible. Closing them again while on this step stays respected.
  useEffect(() => {
    if (!useClosetStore.getState().doorsOpen) {
      useClosetStore.setState({ doorsOpen: true })
    }
  }, [])

  // Mobile: the inline config card sits below the fold, so reveal it on select.
  useEffect(() => {
    if (!isMobile || selectedSlot === null) return
    configCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [isMobile, selectedSlot])

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

        {/* Mobile: configure the selected slot inline (desktop uses the canvas popover) */}
        {selectedSlot !== null && (
          <div ref={configCardRef} className="md:hidden scroll-mt-4">
            <ModuleConfigCard />
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
