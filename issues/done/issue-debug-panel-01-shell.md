# Debug panel shell — draggable, gated, visible

## What to build

Create a floating panel component mounted over the configurator canvas, visible only when `?debug=1` is in the URL. The panel starts at the top-left of the canvas. The header shows the total closet dimensions (W × H × D in cm) and module count. The panel is draggable via pointer capture on the header — no drag library. The body is empty (placeholder text) at this stage. Mount the panel inside the existing `relative`-positioned canvas wrapper alongside `CanvasPricePanel`.

## Acceptance criteria

- [ ] Navigating to `/kledingkast?debug=1` shows the panel; navigating without the param does not
- [ ] Panel starts at top-left of the canvas area (not the full page)
- [ ] Header displays closet W × H × D and module count, updating live as the store changes
- [ ] Panel can be dragged anywhere on screen by its header
- [ ] Drag uses pointer capture — no jitter, no lost events when cursor leaves the element
- [ ] Panel has `max-h-[80vh]` with internal scroll ready for future content
- [ ] No new npm dependencies introduced

## Blocked by

None — can start immediately.
