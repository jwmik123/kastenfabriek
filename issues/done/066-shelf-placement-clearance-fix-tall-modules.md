# 066 — Shelf placement: fix void at top of tall modules

## Parent

[prd-configurator-feedback-round](./prd-configurator-feedback-round.md)

## What to build

Eliminate the empty ~60 cm gap that appears between the topmost shelf and the ceiling in tall straight modules. Cause: `computeShelfPositions` drops the last shelf whenever the gap to the ceiling is smaller than one full `SHELF_SPACING` (36.8 cm). Fix: change the drop condition to a small fixed clearance.

End-to-end: customer configures a 270 cm tall module with a full-shelves layout; the topmost shelf sits within ~5 cm of the ceiling instead of being silently removed. Shelves in sloped modules (where `fillToTop = true`) are unaffected.

## Acceptance criteria

- [ ] In `computeShelfPositions`, replace the drop condition `gapAbove < spacing` with `gapAbove < MIN_TOP_CLEARANCE` (≈ 0.05 m). `SHELF_SPACING` unchanged.
- [ ] `MIN_TOP_CLEARANCE` defined as a named constant in the same module.
- [ ] Regression test in the existing `resolveElementPositions.test.ts` (or companion file) verifies: a tall straight module (e.g. `endY = 2.7`, `startY = 0`) produces a top shelf within `MIN_TOP_CLEARANCE` of `endY`.
- [ ] Existing tests for the `fillToTop = true` and short-module cases continue to pass.
- [ ] Manual QA: 270 cm closet height, shelves-only layout → no large void at the top.

## Blocked by

None — can start immediately.
