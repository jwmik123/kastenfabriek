# 048 — `computePopoverPlacement` pure util + unit tests

## Parent

PRD: [issues/prd-module-popover-mouse-tracked-placement.md](./prd-module-popover-mouse-tracked-placement.md)

## What to build

A shared, pure placement function that decides where the module popover should sit given a click point and the canvas container. The function returns container-relative `{ left, top, mode }` and encapsulates every placement rule defined in the PRD: 50/50 side decision against the container midpoint, 50px offset from cursor to the nearest popover edge, vertical centering on the click Y with a top/bottom margin clamp, narrow-container fallback to the legacy slot-center percentage placement, and a fallback when no click point is provided.

This slice is foundation only — no UI consumers in this issue. The util lands with full unit-test coverage so the placement contract is locked before either configurator wires up to it.

## Acceptance criteria

- [ ] `computePopoverPlacement` exists as a pure function in a shared utils location consumable by both configurators
- [ ] Function signature accepts: viewport-coordinate click point (or null), container `DOMRect`, popover size, selected slot index, module count, and a narrow-container flag (or container width threshold internal to the function)
- [ ] Function returns `{ left, top, mode: 'mouse' | 'fallback' }` in container-relative coordinates
- [ ] Left-half click → popover left edge sits at `clickX - containerLeft + 50`, `mode === 'mouse'`
- [ ] Right-half click → popover right edge sits at `clickX - containerLeft - 50`, `mode === 'mouse'`
- [ ] Vertical position centers on click Y, clamped so the popover stays inside the container with a top/bottom margin (~16px)
- [ ] Container width below the narrow breakpoint (~768px) → `mode === 'fallback'`, returned `left`/`top` reproduce the current slot-center percentage + fixed top offset behavior
- [ ] Null click point → `mode === 'fallback'` regardless of container width
- [ ] Unit tests cover each branch above, following the style of existing `__tests__` pure-function tests (e.g. `resolveElementPositions.test.ts`, `triplanar.test.ts`)
- [ ] Tests pass under the project's existing test runner with no new infrastructure
- [ ] No changes to either `ModulePopover` component, scene click handlers, or stores in this issue

## Blocked by

None - can start immediately.
