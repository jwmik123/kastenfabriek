---
title: "CanvasPricePanel redesign: full-width frosted bottom bar + tests"
labels: [configurator, ui, canvas]
---

## What to build

Redesign the shared `CanvasPricePanel` from a small floating card (`absolute bottom-5 right-5`) to a full-width frosted bar pinned to the bottom of the canvas (`absolute bottom-0 left-0 right-0`). Apply `bg-background/90 backdrop-blur-sm`. Layout (left to right): total price (serif, large) | vertical divider | delivery window | vertical divider | step summary (optional) | spacer | "Bewaar" ghost button | "Voeg toe aan winkelwagen" primary button. Add a `stepSummary?: { label: string; value: string }` prop — when absent, hide the column. Each per-configurator wrapper (`kledingkast/components/CanvasPricePanel.tsx`, `wasmachinekast/components/CanvasPricePanel.tsx`) computes `stepSummary` from its store and passes it down. The shared display component imports no store.

## Acceptance criteria

- [ ] Panel spans full width at the bottom of the canvas area (`absolute bottom-0 left-0 right-0`)
- [ ] Frosted glass treatment applied (`bg-background/90 backdrop-blur-sm`)
- [ ] Total price renders in serif font at a large size
- [ ] Delivery window renders
- [ ] "Bewaar" ghost button renders (not wired to functionality)
- [ ] "Voeg toe aan winkelwagen" primary button renders and triggers add-to-cart
- [ ] `stepSummary` prop: when provided, label and value both render; when absent, summary column is hidden
- [ ] Shared display component has no direct store import
- [ ] Tests: `totalPrice = 3597` → formatted price renders
- [ ] Tests: delivery window string renders
- [ ] Tests: `stepSummary = { label: 'Modules', value: '6 modules · 4 deuren' }` → both label and value render
- [ ] Tests: no `stepSummary` prop → summary column absent from output
- [ ] Tests use `renderToStaticMarkup` with all props passed directly

## Blocked by

- Blocked by #025 (full-screen layout positions the canvas container that the panel sits inside)
