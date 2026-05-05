# 049 — Wire kledingkast popover to mouse-tracked placement

## Parent

PRD: [issues/prd-module-popover-mouse-tracked-placement.md](./prd-module-popover-mouse-tracked-placement.md)

## What to build

End-to-end vertical slice that swaps the kledingkast module popover from grid-locked positioning to mouse-tracked context-menu placement, consuming the pure util from issue #048. Click coordinates flow from the R3F mesh handler through the store into the popover, which renders at the position returned by `computePopoverPlacement`. After this slice lands, a kledingkast user clicking a module slot in the modules step sees the popover open 50px to the side of their cursor on the half opposite the click, with the clicked module remaining visible.

## Acceptance criteria

- [ ] Kledingkast store `setSelectedSlot` accepts an optional viewport-coordinate click point and persists it as `lastClickPoint` (or equivalent)
- [ ] Existing call sites that pass no click point still compile and produce the fallback placement
- [ ] Kledingkast `ClosetScene` slot `onClick` passes `event.nativeEvent.clientX/Y` into `setSelectedSlot`
- [ ] Kledingkast `ModulePopover` reads `lastClickPoint` and the canvas container rect, calls `computePopoverPlacement`, and applies the result as inline `left`/`top` styles
- [ ] Hardcoded `top-20`, `-translate-x-1/2`, and inline `leftPct` math are removed from the kledingkast `ModulePopover`
- [ ] Popover closes on `window.resize` while open
- [ ] Existing close behaviors — outside click, Escape, X button — continue to work
- [ ] Existing kledingkast `ModulePopover` snapshot/render tests still pass; updated only if their assertions touched the removed positioning classes
- [ ] No new global mouse listeners are added
- [ ] `MobileSheet` is untouched
- [ ] Manual verification in a browser: click slots on the left half open popover to the right of the cursor; click slots on the right half open popover to the left; the clicked module remains visible in both cases; popover snaps without animation

## Blocked by

- Blocked by #048
