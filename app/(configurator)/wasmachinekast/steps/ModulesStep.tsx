'use client'

import { useWasmachinekastStore } from '../store'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'
import { Lock, Minus, Plus } from 'lucide-react'

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
  const minModules = useWasmachinekastStore((s) => s.minModules())
  const maxModules = useWasmachinekastStore((s) => s.maxModules())
  const selectedSlot = useWasmachinekastStore((s) => s.selectedSlot)
  const setSelectedSlot = useWasmachinekastStore((s) => s.setSelectedSlot)
  const doorsExtendToFloor = useWasmachinekastStore((s) => s.doorsExtendToFloor)
  const setDoorsExtendToFloor = useWasmachinekastStore((s) => s.setDoorsExtendToFloor)
  const washerModules = useWasmachinekastStore((s) => s.washerModules)
  const washerSlots = new Set(washerModules.map((w) => w.slotIndex))

  return (
    <div className="space-y-10">

      {/* ── Aantal modules ── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <SectionHeading>Aantal modules</SectionHeading>
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
            const isWasherSlot = washerSlots.has(m.slotIndex)
            const isPartOfDouble = m.span === 2 || (m.slotIndex > 0 && modules[m.slotIndex - 1]?.span === 2)
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
