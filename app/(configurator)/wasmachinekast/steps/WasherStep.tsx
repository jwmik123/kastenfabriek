'use client'

import { useState, useEffect } from 'react'
import { useWasmachinekastStore } from '../store'
import { WASHER_LAYOUTS } from '../moduleLayouts'
import { filterForSection } from '../sections/wasmModuleLayoutFilter'
import { WashingMachine, Trash2, Plus } from 'lucide-react'
import { WASHER_LAYOUT_SVGS, WASHER_TYPE_SVGS } from '../components/WasherLayoutSvgs'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  )
}

function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 space-y-4">
        <h3 className="text-base font-semibold">Wasmachine sectie wijzigen?</h3>
        <p className="text-sm text-muted-foreground">
          Dit verwijdert je huidige wasmachine plaatsingen. Doorgaan?
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 text-sm rounded-md border border-border hover:bg-muted"
          >
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Doorgaan
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WasherStep() {
  const topModules = useWasmachinekastStore((s) => s.modules)
  const lowSection = useWasmachinekastStore((s) => s.lowSection)
  const washerModules = useWasmachinekastStore((s) => s.washerModules)
  const addWasherModule = useWasmachinekastStore((s) => s.addWasherModule)
  const removeWasherModule = useWasmachinekastStore((s) => s.removeWasherModule)
  const canPlaceWasher = useWasmachinekastStore((s) => s.canPlaceWasher)
  const setHoveredSlot = useWasmachinekastStore((s) => s.setHoveredSlot)
  const washerSection = useWasmachinekastStore((s) => s.washerSection)
  const setWasherSection = useWasmachinekastStore((s) => s.setWasherSection)
  const layout = useWasmachinekastStore((s) => s.layout)
  const isLowOnly = layout === 'low-only'
  const isDual = layout === 'low-left' || layout === 'low-right'
  const lowDisabled = !isLowOnly && lowSection === null
  const activeSection: 'high' | 'low' =
    isLowOnly || washerSection === 'low' ? 'low' : 'high'

  // In dual layout with washerSection='low', the slot grid binds to lowSection.
  // In low-only the top-level already IS the low section.
  const editingFromLowSection = isDual && activeSection === 'low'
  const editingModules = editingFromLowSection ? lowSection?.modules ?? [] : topModules

  useEffect(() => {
    if (isLowOnly && washerSection !== 'low') setWasherSection('low')
  }, [isLowOnly, washerSection, setWasherSection])

  const availableWasherLayouts = filterForSection(WASHER_LAYOUTS, activeSection)
  const hasUsableWasher = availableWasherLayouts.length > 0

  useEffect(() => () => { setHoveredSlot(null) }, [setHoveredSlot])

  const [adding, setAdding] = useState(false)
  const [selectedLayoutId, setSelectedLayoutId] = useState<number | null>(null)
  const [pendingSection, setPendingSection] = useState<'high' | 'low' | null>(null)

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

  function requestSection(target: 'high' | 'low') {
    if (target === activeSection) return
    if (washerModules.length > 0) {
      setPendingSection(target)
    } else {
      setWasherSection(target)
    }
  }

  const availableSlots = editingModules.filter((m) => !washerSlots.has(m.slotIndex))

  return (
    <div className="space-y-8">

      <section className="space-y-3">
        <SectionHeading>Waar wens je de wastoestellen te plaatsen?</SectionHeading>
        <div className="flex rounded-md border border-border overflow-hidden text-sm font-medium">
          <button
            type="button"
            disabled={isLowOnly}
            onClick={() => !isLowOnly && requestSection('high')}
            className={cn(
              'flex-1 py-2 transition-colors',
              activeSection === 'high'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted',
              isLowOnly && 'opacity-40 cursor-not-allowed hover:bg-transparent',
            )}
          >
            Hoge kast
          </button>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex-1">
                  <button
                    type="button"
                    disabled={lowDisabled}
                    onClick={() => requestSection('low')}
                    className={cn(
                      'w-full py-2 transition-colors border-l border-border',
                      activeSection === 'low'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted',
                      lowDisabled && 'opacity-40 cursor-not-allowed hover:bg-transparent',
                    )}
                  >
                    Lage kast
                  </button>
                </span>
              </TooltipTrigger>
              {lowDisabled && (
                <TooltipContent>Geen lage kast in deze layout</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </section>

      {washerModules.length > 0 && (
        <section className="space-y-3">
          <SectionHeading>Geplaatste wasmachine modules</SectionHeading>
          <div className="flex flex-col gap-2">
            {washerModules.map((w) => {
              const layout = WASHER_LAYOUTS.find((l) => l.layoutId === w.layoutId)
              const PlacedSvg = WASHER_TYPE_SVGS[w.layoutId] ?? WASHER_LAYOUT_SVGS[w.layoutId]
              return (
                <div
                  key={w.slotIndex}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    {PlacedSvg ? (
                      <PlacedSvg className="h-14 w-auto shrink-0 text-muted-foreground" />
                    ) : (
                      <WashingMachine className="w-5 h-5 shrink-0 text-muted-foreground" />
                    )}
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

      {!hasUsableWasher && (
        <div className="text-sm text-muted-foreground p-3 border border-border/60 rounded-md">
          Geen wasmachine-GLB beschikbaar voor deze sectie
        </div>
      )}

      {hasUsableWasher && adding ? (
        <section className="space-y-6">
          <div className="space-y-3">
            <SectionHeading>Kies een type</SectionHeading>
            <div className="flex flex-col gap-3">
              {availableWasherLayouts.map((layout) => {
                const isSelected = selectedLayoutId === layout.layoutId
                const LayoutSvg =
                  WASHER_TYPE_SVGS[layout.layoutId] ?? WASHER_LAYOUT_SVGS[layout.layoutId]
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
                    {LayoutSvg ? (
                      <LayoutSvg className="h-24 w-auto shrink-0 text-muted-foreground" />
                    ) : (
                      <WashingMachine className="w-8 h-8 shrink-0 text-muted-foreground" />
                    )}
                    <div className="text-sm font-medium">{layout.name}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {selectedLayoutId !== null && (
            <div className="space-y-3">
              <SectionHeading>Kies een vak</SectionHeading>
              <div className="grid grid-cols-8 gap-1">
                {editingModules.map((m) => {
                  const taken = washerSlots.has(m.slotIndex)
                  const fits = !taken && canPlaceWasher(m.slotIndex, selectedLayoutId)
                  const disabled = taken || !fits
                  return (
                    <button
                      key={m.slotIndex}
                      disabled={disabled}
                      title={!taken && !fits ? 'Niet genoeg ruimte voor nog een wasmachine in deze sectie' : undefined}
                      onClick={() => handleSelectSlot(m.slotIndex)}
                      onMouseEnter={() => !disabled && setHoveredSlot(m.slotIndex)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      className={cn(
                        'aspect-square flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                        disabled
                          ? 'border border-border/30 bg-muted/20 text-muted-foreground opacity-40 cursor-not-allowed'
                          : 'border border-border/50 bg-transparent text-foreground hover:border-primary hover:bg-primary/5',
                      )}
                    >
                      {m.slotIndex + 1}
                    </button>
                  )
                })}
              </div>
              {selectedLayoutId !== null && editingModules.every((m) => washerSlots.has(m.slotIndex) || !canPlaceWasher(m.slotIndex, selectedLayoutId)) && (
                <p className="text-xs text-muted-foreground">
                  Geen vrij vak met genoeg ruimte voor nog een wasmachine.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleCancel}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Annuleren
          </button>
        </section>
      ) : hasUsableWasher ? (
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
      ) : null}

      <ConfirmDialog
        open={pendingSection !== null}
        onCancel={() => setPendingSection(null)}
        onConfirm={() => {
          if (pendingSection) setWasherSection(pendingSection)
          setPendingSection(null)
        }}
      />
    </div>
  )
}
