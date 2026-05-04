# Slice 3 — Re-spec layouts 1–8 to new GLBs and anchors

## Parent

PRD: `issues/prd-module-layout-anchor-refactor.md`

## What to build

Apply the eight layout specs from the PRD. Swap each kledingkast layout to its new mainmodule GLB and rewrite its anchors using the schema landed in slices 1 and 2. Layout IDs and ordering are preserved; labels, descriptions, SVG thumbnails and Sanity pricing rows stay untouched. Wasmachinekast layouts are out of scope here.

Per-layout specs:

- **L1 shelves only** — `elements: []`. `fillZone.above`: `shelves(spacing: 0.35)` from floor → roofY (default bounds). `fillZone.below`: `open`.
- **L2 drawer + shelves** — one element: `DrawerModule.glb` at `fromBottom(0)`. `above`: `shelves(0.35)` from drawer bbox top. `below`: `open`.
- **L3 double rod** — two elements, both `RodModule.glb`. Top rod `fromTop(0.35)`. Bottom rod `midpoint(0)`. `above`: `open`. `below`: `open`.
- **L4 split + shelves** — one element: `SplitModule.glb` at `bboxTopAt(1.40)`. `above`: `shelves(0.35)` from split bbox top. `below`: `open`.
- **L5 single rod 140 cm** — one element: `RodModule.glb` at `bboxTopAt(1.40)`. `above`: `shelves(0.35)` from rod bbox top. `below`: `open`.
- **L6 single rod + shelf** — one element: `RodModule.glb` at `fromTop(0.35)`. `above`: `open`. `below`: `fixedShelves(positions: [0.35])`.
- **L7 drawer + rod** — two elements. `DrawerModule.glb` at `fromBottom(0)`. `RodModule.glb` at `fromTop(0.35)`. `above`: `open`. `below`: `open`.
- **L8 desk** — one element: `DeskModule.glb` at `fromBottom(0)`. `above`: `shelves(0.35, startY: 1.75)` to roofY. `below`: `open`.

Cleanup:

- Delete `ModuleDrawer.glb`, `ModuleDoubleRod.glb`, `ModuleSplit.glb`, `ModuleSingleRod.glb`, `ModuleShelfRod.glb`, `ModuleDrawerRod.glb`, `ModuleDesk.glb` from `public/objects/`.
- Washer GLBs in `public/objects/washermodules/` are untouched.

## Acceptance criteria

- [ ] All eight kledingkast layouts use the new mainmodule GLBs from `public/objects/mainmodules/`
- [ ] Layout 1 renders evenly spaced shelves filling the entire module
- [ ] Layout 2 renders a drawer in the bottom 70 cm with shelves above
- [ ] Layout 3 renders two rods: the top rod 35 cm below the ceiling, the bottom rod at the midpoint between the top rod and the floor
- [ ] Layout 4 renders the split fixture occupying the bottom 140 cm with shelves above
- [ ] Layout 5 renders a single rod with the GLB top at 140 cm and shelves above
- [ ] Layout 6 renders one rod 35 cm below the ceiling and exactly one shelf 35 cm above the floor
- [ ] Layout 7 renders a drawer in the bottom 70 cm and a rod 35 cm below the ceiling, with the gap between them open
- [ ] Layout 8 renders a desk in the bottom 70 cm and shelves starting from 175 cm
- [ ] All eight layouts hold their proportions across short, normal and tall slot heights — anchors track the ceiling/floor as expected
- [ ] Old GLBs deleted from `public/objects/` (the seven listed above)
- [ ] Wasmachinekast configurator visually unchanged
- [ ] Manual visual pass through all eight layouts at minimum, default, and maximum closet heights

## Blocked by

- Blocked by `module-layout-2-anchors-fillzone.md`
