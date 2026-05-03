---
title: "Route group: move both configurators to (configurator) bare layout"
labels: [configurator, routing]
---

## What to build

Create a new `(configurator)` route group (sibling to `(main)`) with a bare layout that renders no `Navigation` or `Footer`. Move `/kledingkast` and `/wasmachinekast` page trees into it. Remove the now-empty `(bouw-je-kast)` group. Move `ClosetSummarySection` into the kledingkast page file inside the new group. URL paths must remain identical — no redirects needed.

## Acceptance criteria

- [ ] `app/(configurator)/layout.tsx` exists and renders only `{children}` (no nav, no footer)
- [ ] `app/(configurator)/kledingkast/` contains the full kledingkast page tree (page, store, components, steps, scene, hooks, tests)
- [ ] `app/(configurator)/wasmachinekast/` contains the full wasmachinekast page tree
- [ ] `_shared/` directory moves to `app/(configurator)/_shared/` and all internal imports updated
- [ ] `app/(main)/(bouw-je-kast)/` directory is deleted
- [ ] `ClosetSummarySection` renders below the configurator in the kledingkast page file (same visual position as before)
- [ ] `/kledingkast` and `/wasmachinekast` routes resolve correctly in dev and build
- [ ] No changes to `app/(main)/layout.tsx`, `Navigation`, or `Footer`

## Blocked by

None — can start immediately.
