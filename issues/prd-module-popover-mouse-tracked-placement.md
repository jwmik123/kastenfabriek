# PRD — Module Popover Mouse-Tracked Placement

## Problem Statement

In the modules step of both the kledingkast and wasmachinekast configurators, clicking a module slot in the 3D scene opens a popover that is positioned using a fixed grid: a hardcoded vertical offset (`top-20`) and a horizontal percentage derived from the slot index. Because the popover is roughly the width of several slots and is anchored above the bay, it frequently lands directly on top of the slot the user just clicked. The user cannot see the module they are configuring while they change its layout, doors, or span — defeating the purpose of having a 3D preview.

## Solution

Reposition the module popover as a context-menu next to the cursor instead of a grid-locked panel above the bay. On desktop, the popover follows the click point: if the user clicks on the left half of the canvas, the popover opens 50px to the right of the cursor; if the user clicks on the right half, it opens 50px to the left. This guarantees the clicked module remains visible on the opposite side of the popover. On narrow containers where this geometry cannot fit, the existing slot-centered placement is retained as a fallback.

## User Stories

1. As a configurator user on desktop, I want the module popover to open next to my cursor instead of over the module I clicked, so that I can see the module I am editing while I change its settings.
2. As a configurator user, I want the popover to open on the opposite side of the canvas midpoint from my click, so that the popover never covers the module I am trying to view.
3. As a configurator user, I want the popover's vertical position to track my click, so that I do not have to look away from the click point to find the popover.
4. As a configurator user, I want the popover to remain fully inside the canvas bounds, so that it is never clipped by the canvas edges or the page chrome.
5. As a configurator user clicking a module near the top or bottom of a tall closet, I want the popover clamped within the canvas with a small margin, so that no controls are cut off.
6. As a configurator user on a small/narrow viewport, I want the existing slot-centered popover behavior preserved, so that the popover still fits when there isn't room for a context-menu layout.
7. As a configurator user on mobile, I want the existing MobileSheet experience untouched, so that this change does not regress mobile UX.
8. As a kledingkast user, I want this behavior in the kledingkast configurator.
9. As a wasmachinekast user, I want the same behavior in the wasmachinekast configurator, so that both products feel consistent.
10. As a configurator user opening a module via a non-mouse path (product tour, keyboard, programmatic selection), I want the popover to fall back to a sensible default placement, so that the popover still appears even when no click coordinates are available.
11. As a configurator user, I want the popover to close when the window resizes, so that it cannot end up stuck in a stale position relative to the new canvas size.
12. As a configurator user, I want the popover to snap into position immediately on click rather than animating, so that interaction feels responsive and tooltip-like.
13. As a configurator user clicking a different module while a popover is already open, I want the popover to reposition to the new click point, so that placement always reflects the most recent action.
14. As a configurator user, I want the existing close behaviors — clicking outside, pressing Escape, clicking the X — to keep working unchanged.
15. As a developer, I want the placement logic isolated in a single pure function, so that placement rules can be tested without rendering the canvas.
16. As a developer, I want the same placement function shared between kledingkast and wasmachinekast, so that the two configurators cannot drift apart on this behavior.
17. As a developer, I want the click point captured at the source (the R3F mesh `onClick`) and stored alongside the selected slot, so that the popover does not have to subscribe to global mouse events.
18. As a QA engineer, I want unit coverage for each placement branch (left click, right click, narrow fallback, null click fallback, Y clamping), so that regressions are caught quickly.

## Implementation Decisions

**Modules**

- A new pure function `computePopoverPlacement` is introduced as a shared utility consumed by both configurators. It takes the click point (in viewport coordinates), the canvas container's `DOMRect`, the popover's size, the selected slot index, the module count, and a narrow-container flag, and returns `{ left, top, mode: 'mouse' | 'fallback' }` expressed in container-relative coordinates. All placement rules — 50/50 side decision, 50px offset, Y clamping with margin, narrow fallback, null-click fallback — live inside this function. The popover components are passive consumers of its output.
- Both configurator stores (`kledingkast/store.ts` and `wasmachinekast/store.ts`) extend `setSelectedSlot` to accept an optional click point `{ x, y }` in viewport coordinates and persist a `lastClickPoint` field. Existing call sites that pass no click point continue to work and produce a fallback placement.
- The R3F slot click handlers in both scenes pass `event.nativeEvent.clientX` and `event.nativeEvent.clientY` into `setSelectedSlot`. No new global mouse listeners are added.
- Both `ModulePopover` components remove their inline `leftPct` math and the hardcoded `top-20` / `-translate-x-1/2` classes. They read `lastClickPoint` from the store, measure the canvas container via a ref, and apply the result of `computePopoverPlacement` as inline `left` / `top` styles.
- A small effect inside `ModulePopover` clears the selected slot on `window.resize` to avoid stale placement.

**Behavior rules**

- "Left half" and "right half" are defined relative to the canvas container midpoint (the `relative w-full h-full` wrapper around the R3F canvas), not the viewport, and not the projected closet bounds. This keeps the split stable under camera orbit and sidebar layout changes.
- Horizontal offset is 50px from the cursor to the nearest edge of the popover (i.e. left-side click → popover's left edge sits at `clickX + 50`; right-side click → popover's right edge sits at `clickX - 50`).
- Vertical placement centers the popover on the click Y, then clamps to keep the popover fully inside the container with a ~16px margin top and bottom.
- Narrow-container fallback engages when container width is below ~768px; in that mode the popover uses the previous slot-center percentage placement so behavior on small desktops/tablets remains acceptable.
- Null click point (tour, keyboard, programmatic) also routes through the fallback branch.
- The popover snaps to position; no transition.
- The popover is dismissed on resize, on outside click, on Escape, and on the X button (last three already exist).
- The MobileSheet experience is unchanged; this PRD only touches the desktop popover.

**Out of contract**

- No changes to module data model, scene geometry, store selectors beyond the `setSelectedSlot` signature, or the popover's internal content/controls.

## Testing Decisions

Tests target external behavior: given inputs to `computePopoverPlacement`, assert the returned `{ left, top, mode }`. No tests inspect React internals, refs, or the popover's DOM beyond what existing snapshot tests already cover.

- `computePopoverPlacement` is the only new module under test. Cases:
  - Click on left half → returned `left` equals `clickX - containerLeft + 50`, `mode` is `'mouse'`.
  - Click on right half → returned `left` equals `clickX - containerLeft - 50 - popupWidth`, `mode` is `'mouse'`.
  - Click near top of container → `top` clamped to the top margin.
  - Click near bottom of container → `top` clamped so popover fits within the container minus the bottom margin.
  - Container width below the narrow breakpoint → `mode` is `'fallback'`, `left` matches the legacy slot-center percentage formula, `top` matches the legacy fixed offset.
  - Null click point → `mode` is `'fallback'` regardless of container width.
- Existing `ModulePopover.test.tsx` snapshot/render tests for both configurators remain in place; they continue to validate that the popover renders the right controls. No new render tests are added — placement is exercised by the pure-function tests.
- Prior art: existing pure-utility tests in the kledingkast `__tests__` folder (e.g. `resolveElementPositions.test.ts`, `triplanar.test.ts`, `veneers.test.ts`) follow the same pattern of black-box testing a pure function with tabulated inputs and outputs. New tests follow that style.

## Out of Scope

- Mobile layout changes. `MobileSheet` is untouched.
- Animations or transitions for the popover.
- Recomputing placement on resize while open — the popover is closed instead.
- Recomputing placement on camera orbit while open — placement is frozen at click time.
- Changes to popover content, controls, or styling.
- Changes to selection logic, hover behavior, or 3D scene click targets beyond passing the native click coordinates through.
- Any changes to other configurator steps or other popovers/panels.

## Further Notes

- The 50px offset and ~16px clamp margin are starting values; both should be easy to tune in one place (`computePopoverPlacement`) once the behavior is in front of users.
- The narrow-container breakpoint (~768px) is chosen because the popover is 320px wide and the 50/50 + 50px offset geometry breaks below roughly twice that. Treat this number as tunable.
- Because the popover already lives inside the canvas's `relative` wrapper in both configurators, container-relative coordinates require only a `getBoundingClientRect()` on that wrapper; no portal is needed.
- Keeping placement in a pure function leaves room to later add features like flipping sides when the popover would overflow, or anchoring to the projected slot position from the camera, without rewriting consumers.
