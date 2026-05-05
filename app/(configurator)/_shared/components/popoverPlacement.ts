export type PopoverClickPoint = { x: number; y: number } | null

export interface PopoverContainerRect {
  left: number
  top: number
  width: number
  height: number
}

export interface PopoverSize {
  width: number
  height: number
}

export interface PopoverPlacementInput {
  clickPoint: PopoverClickPoint
  container: PopoverContainerRect
  popoverSize: PopoverSize
  selectedSlot: number
  moduleCount: number
}

export interface PopoverPlacement {
  left: number
  top: number
  mode: 'mouse' | 'fallback'
}

export const POPOVER_CURSOR_OFFSET_PX = 50
export const POPOVER_EDGE_MARGIN_PX = 16
export const POPOVER_NARROW_BREAKPOINT_PX = 768
export const POPOVER_FALLBACK_TOP_PX = 80

function computeFallback(
  container: PopoverContainerRect,
  popoverSize: PopoverSize,
  selectedSlot: number,
  moduleCount: number,
): PopoverPlacement {
  const safeCount = Math.max(1, moduleCount)
  const center = (selectedSlot + 0.5) / safeCount
  const leftPct = Math.min(85, Math.max(15, center * 100))
  const left = (leftPct / 100) * container.width - popoverSize.width / 2
  return { left, top: POPOVER_FALLBACK_TOP_PX, mode: 'fallback' }
}

export function computePopoverPlacement(input: PopoverPlacementInput): PopoverPlacement {
  const { clickPoint, container, popoverSize, selectedSlot, moduleCount } = input

  if (!clickPoint || container.width < POPOVER_NARROW_BREAKPOINT_PX) {
    return computeFallback(container, popoverSize, selectedSlot, moduleCount)
  }

  const localX = clickPoint.x - container.left
  const localY = clickPoint.y - container.top
  const midpoint = container.width / 2

  const left = localX < midpoint
    ? localX + POPOVER_CURSOR_OFFSET_PX
    : localX - POPOVER_CURSOR_OFFSET_PX - popoverSize.width

  const rawTop = localY - popoverSize.height / 2
  const maxTop = container.height - popoverSize.height - POPOVER_EDGE_MARGIN_PX
  const top = Math.min(Math.max(rawTop, POPOVER_EDGE_MARGIN_PX), maxTop)

  return { left, top, mode: 'mouse' }
}
