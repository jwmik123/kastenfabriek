---
title: "Lift CanvasToolbar to _shared, reposition to left vertical strip"
labels: [configurator, canvas]
---

## What to build

Move both per-configurator `CanvasToolbar` components into a single `app/(configurator)/_shared/components/CanvasToolbar.tsx`. The shared version uses `useConfiguratorStore` (context hook from `_shared/store/context.tsx`) instead of a hardcoded store import so it works for both configurators. Reposition from `absolute bottom-5 left-5` (horizontal row) to `absolute left-4 top-1/3` (vertical flex column). Delete the per-configurator `CanvasToolbar.tsx` files and update both canvas files to import from `_shared`. Also remove the `BrightnessAudit` debug function from `KledingkastCanvas`.

## Acceptance criteria

- [ ] `app/(configurator)/_shared/components/CanvasToolbar.tsx` exists and imports no configurator-specific store directly
- [ ] All toolbar actions (`zoomIn`, `zoomOut`, `toggleMeasurements`, `toggleDoors`, `randomFill`) work in both kledingkast and wasmachinekast
- [ ] Toolbar is positioned as a vertical flex column on the left edge of the canvas
- [ ] Per-configurator `CanvasToolbar.tsx` files are deleted
- [ ] `KledingkastCanvas` and `WasmachinekastCanvas` import `CanvasToolbar` from `_shared`
- [ ] `BrightnessAudit` debug function removed from `KledingkastCanvas`
- [ ] No TypeScript errors

## Blocked by

- Blocked by #025 (full-screen layout establishes the canvas container where positioning is applied)
