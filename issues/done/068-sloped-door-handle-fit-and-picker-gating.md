# 068 — Sloped-door handle: `handleFit` module + Door wiring + picker gating

## Parent

[prd-configurator-feedback-round](./prd-configurator-feedback-round.md)

## What to build

Make handles behave correctly under slopes. Two coupled effects, both driven by the new `handle.heightCm` data:

1. On a sloped door, the handle Y position is lowered automatically so the handle stays on the door and reachable.
2. In the handle picker, a handle is disabled if it physically cannot mount on any door in the current configuration (door height at the handle's x is too short for the handle's vertical extent + safety margin).

End-to-end: customer activates a left slope at 60 cm start height; opens the handle picker; tall bar handles appear visually disabled with an explanation, while smaller handles remain selectable; the selected handle on each sloped door drops to a corrected Y instead of floating above the door's top edge.

## Acceptance criteria

- [ ] New pure module exposing `canMountHandle(handle, doorCtx): boolean` and `computeHandleY(doorCtx, handle): number`. No R3F / Three / Zustand imports.
- [ ] Math: `handleY = min(0.9, doorHeightAtHandle − heightCm/200 − SAFETY)`; `canMount = doorHeightAtHandle ≥ heightCm/100 + 2·SAFETY`. `SAFETY` is a code constant.
- [ ] Unit tests cover: full-height door returns Y = 0.9; sloped door drops the handle; symmetry across the `mirror` flag; boundary case for `canMountHandle` at `doorHeightAtHandle = heightCm/100 + 2·SAFETY`.
- [ ] `Door.tsx` computes `doorHeightAtHandle = mirror ? leftH : rightH` and replaces the hardcoded `handleY = 0.9` with `computeHandleY()`.
- [ ] Handle picker (in the handle/material step) marks handles whose `canMountHandle` returns `false` for any door in the current configuration as visually disabled and non-selectable. Tooltip or inline message explains why.
- [ ] When the slope changes such that a currently-selected handle no longer fits, the picker invalidates the selection (graceful fallback rather than crash).
- [ ] Manual QA: drag slope start from 200 cm down to 30 cm; observe handle Y dropping in real time on sloped doors; observe picker disable behaviour at low start heights.

## Blocked by

- Blocked by #067 (`handle.heightCm` must exist and be populated).
