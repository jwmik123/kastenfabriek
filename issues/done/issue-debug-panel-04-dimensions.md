# Debug panel — per-module dimensions (nominal + inner-clear)

## What to build

Extract the scene wall-thickness and leg-assembly constants (`WALL`, `MODULE_WALL`, `ONDERSTEL_HEIGHT`, `ONDERSTEL_GAP`) into a single shared constants file so they are not duplicated across the scene, `Measurements`, and this new code. Implement a pure `moduleDebugDimensions` function that returns nominal dimensions (gross slot size: width = total ÷ module count × span, height = main height, depth = closet depth) and inner-clear dimensions (subtracting outer side walls, module divider walls, top panel thickness, and leg assembly height). For span-2 slots the inner-clear width omits the intermediate divider. Add the nominal and inner-clear dimension rows to each module slot row in the debug panel. Write unit tests for `moduleDebugDimensions`.

## Acceptance criteria

- [ ] Each module row shows nominal W × H × D (cm, one decimal place)
- [ ] Each module row shows inner-clear W × H × D below the nominal, visually muted
- [ ] Span-2 module nominal width = 2 × single slot width
- [ ] Span-2 module inner-clear width omits the intermediate divider (wider than 2 × single inner-clear)
- [ ] Scene, `Measurements`, and `moduleDebugDimensions` all reference the same shared constants — no magic numbers duplicated
- [ ] Unit tests cover: single slot nominal width, span-2 nominal width, span-1 inner-clear width (two divider walls subtracted), span-2 inner-clear width (outer walls only), inner-clear height (top panel + leg assembly subtracted), inner-clear depth (two outer walls subtracted)

## Blocked by

- Blocked by issue-debug-panel-01-shell (panel must exist to render into)
