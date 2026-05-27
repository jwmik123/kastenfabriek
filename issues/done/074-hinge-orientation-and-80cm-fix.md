# 074 — Hinge orientation fix (§5.1) and 80 cm bottom-hinge fix (§5.2)

## Status: Done ✅

## Parent

[prd-configurator-feedback-round](./prd-configurator-feedback-round.md)

## What was built

Two purely visual / geometric bug fixes on the hinge meshes:

1. **§5.1 — Hinges appear rotated incorrectly.** Replaced the incorrect `[0, 0, Math.PI]` Z-rotation with X-scale mirroring: natural model orientation for left-side hinges, `scale={[-1, 1, 1]}` for right-side (mirrored) hinges.
2. **§5.2 — Bottom hinges look wrong at module height 80 cm.** Edge offset now scales with door span (`min(HINGE_EDGE_OFFSET, doorSpan * 0.15)`), moving bottom hinge from 30% → 15% of door height on short doors. Tall doors unchanged.

## Acceptance criteria

- [x] Hinge mesh rotation corrected; applies to all door variants and mirror states.
- [x] Bottom-hinge placement at module heights around 80 cm matches the expected `HINGE_EDGE_OFFSET` / `HINGE_PAIR_SPACING` pattern without clipping or off-edge positioning.
- [x] Existing hinge-position logic (`hingeYs` candidate filter in `Door.tsx`) still produces 2–4 hinges at normal heights.
- [x] Manual QA: cycle through several module heights (80, 120, 200, 270 cm) with `doorsOpen = true`; visually confirm hinge orientation and positions look correct for every door, including mirrored doors.
- [x] No regression in sloped-door hinge placement.

## Blocked by

None — can start immediately.
