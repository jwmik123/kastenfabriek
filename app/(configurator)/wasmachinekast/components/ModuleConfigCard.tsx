'use client'

import { Info, X } from 'lucide-react'
import { useWasmachinekastStore } from '../store'
import { WASHER_LAYOUTS } from '../moduleLayouts'
import {
  canFitFixedWidth,
  FALLBACK_MODULE_MIN_WIDTH_CM,
} from '../../_shared/store/slotWidths'
import { filterForSection } from '../sections/wasmModuleLayoutFilter'
import { getWasmLayoutConfig } from '../moduleLayoutConfigs'
import { LAYOUT_SVGS } from '../../kledingkast/components/LayoutSvgs'
import { LOW_LAYOUT_SVGS, WASHER_LAYOUT_SVGS, WASHER_TYPE_SVGS } from './WasherLayoutSvgs'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'

const MODULES_STEP = 3

function PickerHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h4>
  )
}

/** Names that read better than the layout's own in the washer picker. */
const WASHER_LABELS: Record<number, string> = {
  23: 'Losse machine', // open bay under the worktop, machine stands in it
}

/** "Wasmachine (enkel)" → "Enkel"; the group heading already says wasmachine. */
function washerLabel(layoutId: number, name: string): string {
  if (WASHER_LABELS[layoutId]) return WASHER_LABELS[layoutId]
  const inBrackets = /\(([^)]+)\)/.exec(name)
  if (inBrackets) return inBrackets[1].charAt(0).toUpperCase() + inBrackets[1].slice(1)
  return name.replace(/^Wasmachine\s*(met)?\s*/i, '').trim() || name
}

/**
 * The configurable "Vak instellen" card for the wasmachinekast: door / double
 * toggles and the section-aware layout picker for the selected slot, washers
 * included. Reads everything from the store and returns null when there is no
 * selection, so it can live in either the canvas popover (desktop) or inline in
 * the step wizard (mobile).
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
  const togglePushToOpenTop = useWasmachinekastStore((s) => s.toggleModulePushToOpen)
  const toggleLowSectionPushToOpen = useWasmachinekastStore((s) => s.toggleLowSectionModulePushToOpen)
  const selectedHandleId = useWasmachinekastStore((s) => s.doorHandleId)
  const topModules       = useWasmachinekastStore((s) => s.modules)
  const topWidth         = useWasmachinekastStore((s) => s.width)
  const lowSection       = useWasmachinekastStore((s) => s.lowSection)
  const activeModulesSection = useWasmachinekastStore((s) => s.activeModulesSection)
  const moduleLayouts    = useWasmachinekastStore((s) => s.moduleLayouts)
  const washerModules    = useWasmachinekastStore((s) => s.washerModules)
  const addWasherModule  = useWasmachinekastStore((s) => s.addWasherModule)
  const removeWasherModule = useWasmachinekastStore((s) => s.removeWasherModule)
  const canPlaceWasher   = useWasmachinekastStore((s) => s.canPlaceWasher)
  const moduleCountNotice = useWasmachinekastStore((s) => s.washerModuleCountNotice)
  const dismissModuleCountNotice = useWasmachinekastStore((s) => s.dismissWasherModuleCountNotice)
  const layout           = useWasmachinekastStore((s) => s.layout)
  const constraints      = useWasmachinekastStore((s) => s.constraints)
  // Floor under a variable slot: a fixed-width layout is offered only when the
  // remaining slots stay at least this wide.
  const minModuleWidthCm = constraints?.singleCorpus.minWidth ?? FALLBACK_MODULE_MIN_WIDTH_CM

  const isDual = layout === 'low-left' || layout === 'low-right'
  const editingLow = isDual && activeModulesSection === 'low' && lowSection !== null
  const modules = editingLow ? lowSection!.modules : topModules
  const sectionWidthCm = editingLow ? lowSection!.width : topWidth
  const setModuleLayout = editingLow ? setLowSectionModuleLayout : setModuleLayoutTop
  const setModuleSpan = editingLow ? setLowSectionModuleSpan : setModuleSpanTop
  const toggleModuleDoor = editingLow ? toggleLowSectionModuleDoor : toggleModuleDoorTop
  const togglePushToOpen = editingLow ? toggleLowSectionPushToOpen : togglePushToOpenTop

  // Washers live per section, so a washer in high slot N must not lock low slot
  // N — same index, different vak.
  const editingSection: 'high' | 'low' =
    layout === 'low-only' ? 'low' : editingLow ? 'low' : 'high'
  const washerSlots = new Set(
    washerModules.filter((w) => w.section === editingSection).map((w) => w.slotIndex),
  )
  const washerIds   = new Set(WASHER_LAYOUTS.map((l) => l.layoutId))

  const isWasherSlot = selectedSlot !== null && washerSlots.has(selectedSlot)
  const isActive = step === MODULES_STEP && selectedSlot !== null

  if (!isActive || selectedSlot === null) return null

  const isCoveredSlot =
    selectedSlot > 0 && modules[selectedSlot - 1]?.span === 2
  const isDouble = modules[selectedSlot]?.span === 2

  const nextIsWasher = washerSlots.has(selectedSlot + 1)
  const canBeDouble = selectedSlot < modules.length - 1 && !nextIsWasher

  // A vak only has something to push on when it has a door or drawer fronts.
  const activeLayoutConfig =
    modules[selectedSlot]?.layoutId !== null && modules[selectedSlot]?.layoutId !== undefined
      ? getWasmLayoutConfig(modules[selectedSlot].layoutId!)
      : undefined
  const hasFront =
    (modules[selectedSlot]?.hasDoor ?? false) ||
    (editingSection === 'low' && activeLayoutConfig?.lowFronts === true)

  // Washer layouts are picked here like any other indeling; they just carry
  // their own placement rules (fixed width, may shrink the module count).
  const availableLayouts = filterForSection(moduleLayouts, editingSection)
  const washerLayouts = availableLayouts.filter((l) => washerIds.has(l.layoutId))
  const plainLayouts = availableLayouts.filter((l) => !washerIds.has(l.layoutId))

  const activeLayoutId = modules[selectedSlot]?.layoutId

  function renderOption(
    layoutItem: { layoutId: number; name: string; minSlotWidth?: number },
    isWasher: boolean,
  ) {
    if (selectedSlot === null) return null
    // Washers show the large front drawing (the one the old washer step used);
    // everything else keeps the compact silhouette.
    const LayoutSvg = isWasher
      ? WASHER_TYPE_SVGS[layoutItem.layoutId] ?? WASHER_LAYOUT_SVGS[layoutItem.layoutId]
      : (editingSection === 'low' ? LOW_LAYOUT_SVGS[layoutItem.layoutId] : undefined) ??
        LAYOUT_SVGS[layoutItem.layoutId] ??
        WASHER_LAYOUT_SVGS[layoutItem.layoutId]
    const active = activeLayoutId === layoutItem.layoutId
    // Fixed-width modules (minSlotWidth) shrink their variable neighbours, so
    // availability depends on total section space, not on this slot's current
    // width. A washer can also force trailing modules out, so it has its own
    // fit check.
    const available = isWasher
      ? canPlaceWasher(selectedSlot, layoutItem.layoutId, editingSection)
      : canFitFixedWidth(
          modules,
          sectionWidthCm,
          selectedSlot,
          layoutItem.minSlotWidth,
          minModuleWidthCm,
        )
    return (
      <button
        key={layoutItem.layoutId}
        type="button"
        data-layout-id={layoutItem.layoutId}
        disabled={!available}
        onClick={() => chooseLayout(layoutItem.layoutId)}
        title={!available && isWasher ? 'Niet genoeg ruimte voor nog een wasmachine' : undefined}
        style={isWasher ? undefined : { aspectRatio: '1' }}
        className={cn(
          'flex flex-col items-center justify-center gap-1 rounded-md transition-all py-2',
          isWasher && 'px-1 pt-3 pb-2',
          active
            ? 'bg-primary text-primary-foreground border-2 border-primary'
            : available
              ? 'bg-background text-foreground border border-border/50 hover:border-primary'
              : 'bg-background text-muted-foreground border border-border/30 opacity-40 cursor-not-allowed',
        )}
      >
        {LayoutSvg ? (
          <LayoutSvg className={isWasher ? 'h-20 w-auto' : 'w-1/3 h-auto'} />
        ) : (
          <span className="text-[10px] text-center px-1 leading-tight">{layoutItem.name}</span>
        )}
        {isWasher && (
          <span className="text-[10px] text-center leading-tight">
            {washerLabel(layoutItem.layoutId, layoutItem.name)}
          </span>
        )}
      </button>
    )
  }

  function chooseLayout(layoutId: number) {
    if (selectedSlot === null) return
    if (washerIds.has(layoutId)) {
      addWasherModule(selectedSlot, layoutId, editingSection)
      return
    }
    // Leaving a washer behind: drop the placement before writing the new layout,
    // otherwise the slot stays registered as a washer.
    if (isWasherSlot) removeWasherModule(selectedSlot, editingSection)
    setModuleLayout(selectedSlot, layoutId)
  }

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
        <span className="text-sm font-medium flex-1">
          {/* Both sections are selectable, so the index alone does not say which vak. */}
          {isDual ? `${editingLow ? 'Lage' : 'Hoge'} kast · vak ${selectedSlot + 1}` : `Vak ${selectedSlot + 1}`} instellen
        </span>
        <button
          type="button"
          aria-label="Sluiten"
          onClick={() => setSelectedSlot(null)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted/60"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {moduleCountNotice !== null && (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">
            Om het wastoestel te laten passen is het aantal modules verlaagd naar{' '}
            {moduleCountNotice}.
          </span>
          <button
            type="button"
            onClick={dismissModuleCountNotice}
            className="text-amber-900 underline underline-offset-2 hover:text-amber-950"
          >
            Begrepen
          </button>
        </div>
      )}

      {isCoveredSlot ? (
        <p className="text-xs text-muted-foreground">
          Dit vak maakt deel uit van een dubbel module.
        </p>
      ) : (
        <>
          {/* A washer brings its own front, so the door and double toggles do
              not apply to it. */}
          {!isWasherSlot && (
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
          )}

          {/* Per-module push-to-open. Only meaningful on a front that would
              otherwise carry the cabinet's handle. */}
          {!isWasherSlot && hasFront && selectedHandleId !== 'none' && (
            <div
              data-testid="module-popover-push-to-open-toggle"
              className="flex items-center justify-between"
            >
              <div>
                <span className="text-sm">Push-to-open</span>
                <p className="text-xs text-muted-foreground/60">Dit vak krijgt geen greep</p>
              </div>
              <Toggle
                checked={modules[selectedSlot]?.pushToOpen ?? false}
                onCheckedChange={() => togglePushToOpen(selectedSlot)}
              />
            </div>
          )}

          <div data-testid="module-popover-layout-picker" className="space-y-4">
            <div className="space-y-2">
              <PickerHeading>Indeling</PickerHeading>
              <div className="grid grid-cols-4 gap-2">
                {plainLayouts.map((layoutItem) => renderOption(layoutItem, false))}
              </div>
            </div>

            {/* Washers get their own row with the large front drawing — they are
                a different kind of choice than a shelf layout. */}
            {washerLayouts.length > 0 && (
              <div className="space-y-2">
                <PickerHeading>Wasmachine</PickerHeading>
                <div className="grid grid-cols-3 gap-2">
                  {washerLayouts.map((layoutItem) => renderOption(layoutItem, true))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
