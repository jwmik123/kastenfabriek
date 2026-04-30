# 004 — Wasmachinekast scene + step wizard + washing machine module

## Parent PRD

`issues/prd-wasmachinekast-configurator.md`

## What to build

Build the complete wasmachinekast configurator UI end-to-end: the 3D scene, the 5-step wizard, the washing machine module catalog, and the page at `/wasmachinekast`.

### 3D scene

`WasmachinekastScene.tsx` — composes `ClosetCorpus`, `Module`s, plinth, and room walls from `_shared/three/`. Always passes `diagParams` with `diagonalSide: 'none'`. No diagonal structural shelves, no light strip instancing (out of scope). Wired to the wasmachinekast store via `ConfiguratorStoreContext.Provider`.

### Module layout catalog

`wasmachinekast/moduleLayouts.ts` — the wasmachinekast layout registry, populated from Sanity (same pattern as kledingkast). Includes:
- Standard layouts (shelves, drawers, rod, etc.) shared with kledingkast via Sanity
- A single-machine washer layout: fixed dimensions, 75cm minimum slot width
- A double-machine washer layout: fixed dimensions, 150cm minimum slot width (span 2)

Each layout entry that has a minimum slot width requirement carries that constraint so the store's `setModuleLayout` can enforce it (see `003`).

### Step wizard

5 steps mirroring kledingkast, with these differences:
- **DimensionsStep** — width, height, depth sliders/inputs only. No diagonal wall controls. No placement type selector. Depth minimum is 65cm.
- **ModulesStep** — pick layout per slot including washer layouts. Slots too narrow for the washer layout have it disabled/greyed out.
- **MaterialStep** — identical to kledingkast
- **DoorHandlesStep** — identical to kledingkast
- **AccessoiresStep** — simplified (no lighting strips for now)

### Page

`wasmachinekast/page.tsx` at route `/wasmachinekast`. Wraps the configurator in `ConfiguratorStoreContext.Provider` with the wasmachinekast store. Fetches Sanity pricing data and calls `hydrate` on mount.

Mobile bottom sheet layout follows the same pattern as the kledingkast mobile sheet.

## Acceptance criteria

- [ ] `/wasmachinekast` route exists and renders the configurator
- [ ] 3D scene renders a rectangular cabinet (no diagonal geometry) using shared primitives
- [ ] All 5 wizard steps are navigable
- [ ] DimensionsStep has no diagonal controls; depth input enforces 65cm minimum
- [ ] Washer module layouts appear in ModulesStep and can be placed in any slot
- [ ] Slots too narrow for the washer layout show it as unavailable
- [ ] Double-machine washer layout spans 2 slots (150cm)
- [ ] Material, door handle, and accessories steps function correctly
- [ ] Mobile bottom sheet renders correctly on small viewports
- [ ] 3D model updates live as configuration changes
- [ ] Measurements overlay works
- [ ] Zoom / orbit controls work
- [ ] Kledingkast configurator is unaffected

## Blocked by

- `issues/002-migrate-kledingkast-primitives-to-context.md`
- `issues/003-wasmachinekast-store-and-tests.md`

## User stories addressed

- User story 1 (own URL)
- User story 2 (set width)
- User story 3 (set height)
- User story 4 (set depth ≥ 65cm)
- User story 5 (choose module count)
- User story 6 (place washer module in any slot)
- User story 7 (75cm single / 150cm double)
- User story 8 (layouts for non-washer slots)
- User story 9 (material choice)
- User story 10 (door handles)
- User story 11 (doors per module)
- User story 12 (live 3D preview)
- User story 16 (step wizard)
- User story 17 (zoom / orbit)
- User story 18 (measurements overlay)
- User story 19 (depth minimum enforced in UI)
- User story 20 (washer slot min-width visible in UI)
- User story 21 (mobile bottom sheet)
