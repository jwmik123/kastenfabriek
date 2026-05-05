# 050 — Wire wasmachinekast popover to mouse-tracked placement

## Parent

PRD: [issues/prd-module-popover-mouse-tracked-placement.md](./prd-module-popover-mouse-tracked-placement.md)

## What to build

End-to-end vertical slice that applies the same mouse-tracked context-menu placement to the wasmachinekast configurator's module popover, consuming the pure util from issue #048. Mirrors issue #049 for the other product so the two configurators stay behaviorally consistent. After this slice lands, a wasmachinekast user clicking a module slot in the modules step sees the popover open 50px to the side of their cursor on the half opposite the click, with the clicked module remaining visible.

## Acceptance criteria

- [ ] Wasmachinekast store `setSelectedSlot` accepts an optional viewport-coordinate click point and persists it as `lastClickPoint` (or equivalent)
- [ ] Existing call sites that pass no click point still compile and produce the fallback placement
- [ ] Wasmachinekast scene slot click handler passes `event.nativeEvent.clientX/Y` into `setSelectedSlot`
- [ ] Wasmachinekast `ModulePopover` reads `lastClickPoint` and the canvas container rect, calls `computePopoverPlacement`, and applies the result as inline `left`/`top` styles
- [ ] Hardcoded grid-positioning classes and inline percentage math are removed from the wasmachinekast `ModulePopover`
- [ ] Popover closes on `window.resize` while open
- [ ] Existing close behaviors — outside click, Escape, X button — continue to work
- [ ] Existing wasmachinekast `ModulePopover` snapshot/render tests still pass; updated only if their assertions touched the removed positioning classes
- [ ] No new global mouse listeners are added
- [ ] Wasmachinekast mobile experience is untouched
- [ ] Manual verification in a browser: click slots on the left half open popover to the right of the cursor; click slots on the right half open popover to the left; the clicked module remains visible in both cases; popover snaps without animation
- [ ] Behavior visibly matches the kledingkast configurator after issue #049

## Blocked by

- Blocked by #048
