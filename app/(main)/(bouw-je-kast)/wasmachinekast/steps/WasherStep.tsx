'use client'

import { useState } from 'react'
import { useWasmachinekastStore } from '../store'
import { WASHER_LAYOUTS } from '../moduleLayouts'
import { WashingMachine } from 'lucide-react'
import { cn } from '@/lib/utils'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  )
}

const WASHER_DOUBLE_ID = 12

export default function WasherStep() {
  const modules = useWasmachinekastStore((s) => s.modules)
  const moduleCount = useWasmachinekastStore((s) => s.moduleCount)
  const setWasherModule = useWasmachinekastStore((s) => s.setWasherModule)
  const nextStep = useWasmachinekastStore((s) => s.nextStep)

  const [selectedLayoutId, setSelectedLayoutId] = useState<number | null>(null)
  const isDouble = selectedLayoutId === WASHER_DOUBLE_ID

  function handleSelectSlot(slotIndex: number) {
    if (selectedLayoutId === null) return
    setWasherModule(slotIndex, selectedLayoutId)
    nextStep()
  }

  function isSlotAvailable(slotIndex: number): boolean {
    if (isDouble && slotIndex >= modules.length - 1) return false
    return true
  }

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <SectionHeading>Wasmachine type</SectionHeading>
        <div className="flex flex-col gap-3">
          {WASHER_LAYOUTS.map((layout) => {
            const available = layout.layoutId === WASHER_DOUBLE_ID
              ? moduleCount >= 2
              : true
            const isSelected = selectedLayoutId === layout.layoutId
            return (
              <button
                key={layout.layoutId}
                disabled={!available}
                onClick={() => setSelectedLayoutId(layout.layoutId)}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : available
                      ? 'border-border hover:border-primary/50'
                      : 'border-border/30 opacity-40 cursor-not-allowed',
                )}
              >
                <WashingMachine className="w-8 h-8 shrink-0 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{layout.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{layout.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {selectedLayoutId !== null && (
        <section className="space-y-5">
          <div>
            <SectionHeading>Selecteer een vak</SectionHeading>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {isDouble
                ? 'Kies het eerste vak — het volgende vak wordt automatisch ook geselecteerd'
                : 'Kies het vak voor je wasmachine'}
            </p>
          </div>
          <div className="grid grid-cols-8 gap-1">
            {modules.map((m) => {
              const available = isSlotAvailable(m.slotIndex)
              return (
                <button
                  key={m.slotIndex}
                  disabled={!available}
                  onClick={() => handleSelectSlot(m.slotIndex)}
                  className={cn(
                    'aspect-square flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                    available
                      ? 'border border-border/50 bg-transparent text-foreground hover:border-primary hover:bg-primary/5'
                      : 'border border-border/30 bg-transparent text-muted-foreground opacity-40 cursor-not-allowed',
                  )}
                >
                  {isDouble ? `${m.slotIndex + 1}+${m.slotIndex + 2}` : m.slotIndex + 1}
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
