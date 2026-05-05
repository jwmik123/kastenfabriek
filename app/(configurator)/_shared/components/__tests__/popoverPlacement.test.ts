import { describe, it, expect } from 'vitest'
import {
  computePopoverPlacement,
  POPOVER_CURSOR_OFFSET_PX,
  POPOVER_EDGE_MARGIN_PX,
  POPOVER_NARROW_BREAKPOINT_PX,
  POPOVER_FALLBACK_TOP_PX,
} from '../popoverPlacement'

const POPOVER = { width: 320, height: 400 }
const WIDE_CONTAINER = { left: 100, top: 50, width: 1200, height: 800 }
const NARROW_CONTAINER = { left: 0, top: 0, width: 600, height: 800 }

describe('computePopoverPlacement', () => {
  it('left-half click → popover left edge sits 50px right of cursor, mode mouse', () => {
    const r = computePopoverPlacement({
      clickPoint: { x: 300, y: 400 },
      container: WIDE_CONTAINER,
      popoverSize: POPOVER,
      selectedSlot: 0,
      moduleCount: 4,
    })
    expect(r.mode).toBe('mouse')
    expect(r.left).toBe(300 - WIDE_CONTAINER.left + POPOVER_CURSOR_OFFSET_PX)
  })

  it('right-half click → popover right edge sits 50px left of cursor, mode mouse', () => {
    const clickX = 1100
    const r = computePopoverPlacement({
      clickPoint: { x: clickX, y: 400 },
      container: WIDE_CONTAINER,
      popoverSize: POPOVER,
      selectedSlot: 3,
      moduleCount: 4,
    })
    expect(r.mode).toBe('mouse')
    // right edge = clickX - containerLeft - 50; left = right - popoverWidth
    expect(r.left).toBe(clickX - WIDE_CONTAINER.left - POPOVER_CURSOR_OFFSET_PX - POPOVER.width)
  })

  it('vertical centers on click Y when not near edges', () => {
    const clickY = 450
    const r = computePopoverPlacement({
      clickPoint: { x: 300, y: clickY },
      container: WIDE_CONTAINER,
      popoverSize: POPOVER,
      selectedSlot: 0,
      moduleCount: 4,
    })
    expect(r.top).toBe(clickY - WIDE_CONTAINER.top - POPOVER.height / 2)
  })

  it('clamps top when click is near container top edge', () => {
    const r = computePopoverPlacement({
      clickPoint: { x: 300, y: WIDE_CONTAINER.top + 5 },
      container: WIDE_CONTAINER,
      popoverSize: POPOVER,
      selectedSlot: 0,
      moduleCount: 4,
    })
    expect(r.top).toBe(POPOVER_EDGE_MARGIN_PX)
  })

  it('clamps top when click is near container bottom edge', () => {
    const clickY = WIDE_CONTAINER.top + WIDE_CONTAINER.height - 5
    const r = computePopoverPlacement({
      clickPoint: { x: 300, y: clickY },
      container: WIDE_CONTAINER,
      popoverSize: POPOVER,
      selectedSlot: 0,
      moduleCount: 4,
    })
    expect(r.top).toBe(WIDE_CONTAINER.height - POPOVER.height - POPOVER_EDGE_MARGIN_PX)
  })

  it('container narrower than breakpoint → fallback mode with legacy slot-center placement', () => {
    expect(NARROW_CONTAINER.width).toBeLessThan(POPOVER_NARROW_BREAKPOINT_PX)
    const selectedSlot = 1
    const moduleCount = 4
    const r = computePopoverPlacement({
      clickPoint: { x: 200, y: 300 },
      container: NARROW_CONTAINER,
      popoverSize: POPOVER,
      selectedSlot,
      moduleCount,
    })
    expect(r.mode).toBe('fallback')
    const center = (selectedSlot + 0.5) / moduleCount
    const leftPct = Math.min(85, Math.max(15, center * 100))
    expect(r.left).toBe((leftPct / 100) * NARROW_CONTAINER.width - POPOVER.width / 2)
    expect(r.top).toBe(POPOVER_FALLBACK_TOP_PX)
  })

  it('null click point → fallback regardless of container width', () => {
    const r = computePopoverPlacement({
      clickPoint: null,
      container: WIDE_CONTAINER,
      popoverSize: POPOVER,
      selectedSlot: 2,
      moduleCount: 4,
    })
    expect(r.mode).toBe('fallback')
    expect(r.top).toBe(POPOVER_FALLBACK_TOP_PX)
    const center = (2 + 0.5) / 4
    const leftPct = Math.min(85, Math.max(15, center * 100))
    expect(r.left).toBe((leftPct / 100) * WIDE_CONTAINER.width - POPOVER.width / 2)
  })

  it('fallback clamps slot center percentage to 15..85', () => {
    const r = computePopoverPlacement({
      clickPoint: null,
      container: WIDE_CONTAINER,
      popoverSize: POPOVER,
      selectedSlot: 0,
      moduleCount: 100,
    })
    // (0.5/100)*100 = 0.5% → clamped to 15
    expect(r.left).toBe((15 / 100) * WIDE_CONTAINER.width - POPOVER.width / 2)
  })

  it('click exactly at midpoint counts as right-half', () => {
    const midX = WIDE_CONTAINER.left + WIDE_CONTAINER.width / 2
    const r = computePopoverPlacement({
      clickPoint: { x: midX, y: 400 },
      container: WIDE_CONTAINER,
      popoverSize: POPOVER,
      selectedSlot: 1,
      moduleCount: 4,
    })
    expect(r.mode).toBe('mouse')
    expect(r.left).toBe(midX - WIDE_CONTAINER.left - POPOVER_CURSOR_OFFSET_PX - POPOVER.width)
  })
})
