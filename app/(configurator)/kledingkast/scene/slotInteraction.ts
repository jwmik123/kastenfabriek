import { useEffect, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useClosetStore } from '../store'

/**
 * Hover/selection state and pointer handlers for one module slot. Shared by
 * the module overlay and the top cabinet compartment above it, so hovering or
 * clicking either one lights up both.
 */
export function useClosetSlotInteraction(slotIndex: number) {
  const step = useClosetStore((s) => s.step)
  const nextStep = useClosetStore((s) => s.nextStep)
  const isSelected = useClosetStore((s) => s.selectedSlot === slotIndex)
  const hovered = useClosetStore((s) => s.hoveredSlot === slotIndex)
  const setSelectedSlot = useClosetStore((s) => s.setSelectedSlot)
  const setHoveredSlot = useClosetStore((s) => s.setHoveredSlot)

  const [pointerInside, setPointerInside] = useState(false)

  useEffect(() => {
    if (!pointerInside) return
    document.body.style.cursor = 'pointer'
    return () => { document.body.style.cursor = 'auto' }
  }, [pointerInside])

  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setPointerInside(true)
    setHoveredSlot(slotIndex)
  }
  const onPointerOut = () => {
    setPointerInside(false)
    if (useClosetStore.getState().hoveredSlot === slotIndex) setHoveredSlot(null)
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const ne = e.nativeEvent
    if (step === 1) {
      nextStep()
      setSelectedSlot(slotIndex, { x: ne.clientX, y: ne.clientY })
      return
    }
    if (isSelected) {
      setSelectedSlot(null)
    } else {
      setSelectedSlot(slotIndex, { x: ne.clientX, y: ne.clientY })
    }
  }

  return { isSelected, hovered, handlers: { onPointerOver, onPointerOut, onClick } }
}
