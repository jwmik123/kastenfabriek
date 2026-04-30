'use client'

import { useState, useEffect } from 'react'
import { useWasmachinekastStore } from '../store'
import { WASHER_LAYOUTS } from '../moduleLayouts'
import { WashingMachine, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  )
}

export default function WasherStep() {
  const modules = useWasmachinekastStore((s) => s.modules)
  const washerModules = useWasmachinekastStore((s) => s.washerModules)
  const addWasherModule = useWasmachinekastStore((s) => s.addWasherModule)
  const removeWasherModule = useWasmachinekastStore((s) => s.removeWasherModule)
  const setHoveredSlot = useWasmachinekastStore((s) => s.setHoveredSlot)

  useEffect(() => () => { setHoveredSlot(null) }, [setHoveredSlot])

  const [adding, setAdding] = useState(false)
  const [selectedLayoutId, setSelectedLayoutId] = useState<number | null>(null)

  const washerSlots = new Set(washerModules.map((w) => w.slotIndex))

  function handleSelectSlot(slotIndex: number) {
    if (selectedLayoutId === null) return
    addWasherModule(slotIndex, selectedLayoutId)
    setAdding(false)
    setSelectedLayoutId(null)
    setHoveredSlot(null)
  }

  function handleCancel() {
    setAdding(false)
    setSelectedLayoutId(null)
    setHoveredSlot(null)
  }

  const availableSlots = modules.filter((m) => !washerSlots.has(m.slotIndex))

  return (
    <div className="space-y-8">

      {/* Placed washers list */}
      {washerModules.length > 0 && (
        <section className="space-y-3">
          <SectionHeading>Geplaatste wasmachine modules</SectionHeading>
          <div className="flex flex-col gap-2">
            {washerModules.map((w) => {
              const layout = WASHER_LAYOUTS.find((l) => l.layoutId === w.layoutId)
              return (
                <div
                  key={w.slotIndex}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    <WashingMachine className="w-5 h-5 shrink-0 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{layout?.name ?? `Layout ${w.layoutId}`}</div>
                      <div className="text-xs text-muted-foreground">Vak {w.slotIndex + 1}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeWasherModule(w.slotIndex)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Add flow */}
      {adding ? (
        <section className="space-y-6">

          {/* Type picker */}
          <div className="space-y-3">
            <SectionHeading>Kies een type</SectionHeading>
            <div className="flex flex-col gap-3">
              {WASHER_LAYOUTS.map((layout) => {
                const isSelected = selectedLayoutId === layout.layoutId
                return (
                  <button
                    key={layout.layoutId}
                    onClick={() => setSelectedLayoutId(layout.layoutId)}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50',
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
          </div>

          {/* Slot picker */}
          {selectedLayoutId !== null && (
            <div className="space-y-3">
              <SectionHeading>Kies een vak</SectionHeading>
              <div className="grid grid-cols-8 gap-1">
                {modules.map((m) => {
                  const taken = washerSlots.has(m.slotIndex)
                  return (
                    <button
                      key={m.slotIndex}
                      disabled={taken}
                      onClick={() => handleSelectSlot(m.slotIndex)}
                      onMouseEnter={() => !taken && setHoveredSlot(m.slotIndex)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      className={cn(
                        'aspect-square flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                        taken
                          ? 'border border-border/30 bg-muted/20 text-muted-foreground opacity-40 cursor-not-allowed'
                          : 'border border-border/50 bg-transparent text-foreground hover:border-primary hover:bg-primary/5',
                      )}
                    >
                      {m.slotIndex + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <button
            onClick={handleCancel}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Annuleren
          </button>
        </section>
      ) : (
        <button
          disabled={availableSlots.length === 0}
          onClick={() => setAdding(true)}
          className={cn(
            'flex items-center gap-2 w-full p-4 rounded-lg border-2 border-dashed transition-all text-sm font-medium',
            availableSlots.length > 0
              ? 'border-border hover:border-primary/50 hover:bg-primary/5 text-foreground'
              : 'border-border/30 text-muted-foreground opacity-40 cursor-not-allowed',
          )}
        >
          <Plus className="w-4 h-4" />
          Voeg nog een machine module toe
        </button>
      )}
    </div>
  )
}
