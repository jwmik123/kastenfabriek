# 064 — Lower slope min start-height to 30 cm + audit §1.2 stair-step shelf

## Parent

[prd-configurator-feedback-round](./prd-configurator-feedback-round.md)

## What to build

Allow the customer to bring the left/right slope start-height down to 30 cm (from the current 100 cm floor), and guarantee that the existing module-local structural shelf at the slope plane (`StructuralSideKinkShelf`) renders for every sloped module.

End-to-end: a customer in step 2 with a left slope active drags the slope start-height slider to 30 cm; the slope re-renders; every module under the slope shows a real shelf board at its wall-side slope height. No module is missing its shelf.

## Acceptance criteria

- [ ] `getStartHeightRange` returns `{ min: 30, max: mainHeight - 20 }` in `diagonalConstraints.ts`.
- [ ] Slope start-height slider in the UI accepts 30 cm as the floor.
- [ ] At low start heights (30–60 cm), the closet still renders without geometry warnings; `MIN_FLAT_GAP` and amplification math behave.
- [ ] `StructuralSideKinkShelf` renders for every module whose wall-side edge sits under an active side slope, including modules whose far edge already reaches `mainHeight`. Audit and fix the L55 `farEdgeX ≥ mainHeight` early-return if it skips cases that should render a shelf.
- [ ] Manual QA: configure left slope at start = 30 cm, walk through several closet widths; confirm every sloped module has its shelf and no shelf is drawn outside the slope zone.

## Blocked by

None — can start immediately.
