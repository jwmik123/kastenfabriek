'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useWasmachinekastStore } from '../store'
import { computePopoverPlacement, type PopoverPlacement } from '../../_shared/components/popoverPlacement'
import { useIsMobile } from '../../_shared/components/useIsMobile'
import ModuleConfigCard from './ModuleConfigCard'

const MODULES_STEP = 4
const POPOVER_WIDTH_PX = 320

/**
 * Desktop-only canvas overlay that positions the module config card next to the
 * clicked slot. On mobile the same card is rendered inline in the step wizard
 * (see ModulesStep), so this returns null there.
 */
export default function ModulePopover() {
  const step             = useWasmachinekastStore((s) => s.step)
  const selectedSlot     = useWasmachinekastStore((s) => s.selectedSlot)
  const setSelectedSlot  = useWasmachinekastStore((s) => s.setSelectedSlot)
  const topModuleCount   = useWasmachinekastStore((s) => s.moduleCount)
  const lowSection       = useWasmachinekastStore((s) => s.lowSection)
  const activeModulesSection = useWasmachinekastStore((s) => s.activeModulesSection)
  const washerModules    = useWasmachinekastStore((s) => s.washerModules)
  const washerSection    = useWasmachinekastStore((s) => s.washerSection)
  const lastClickPoint   = useWasmachinekastStore((s) => s.lastClickPoint)
  const layout           = useWasmachinekastStore((s) => s.layout)

  const isMobile = useIsMobile()

  const isDual = layout === 'low-left' || layout === 'low-right'
  const editingLow = isDual && activeModulesSection === 'low' && lowSection !== null
  const moduleCount = editingLow ? lowSection!.moduleCount : topModuleCount

  const editingSection: 'high' | 'low' =
    layout === 'low-only' ? 'low' : editingLow ? 'low' : 'high'
  const washerLocksThisSection =
    washerSection !== null && washerSection === editingSection
  const washerSlots = new Set(
    washerLocksThisSection ? washerModules.map((w) => w.slotIndex) : [],
  )
  const isWasherSlot = selectedSlot !== null && washerSlots.has(selectedSlot)

  const ref = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState<PopoverPlacement | null>(null)

  const isActive = step === MODULES_STEP && selectedSlot !== null && !isWasherSlot && !isMobile

  useEffect(() => {
    if (!isActive) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setSelectedSlot(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedSlot(null)
    }
    const onResize = () => setSelectedSlot(null)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [isActive, setSelectedSlot])

  useLayoutEffect(() => {
    if (!isActive || selectedSlot === null) return
    const node = ref.current
    const parent = node?.parentElement
    if (!node || !parent) return
    const containerRect = parent.getBoundingClientRect()
    const popHeight = node.getBoundingClientRect().height || 0
    const next = computePopoverPlacement({
      clickPoint: lastClickPoint,
      container: {
        left: containerRect.left,
        top: containerRect.top,
        width: containerRect.width,
        height: containerRect.height,
      },
      popoverSize: { width: POPOVER_WIDTH_PX, height: popHeight },
      selectedSlot,
      moduleCount,
    })
    setPlacement(next)
  }, [isActive, selectedSlot, lastClickPoint, moduleCount])

  if (!isActive) return null

  return (
    <div
      ref={ref}
      className="absolute z-20 w-[320px]"
      style={
        placement
          ? { left: `${placement.left}px`, top: `${placement.top}px` }
          : { left: 0, top: 0, visibility: 'hidden' }
      }
    >
      <ModuleConfigCard />
    </div>
  )
}
