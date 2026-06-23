'use client'

import { X } from 'lucide-react'
import { useWasmachinekastStore } from '../store'
import { WASHER_LAYOUTS } from '../moduleLayouts'
import { canFitFixedWidth } from '../../_shared/store/slotWidths'
import { filterForSection } from '../sections/wasmModuleLayoutFilter'
import { LAYOUT_SVGS } from '../../kledingkast/components/LayoutSvgs'
import { WASHER_LAYOUT_SVGS } from './WasherLayoutSvgs'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'

const MODULES_STEP = 4

/**
 * The configurable "Vak instellen" card for the wasmachinekast: door / double
 * toggles and the section-aware layout picker for the selected slot. Reads
 * everything from the store and returns null when there is nothing to configure
 * (no selection, or a washer-locked slot), so it can live in either the canvas
 * popover (desktop) or inline in the step wizard (mobile).
 */
export default function ModuleConfigCard({ className }: { className?: string }) {
  const step             = useWasmachinekastStore((s) => s.step)
  const selectedSlot     = useWasmachinekastStore((s) => s.selectedSlot)
  const setSelectedSlot  = useWasmachinekastStore((s) => s.setSelectedSlot)
  const setModuleLayoutTop = useWasmachinekastStore((s) => s.setModuleLayout)
  const setModuleSpanTop   = useWasmachinekastStore((s) => s.setModuleSpan)
  const toggleModuleDoorTop = useWasmachinekastStore((s) => s.toggleModuleDoor)
  const setLowSectionModuleLayout = useWasmachinekastStore((s) => s.setLowSectionModuleLayout)
  const setLowSectionModuleSpan = useWasmachinekastStore((s) => s.setLowSectionModuleSpan)
  const toggleLowSectionModuleDoor = useWasmachinekastStore((s) => s.toggleLowSectionModuleDoor)
  const topModules       = useWasmachinekastStore((s) => s.modules)
  const topWidth         = useWasmachinekastStore((s) => s.width)
  const lowSection       = useWasmachinekastStore((s) => s.lowSection)
  const activeModulesSection = useWasmachinekastStore((s) => s.activeModulesSection)
  const moduleLayouts    = useWasmachinekastStore((s) => s.moduleLayouts)
  const washerModules    = useWasmachinekastStore((s) => s.washerModules)
  const washerSection    = useWasmachinekastStore((s) => s.washerSection)
  const layout           = useWasmachinekastStore((s) => s.layout)

  const isDual = layout === 'low-left' || layout === 'low-right'
  const editingLow = isDual && activeModulesSection === 'low' && lowSection !== null
  const modules = editingLow ? lowSection!.modules : topModules
  const sectionWidthCm = editingLow ? lowSection!.width : topWidth
  const setModuleLayout = editingLow ? setLowSectionModuleLayout : setModuleLayoutTop
  const setModuleSpan = editingLow ? setLowSectionModuleSpan : setModuleSpanTop
  const toggleModuleDoor = editingLow ? toggleLowSectionModuleDoor : toggleModuleDoorTop

  // Only treat slots as washer-locked when we're viewing the section that
  // actually hosts the washer placements. In dual layouts a washer in high
  // slot N must not also lock low slot N (different section, same index).
  const editingSection: 'high' | 'low' =
    layout === 'low-only' ? 'low' : editingLow ? 'low' : 'high'
  const washerLocksThisSection =
    washerSection !== null && washerSection === editingSection
  const washerSlots = new Set(
    washerLocksThisSection ? washerModules.map((w) => w.slotIndex) : [],
  )
  const washerIds   = new Set(WASHER_LAYOUTS.map((l) => l.layoutId))

  const isWasherSlot = selectedSlot !== null && washerSlots.has(selectedSlot)
  const isActive = step === MODULES_STEP && selectedSlot !== null && !isWasherSlot

  if (!isActive || selectedSlot === null) return null

  const isCoveredSlot =
    selectedSlot > 0 && modules[selectedSlot - 1]?.span === 2
  const isDouble = modules[selectedSlot]?.span === 2

  const nextIsWasher = washerSlots.has(selectedSlot + 1)
  const canBeDouble = selectedSlot < modules.length - 1 && !nextIsWasher

  const availableLayouts = filterForSection(
    moduleLayouts.filter((l) => !washerIds.has(l.layoutId)),
    editingSection,
  )

  const activeLayoutId = modules[selectedSlot]?.layoutId

  return (
    <div
      data-testid="module-popover"
      className={cn(
        'w-full rounded-xl bg-background/95 backdrop-blur-sm border border-border shadow-lg p-4 space-y-4',
        className,
      )}
    >
      <div className="flex items-center gap-2 pb-3 border-b border-border/30">
        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
          {selectedSlot + 1}
        </div>
        <span className="text-sm font-medium flex-1">Vak {selectedSlot + 1} instellen</span>
        <button
          type="button"
          aria-label="Sluiten"
          onClick={() => setSelectedSlot(null)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted/60"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isCoveredSlot ? (
        <p className="text-xs text-muted-foreground">
          Dit vak maakt deel uit van een dubbel module.
        </p>
      ) : (
        <>
          <div className="flex gap-5">
            <div
              data-testid="module-popover-door-toggle"
              className="flex items-center justify-between flex-1"
            >
              <span className="text-sm">Deur</span>
              <Toggle
                checked={modules[selectedSlot]?.hasDoor ?? false}
                onCheckedChange={() => toggleModuleDoor(selectedSlot)}
              />
            </div>
            {canBeDouble && (
              <div
                data-testid="module-popover-double-toggle"
                className="flex items-center justify-between flex-1"
              >
                <span className="text-sm">Dubbele module</span>
                <Toggle
                  checked={isDouble}
                  onCheckedChange={(v) => setModuleSpan(selectedSlot, v ? 2 : 1)}
                />
              </div>
            )}
          </div>

          <div
            data-testid="module-popover-layout-picker"
            className="grid grid-cols-4 gap-2"
          >
            {availableLayouts.map((layoutItem) => {
              const LayoutSvg = LAYOUT_SVGS[layoutItem.layoutId] ?? WASHER_LAYOUT_SVGS[layoutItem.layoutId]
              const active = activeLayoutId === layoutItem.layoutId
              // Fixed-width modules (minSlotWidth) shrink their variable
              // neighbours, so availability depends on total section space,
              // not on this single slot's current width.
              const available = canFitFixedWidth(
                modules,
                sectionWidthCm,
                selectedSlot,
                layoutItem.minSlotWidth,
              )
              return (
                <button
                  key={layoutItem.layoutId}
                  type="button"
                  data-layout-id={layoutItem.layoutId}
                  disabled={!available}
                  onClick={() => setModuleLayout(selectedSlot, layoutItem.layoutId)}
                  style={{ aspectRatio: '1' }}
                  className={cn(
                    'flex items-center justify-center rounded-md transition-all py-2',
                    active
                      ? 'bg-primary text-primary-foreground border-2 border-primary'
                      : available
                        ? 'bg-background text-foreground border border-border/50 hover:border-primary'
                        : 'bg-background text-muted-foreground border border-border/30 opacity-40 cursor-not-allowed',
                  )}
                >
                  {LayoutSvg ? (
                    <LayoutSvg className="w-1/3 h-auto" />
                  ) : (
                    <span className="text-[10px] text-center px-1 leading-tight">{layoutItem.name}</span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
