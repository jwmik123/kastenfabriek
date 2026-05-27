# 070 — Pre-filled proposal: `defaultLayoutFor` + wizard wiring

## Parent

[prd-configurator-feedback-round](./prd-configurator-feedback-round.md)

## What to build

When the customer leaves the dimensions step (step 1) for the first time, every empty module is auto-populated with a sensible default layout, so the customer immediately sees a working wardrobe and a real price instead of empty bays.

The proposer is deterministic — same dimensions always produce the same proposal. The rule prefers hanging-rail layouts in outer slots and drawer-stacks in middle slots; falls back to shelves-only when the slot's effective height is below the candidate layout's `minSlotHeight`.

End-to-end: customer enters width / height / depth in step 1, hits "next"; step 2 opens with each module already showing a chosen layout (no clicks required). The customer can still edit any module. Returning to step 1 and back does not re-run the proposer.

## Acceptance criteria

- [ ] New pure module `defaultLayoutFor(slotIndex, slotWidthCm, effectiveHeightCm, totalModules): number` (returns a `layoutId`). No store / R3F imports.
- [ ] Unit tests cover: determinism across repeated calls; outer-vs-middle slot differentiation; fallback to shelves-only when `effectiveHeightCm` is below all candidate `minSlotHeight`; first/last slot symmetry.
- [ ] Wizard hook: on `nextStep()` from step 1, if `modules.every(m => m.layoutId === null)`, call `defaultLayoutFor` for each slot and write the layoutId via `setModuleLayout`.
- [ ] Once any slot has a non-null `layoutId`, the proposer does not re-run on subsequent step transitions.
- [ ] Manual QA: enter dimensions, advance — see filled wardrobe; edit a slot, return to step 1, change a dimension, advance again — customer edits preserved.

## Blocked by

None — can start immediately.
