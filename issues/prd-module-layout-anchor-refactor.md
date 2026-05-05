# PRD — Module Layout Anchor Refactor

## Problem Statement

The kledingkast and wasmachinekast configurators expose 8 closet module layouts (shelves, drawers, rods, split, desk, etc.). Today each layout is a single GLB with a hard-coded height, anchored only to the bottom (or top, or a fixed Y) of the slot. This blocks two needs the design now requires:

1. A layout cannot place a fixture at a constant distance **from the top** of the module, regardless of slot height — e.g. "the rod must always sit 35 cm below the ceiling" so all closets read visually consistent.
2. A layout cannot combine **multiple GLBs** at independent anchors — e.g. the new double-rod layout needs two rods at different heights, the drawer-plus-rod layout needs two distinct GLBs.

The result is that the eight layouts are visually inconsistent across slot heights and a few of the new mainmodule GLBs (`RodModule.glb`, `DrawerModule.glb`, `SplitModule.glb`, `DeskModule.glb`) cannot be wired in at all without bespoke per-layout branches in the renderer.

## Solution

Rebuild the layout schema around a small, declarative anchor system and an array of independent elements per layout.

- A layout owns an `elements` array. Each element points at a GLB (or null for a placeholder) and has its own anchor.
- Anchors come in four forms: `fromBottom(d)` (bbox bottom at Y=d), `fromTop(d)` (bbox top at Y=roofY-d), `bboxTopAt(d)` (bbox top at Y=d, used when the spec says "X cm starting from floor" and the GLB top is the visible reference), and `midpoint(refIndex)` (bbox top at the midpoint between Y=0 and the referenced sibling's bbox top).
- Anchor resolution is a pure function of layout + slot height. Independent anchors resolve first, midpoint anchors second.
- The fill zones above and below the elements gain optional explicit `startY`/`endY` overrides plus a new `fixedShelves` variant for cases where exactly one shelf at a fixed height is wanted (rather than spacing-distributed shelves).

User-facing behaviour is preserved: the eight layouts keep the same IDs, ordering, labels, descriptions, SVG thumbnails and Sanity-driven pricing. Visually the modules look almost the same — the GLBs swap to the new mainmodule set and anchors line up the way the design now requires.

## User Stories

1. As a customer configuring a closet, I want all single-rod modules to hang the rod 35 cm below the ceiling, so that my closet reads visually consistent regardless of how tall the closet is.
2. As a customer, I want the double-rod layout to show two rods at sensible heights for hanging clothes, so that the closet is actually usable as a double-hang wardrobe.
3. As a customer, I want the rod-and-shelf layout to show one shelf 35 cm above the floor and one rod 35 cm below the ceiling, so that I have a clear hanging area and a single shelf for storage at floor level.
4. As a customer, I want the drawer-and-rod layout to show drawers in the bottom 70 cm and a rod 35 cm below the ceiling, so that I can store folded clothes below and hang clothes above.
5. As a customer, I want the desk layout to show a desk in the bottom 70 cm and shelves starting only at 175 cm, so that I have a comfortable desk surface with shelves above head height when seated.
6. As a customer, I want the split layout to show the split fixture occupying the bottom 140 cm and shelves above, so that the split offers both hanging and shelving in the lower portion and storage above.
7. As a customer, I want the single-rod-140-cm layout to place the rod at 140 cm with shelves above, so that I have a deep hanging area with extra storage on top.
8. As a customer, I want the drawer layout to show drawers in the bottom 70 cm with shelves above, so that I have folded-clothes drawers and shelves for the rest.
9. As a customer, I want the shelves-only layout to fill the entire module with evenly spaced shelves, so that I can store many small items.
10. As a designer, I want all layouts to keep their existing IDs (1 through 8), so that selection thumbnails, Sanity pricing rows and existing UI continue to work without renaming.
11. As a designer, I want the layout labels and SVG thumbnails to remain unchanged for this refactor, so that copy and design assets are not blocked on this work.
12. As a developer, I want each module element placed via a declarative anchor instead of a hard-coded Y, so that I can add new layouts by writing config rather than renderer branches.
13. As a developer, I want the anchor system to support "X cm from the top" so that future layouts can place fixtures relative to the ceiling.
14. As a developer, I want a layout to hold multiple elements with independent anchors, so that combinations like drawer-plus-rod or double-rod don't require special-case rendering.
15. As a developer, I want the anchor resolver to be a pure function with no Three.js dependency, so that I can unit-test placement math without a renderer.
16. As a developer, I want the fill zone to take optional explicit `startY` and `endY` so that desk-style layouts can leave the area above the desk empty up to a chosen shelf height.
17. As a developer, I want a `fixedShelves` fill type so that I can place exactly one shelf at a known Y without abusing the spacing-based shelf math.
18. As a developer, I want each GLB anchored against its bounding-box bottom (matching the existing X-axis convention), so that I do not have to re-author GLBs to a specific origin point.
19. As a developer, I want the rendering layer to map over `layout.elements` and stamp out one `SpecialElement` per entry, so that there is no per-layout conditional logic in the orchestrator.
20. As a maintainer of the wasmachinekast configurator, I want the existing washer layouts to migrate to the new schema mechanically (1-element arrays), so that I do not need to fork the renderer.
21. As a customer using the wasmachinekast, I want washer modules to render exactly as they do today, so that the kledingkast refactor does not regress washer placement, materials, or the door-depth offset.
22. As a customer with a saved configuration, I accept that this is a clean redesign and old saves may render differently because layout 3, 6 and 8 change geometry.
23. As a developer, I want the obsolete GLBs in `/objects/` deleted once the new layouts are wired up, so that the public folder doesn't carry unused assets.
24. As a developer testing the configurator, I want the existing `__tests__/moduleLayouts.test.ts` updated to the new schema, so that the test suite continues to cover layout shape and pricing wiring.

## Implementation Decisions

**Schema.** `ModuleLayoutConfig` exposes `elements: ModuleElement[]` plus `fillZone: { above, below }`. Each `ModuleElement` carries `glbPath` (string or null), `anchor`, optional material override sets (`glbMaterialMeshes`, `chromeMaterialMeshes`, `glassMaterialMeshes`), and the washer-only flags `centered`, `noDoorDepthOffset`, and `placeholderDimensions`. The legacy `stacked`, `double`, `height` fields and the singular `specialElement` field are removed.

**Anchor types.** Four variants: `fromBottom`, `fromTop`, `bboxTopAt`, `midpoint`. The first three are independent. `midpoint` references a sibling by index and is resolved in a second pass. No nested midpoints.

**Reference point.** All anchors are evaluated against the GLB's runtime bounding box. The renderer subtracts `box.min.y` when computing each element's group Y, mirroring the existing `offsetX = -box.min.x + MODULE_WALL` convention. GLB authors do not need to put the origin at any specific reference point.

**Anchor resolver.** A new pure function `resolveElementPositions(layout, roofY, bboxes)` returns `{ elementYs, fillAbove, fillBelow }`. It replaces the existing `computeModulePositions`. Bboxes are passed in so the function stays pure and testable without `useGLTF`.

**Fill zone.** `FillShelves` gains optional `startY` and `endY`. A new `FillFixedShelves` variant carries `positions: number[]` (Y values from module floor). When `startY` is explicit on a `shelves` fill, the first shelf sits at exactly that Y and subsequent shelves step by `spacing`. When `startY` is not explicit, today's "floor-aligned past element top" behaviour is preserved.

**Default fill bounds.** With elements present, fill-above defaults to `startY = max(element.bboxTop)` and `endY = roofY`; fill-below defaults to `startY = 0` and `endY = min(element.bboxBottom)`. With no elements, fill-above runs floor to roofY and fill-below is empty.

**Renderer split.** `Module.tsx` maps `layout.elements` to one `SpecialElement` per entry. `SpecialElement` becomes a single-element renderer; the multi-element duplication paths (`stacked`, `double`) are removed. Materials and the existing hover/animation logic remain per-element.

**Wasmachinekast migration.** Each washer config (`WASHER_SINGLE`, `WASHER_DOUBLE_GLB`, `WASHER_PLANK`) migrates to a 1-element array. The `centered`, `noDoorDepthOffset` and material-mesh fields move from the singular `specialElement` onto the single element. `getWasmLayoutConfig` continues to fall back to `getLayoutById` for non-washer IDs, unchanged in shape.

**Layout 1 (shelves only).** Modelled as `elements: []`. Fill-above runs floor → roofY, fill-below empty.

**Layouts 2 / 4 / 5 / 8.** Single element, anchored. L2 drawer `fromBottom(0)` with `shelves` above. L4 split `bboxTopAt(1.40)` with `shelves` above. L5 single rod `bboxTopAt(1.40)` with `shelves` above. L8 desk `fromBottom(0)` with `shelves` above using explicit `startY: 1.75`.

**Layout 3 (double rod).** Two elements, both `RodModule.glb`. Top rod `fromTop(0.35)`. Bottom rod `midpoint(0)` — bbox top at the midpoint of 0 and the top rod's bbox top. Both fill zones `open`.

**Layout 6 (rod + shelf).** One rod element `fromTop(0.35)`. Fill-below `fixedShelves` with positions `[0.35]`. Fill-above `open`.

**Layout 7 (drawer + rod).** Two elements. Drawer `fromBottom(0)`, rod `fromTop(0.35)`. Both fill zones `open`.

**Old GLBs.** Once the new layouts are live, the old kledingkast GLBs (`ModuleDrawer.glb`, `ModuleDoubleRod.glb`, `ModuleSplit.glb`, `ModuleSingleRod.glb`, `ModuleShelfRod.glb`, `ModuleDrawerRod.glb`, `ModuleDesk.glb`) are deleted from `public/objects/`. Washer GLBs in `public/objects/washermodules/` are untouched.

**Layout IDs.** IDs 1 through 8 are preserved and map to the new specs in the same order. Saved configurations referencing those IDs will render the new geometry; this is accepted as a clean redesign.

## Testing Decisions

A good test here exercises external behaviour: given a layout and a slot height, the resolver returns the right element Ys and fill-zone bounds; given a fill config and a band, the shelf-position helper returns the right list of shelf Ys. Tests do not assert GLB internals, mesh names, materials, or React render output.

Two pure modules get unit tests:

- `resolveElementPositions(layout, roofY, bboxes)`. Covers the four anchor types (`fromBottom`, `fromTop`, `bboxTopAt`, `midpoint`), the empty-elements case (layout 1), and the two-element case (layouts 3 and 7). Verifies fill-zone defaults (max bboxTop / min bboxBottom) and the explicit `startY` override (layout 8).
- `computeShelfPositions(fillConfig, startY, endY, spacing, fillToTop)`. Covers `shelves` (with and without explicit `startY`), `fixedShelves`, and `open`. Verifies the "first shelf at startY when explicit, floor-aligned past element top when not" rule.

Prior art: `app/(configurator)/wasmachinekast/__tests__/moduleLayouts.test.ts` and the kledingkast `__tests__/store.test.ts` style — Vitest, no JSX, no Three. Existing layout-shape tests are updated mechanically to the new schema.

Renderer changes (`SpecialElement.tsx`, `Module.tsx`, `FillZone.tsx`'s JSX) are not unit-tested; they are validated visually in the running configurator.

## Out of Scope

- Sanity-side `ModuleLayout` content updates (shelf / rod / drawer counts driving pricing). Pricing data lives in Sanity and is updated by the team separately if the new geometry shifts cost assumptions.
- `LayoutSvgs.tsx` thumbnails. Geometry has shifted for layouts 3, 6 and 8 but the visuals remain close enough that the SVGs stay until a separate design pass.
- Dutch labels and descriptions in `MODULE_LAYOUTS`. Several entries say "Laden onderin, planken erboven" which doesn't match the new geometry; copy is left alone for now.
- The "dubbele module" (slot-spanning) feature — already implemented and orthogonal to this refactor.
- Pricing, accessory, door, handle, installation tier logic — untouched.
- The back-diagonal corpus and room-fill work currently in flight on this branch.

## Further Notes

The four-anchor system was chosen over a function-valued anchor because all eight current layouts can be expressed declaratively, which keeps the config readable and unit-testable. If a future layout requires placement that none of the four anchors describe (e.g. anchoring against an arbitrary fraction of slot height), a fifth named anchor variant can be added without restructuring.

`bboxTopAt` exists specifically to express the spec phrasing "X cm height starting from module floor", where the GLB's top edge is the visible reference. Keeping it as a named anchor (rather than asking config to compute `fromBottom(d - elementHeight)`) means config never duplicates the renderer's bbox math.

The rod GLB (`RodModule.glb`) bundles a small shelf piece below the rod; the user has confirmed that "35 cm from the top" refers to the GLB's bbox top, which lands at the rod itself. The embedded shelf is part of the fixture and is intentional.

For layouts 4 and 5, "140 cm starting from module floor" means the GLB's bbox top sits at 140 cm, and shelves above stack with the standard 35 cm spacing — first shelf falls at 175 cm, matching the closet shelf grid.

For layout 8, the explicit `startY: 1.75` produces the first shelf at exactly 175 cm. This is the only layout that uses the override; everywhere else the default floor-aligned spacing applies.
