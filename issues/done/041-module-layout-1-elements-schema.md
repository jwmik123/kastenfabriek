# Slice 1 — Migrate `ModuleLayoutConfig` to `elements` array (behavior-preserving)

## Parent

PRD: `issues/prd-module-layout-anchor-refactor.md`

## What to build

Refactor the closet module layout schema so each layout owns an `elements: ModuleElement[]` array instead of a singular `specialElement`. This slice is purely structural — every kledingkast and wasmachinekast layout migrates to a 1-element array (or empty array for shelves-only), keeps its existing GLB path, and renders with the same anchor semantics it has today. The configurator must look pixel-identical after this slice lands.

End-to-end:

- `ModuleLayoutConfig` exposes `elements: ModuleElement[]` plus `fillZone: { above, below }`.
- `ModuleElement` carries `glbPath`, `anchor`, optional material override sets, and the washer-only flags `centered`, `noDoorDepthOffset`, `placeholderDimensions`.
- The legacy `stacked`, `double`, `height` fields and the singular `specialElement` field are removed.
- `Module.tsx` maps `layout.elements` to N `<SpecialElement>` instances.
- `SpecialElement.tsx` becomes a single-element renderer (no `stacked`/`double` branches), and subtracts `box.min.y` when computing group Y so the anchor measures against the GLB bbox bottom.
- A new pure function `resolveElementPositions(layout, roofY, bboxes)` returns `{ elementYs, fillAbove, fillBelow }` and replaces `computeModulePositions`.
- The existing anchor types (`fromBottom`, `fromTop`, `fixed`) are preserved. `fixed` collapses into `fromBottom` since the only current use sites are equivalent.
- The wasmachinekast configs (`WASHER_SINGLE`, `WASHER_DOUBLE_GLB`, `WASHER_PLANK`) migrate mechanically to 1-element arrays. `centered`, `noDoorDepthOffset` and material-mesh fields move onto the single element.

## Acceptance criteria

- [ ] `ModuleLayoutConfig` no longer has a singular `specialElement` field; `elements` array is the sole content carrier
- [ ] All eight kledingkast layouts (IDs 1–8) keep their existing GLB and visual placement
- [ ] All three washer layouts (IDs 11, 13, 14) keep their existing GLB and visual placement, including the door-depth offset and centered behavior
- [ ] `Module.tsx` renders one `<SpecialElement>` per element entry
- [ ] `SpecialElement.tsx` no longer references `stacked`/`double` and subtracts `box.min.y` when positioning
- [ ] `resolveElementPositions(layout, roofY, bboxes)` is exported as a pure function and is unit-tested for `fromBottom` and `fromTop` anchor cases, including the empty-elements case (layout 1)
- [ ] `wasmachinekast/__tests__/moduleLayouts.test.ts` is updated to the new schema and passes
- [ ] Manual smoke: open the kledingkast and wasmachinekast configurators, switch through every layout, verify visual parity with the previous build

## Blocked by

None - can start immediately.
