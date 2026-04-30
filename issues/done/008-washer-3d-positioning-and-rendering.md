## Parent PRD

`issues/prd-washer-modules-usable.md`

## What to build

Fix washer positioning in the 3D scene and add stacked rendering. Three concrete changes:

1. **Y anchor fix** — the washer currently renders sunk to the scene floor. Switching to `fixed fromBottom: 0` in the configs (done in the previous slice) feeds `specialElementY = 0` into `SpecialElement`, placing the washer bottom on the module floor.

2. **GLB centering** — `SpecialElementInner` currently left-aligns the GLB with a MODULE_WALL inset. For the washer (and any model with a bounding box not anchored at X=0), the offsetX and offsetZ are updated to center the model in the slot interior.

3. **Stacked rendering** — the stacked double variant renders two washer GLB instances: one at the normal `positionY`, one at `positionY + 0.90 m`. Both share the same loaded GLB scene (clone each independently).

The grey box `WasherPlaceholder` is removed — all washer variants use the real GLB path.

## Acceptance criteria

- [ ] Washer bottom sits on the module floor (not sunken into the onderstel plinth)
- [ ] Washer is horizontally centered in the slot (equal gap on left and right sides)
- [ ] Washer is centered in depth within the slot
- [ ] Stacked variant renders two washer models, second one directly on top of the first
- [ ] Single and side-by-side variants render correctly with the real GLB (no grey box)
- [ ] No regressions in kledingkast `SpecialElementInner` rendering (centering logic accounts for asymmetric GLB bounding boxes)

## Blocked by

- `issues/007-washer-module-configs.md`

## User stories addressed

- User story 10 (washer anchored to module floor)
- User story 11 (washer centered horizontally)
- User story 12 (washer centered in depth)
- User story 15 (stacked variant renders two washers)
- User story 16 (real GLB model, not grey box)
- User story 17 (shelves above washer zone)
