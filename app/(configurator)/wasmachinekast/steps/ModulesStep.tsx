'use client'

import { useEffect, useRef } from 'react'
import { useWasmachinekastStore } from '../store'
import type { BaseModuleSlot } from '../../_shared/store/types'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'
import { Minus, Plus, WashingMachine } from 'lucide-react'
import ModuleConfigCard from '../components/ModuleConfigCard'
import { useIsMobile } from '../../_shared/components/useIsMobile'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  )
}

/**
 * Module count + slot grid for one section. In a dual layout both sections get
 * their own block: the counts were always separate, and every slot in either
 * section can be selected directly from here or from the 3D scene.
 */
function SectionModules({
  kind,
  label,
  modules,
  moduleCount,
  min,
  max,
  setCount,
  washerSlots,
  showLabel,
}: {
  kind: 'high' | 'low'
  label: string
  modules: BaseModuleSlot[]
  moduleCount: number
  min: number
  max: number
  setCount: (count: number) => void
  washerSlots: Set<number>
  showLabel: boolean
}) {
  const selectedSlot = useWasmachinekastStore((s) => s.selectedSlot)
  const setSelectedSlot = useWasmachinekastStore((s) => s.setSelectedSlot)
  const activeModulesSection = useWasmachinekastStore((s) => s.activeModulesSection)
  const setHoveredSlot = useWasmachinekastStore((s) => s.setHoveredSlot)
  const setHoveredSection = useWasmachinekastStore((s) => s.setHoveredSection)

  return (
    <section className="space-y-5">
      {showLabel && <SectionHeading>{label}</SectionHeading>}

      <div className="space-y-3">
        {!showLabel && <SectionHeading>Aantal modules</SectionHeading>}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCount(moduleCount - 1)}
            disabled={moduleCount <= min}
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
            onClick={() => setCount(moduleCount + 1)}
            disabled={moduleCount >= max}
            className={cn(
              'h-11 w-11 shrink-0 flex items-center justify-center rounded-md border border-border/50 bg-transparent transition-colors',
              'hover:bg-muted/60 hover:border-border',
              'disabled:opacity-40 disabled:pointer-events-none',
            )}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-1">
        {modules.map((m) => {
          const isSelected = selectedSlot === m.slotIndex && activeModulesSection === kind
          const isWasherSlot = washerSlots.has(m.slotIndex)
          return (
            <button
              key={m.slotIndex}
              onClick={() => setSelectedSlot(isSelected ? null : m.slotIndex, undefined, kind)}
              onMouseEnter={() => { setHoveredSlot(m.slotIndex); setHoveredSection(kind) }}
              onMouseLeave={() => { setHoveredSlot(null); setHoveredSection(null) }}
              className={cn(
                'aspect-square flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground border-0'
                  : 'border border-border/50 bg-transparent text-foreground hover:border-border hover:bg-muted/40',
              )}
            >
              {/* A washer vak is selectable like any other — the washer is one of
                  the layouts in the picker. */}
              {isWasherSlot ? <WashingMachine className="w-3.5 h-3.5" /> : m.slotIndex + 1}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function ModulesStep() {
  const layout = useWasmachinekastStore((s) => s.layout)
  const isDual = layout === 'low-left' || layout === 'low-right'
  const isLowOnly = layout === 'low-only'

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
  const setHoveredSlot = useWasmachinekastStore((s) => s.setHoveredSlot)
  const setHoveredSection = useWasmachinekastStore((s) => s.setHoveredSection)
  const isMobile = useIsMobile()
  const configCardRef = useRef<HTMLDivElement>(null)
  const doorsExtendToFloor = useWasmachinekastStore((s) => s.doorsExtendToFloor)
  const setDoorsExtendToFloor = useWasmachinekastStore((s) => s.setDoorsExtendToFloor)
  const washerModules = useWasmachinekastStore((s) => s.washerModules)

  // Washer slots lock only the section that actually hosts them — the same slot
  // index in the other section is a different vak.
  const washerSlotsFor = (kind: 'high' | 'low') =>
    new Set(washerModules.filter((w) => w.section === kind).map((w) => w.slotIndex))

  const topLevelKind: 'high' | 'low' = isLowOnly ? 'low' : 'high'
  const topLevelBlock = {
    kind: topLevelKind,
    label: topLevelKind === 'high' ? 'Hoge kast' : 'Lage kast',
    modules,
    moduleCount,
    min: minModules,
    max: maxModules,
    setCount: setModuleCount,
  }
  const lowBlock =
    isDual && lowSection
      ? {
          kind: 'low' as const,
          label: 'Lage kast',
          modules: lowSection.modules,
          moduleCount: lowSection.moduleCount,
          min: lowMinModules,
          max: lowMaxModules,
          setCount: setLowSectionModuleCount,
        }
      : null

  // Order the blocks the way the cabinet reads left to right.
  const blocks = lowBlock
    ? layout === 'low-left'
      ? [lowBlock, topLevelBlock]
      : [topLevelBlock, lowBlock]
    : [topLevelBlock]

  // The indeling step is about the interior — open the doors on entry so the
  // slots are visible. Closing them again while on this step stays respected.
  useEffect(() => {
    if (!useWasmachinekastStore.getState().doorsOpen) {
      useWasmachinekastStore.setState({ doorsOpen: true })
    }
  }, [])

  useEffect(() => () => { setHoveredSlot(null); setHoveredSection(null) }, [setHoveredSlot, setHoveredSection])

  // Mobile: the inline config card sits below the fold, so reveal it on select.
  useEffect(() => {
    if (!isMobile || selectedSlot === null) return
    configCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [isMobile, selectedSlot])

  return (
    <div className="space-y-10">
      <p className="text-xs text-muted-foreground/60">
        Selecteer een module — in de lijst of direct in de 3D-weergave — om de indeling aan te passen
      </p>

      {blocks.map((block) => (
        <SectionModules
          key={block.kind}
          kind={block.kind}
          label={block.label}
          modules={block.modules}
          moduleCount={block.moduleCount}
          min={block.min}
          max={block.max}
          setCount={block.setCount}
          washerSlots={washerSlotsFor(block.kind)}
          showLabel={blocks.length > 1}
        />
      ))}

      {/* Mobile: configure the selected slot inline (desktop uses the canvas popover) */}
      {selectedSlot !== null && (
        <div ref={configCardRef} className="md:hidden scroll-mt-4">
          <ModuleConfigCard />
        </div>
      )}

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
