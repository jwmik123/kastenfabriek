# Slice 2 — Extend anchor types and fill-zone schema

## Parent

PRD: `issues/prd-module-layout-anchor-refactor.md`

## What to build

Add the new placement primitives that slice 3 will consume. No layout uses them yet; this slice is additive and ships with full unit-test coverage.

End-to-end:

- Add `bboxTopAt(d)` anchor: bbox top sits at Y = d. Used to express "X cm height starting from module floor" cleanly.
- Add `midpoint(refIndex)` anchor: bbox top sits at the midpoint between Y = 0 and the referenced sibling's bbox top. Resolves in a second pass after the independent anchors.
- Extend `FillShelves` with optional `startY` and `endY`. When `startY` is explicit, the first shelf sits at exactly that Y and subsequent shelves step by `spacing`. When omitted, today's "floor-aligned past element top" behavior is preserved.
- Add a new `FillFixedShelves` variant carrying `positions: number[]` (Y values from module floor).
- Define default fill bounds: with elements present, fill-above defaults to `startY = max(element.bboxTop)` and `endY = roofY`; fill-below defaults to `startY = 0` and `endY = min(element.bboxBottom)`. With no elements, fill-above runs floor → roofY and fill-below is empty.
- Extract a pure `computeShelfPositions(fillConfig, startY, endY, spacing, fillToTop)` helper from `FillZone.tsx` so the math is unit-testable without React or Three.

## Acceptance criteria

- [ ] `Anchor` union includes `bboxTopAt` and `midpoint` variants
- [ ] `FillZoneConfig` union includes `FillFixedShelves`; `FillShelves` accepts optional `startY`/`endY`
- [ ] `resolveElementPositions` handles the two new anchor variants, including the two-pass resolution required for `midpoint`
- [ ] `computeShelfPositions` is a pure exported function with unit tests covering `shelves` (with and without explicit `startY`), `fixedShelves`, and `open`
- [ ] `FillZone.tsx` JSX consumes the new helper and renders the same output as today for layouts that don't use the new variants
- [ ] No kledingkast or wasmachinekast layout config changes shape — visual parity preserved
- [ ] Unit tests for `resolveElementPositions` cover: `bboxTopAt`, `midpoint` referencing a `fromTop` sibling, and the explicit `startY` override on a fill zone

## Blocked by

- Blocked by `module-layout-1-elements-schema.md`
