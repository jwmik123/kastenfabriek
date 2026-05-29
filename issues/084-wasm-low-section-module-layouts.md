# Wasmachinekast: register initial low-section module layouts

## Parent

[prd-wasmachinekast-low-section.md](prd-wasmachinekast-low-section.md)

## What to build

Register four new module layouts that are pickable only inside a **lage kast**. GLB assets already exist in `public/objects/washermodules/`:

- `12_WMPlankLow.glb` — non-washer module (shelf-style)
- `13_WMSingleLow.glb` — non-washer module
- `14_WMDoubleLow.glb` — non-washer module
- `15_WMOpen.glb` — **washer module** (the under-counter washer bay; the only washer option in a lage kast)

> Naming note: the `WM` prefix is "Wasmachinekast" (the cabinet), not "washing machine". The numeric prefix in the filenames is a sort-order, **not** the layoutId. Existing washer layoutIds 11/13/14 must not be reused. This issue assigns fresh IDs 20–23 to avoid collision. Confirm before merging.

> Role split: `15_WMOpen` is a **washer** layout and joins `WASHER_LAYOUTS` (picked in the Wasmachine step). The other three are **regular non-washer** module layouts (picked in the Modules step / indeling picker). This is enforced by where the constant lives, not just by `sectionType`.

### 1. Catalogue entries in [moduleLayouts.ts](app/(configurator)/wasmachinekast/moduleLayouts.ts)

**a. `15_WMOpen` — add as washer layout** (joins `WASHER_LAYOUTS`):

- new `layoutId` (e.g. 23)
- `name`, `description`
- `contents: { shelves: 0, rods: 0, drawers: 0, hasWashingMachineShelf: true }` (same pattern as `WASHER_SINGLE`)
- `minSlotWidth` per real GLB footprint (the GLB max X is ~0.80m, so likely 80 cm — verify)
- `priceSingle: 0`, `priceDouble: 0`
- `availableForTopCabinet: false`
- **`sectionType: 'low'`**

Add it to the `WASHER_LAYOUTS` array so `WASHER_LAYOUT_IDS` automatically picks it up. Existing washer-aware code (store, scene, `WasherStep`) then treats it uniformly with `WASHER_SINGLE`/`DOUBLE_GLB`/`PLANK`.

**b. Flip existing washer layouts to `'high'`** (PRD line 97 is superseded by editorial decision: `15_WMOpen` is the *only* washer option in a lage kast):

- `WASHER_SINGLE.sectionType: 'both'` → `'high'`
- `WASHER_DOUBLE_GLB.sectionType: 'both'` → `'high'`
- `WASHER_PLANK.sectionType: 'high'` (unchanged)

Effect: `filterForSection(WASHER_LAYOUTS, 'low')` returns only `15_WMOpen`, so the Wasmachine step's type picker for lage kast shows exactly one choice.

**c. `12`, `13`, `14` — add as non-washer regular layouts** (new array `WASM_LOW_MODULE_LAYOUTS`):

- new `layoutId`s (e.g. 20, 21, 22)
- `name`, `description`, `contents` (shelves/rods/drawers counts for pricing — `hasWashingMachineShelf: false`)
- `minSlotWidth` per real GLB footprint
- `priceSingle: 0`, `priceDouble: 0` (free unless a Sanity doc is added; see step 3)
- `availableForTopCabinet: false`
- **`sectionType: 'low'`**

These are NOT washer entries — keep them out of `WASHER_LAYOUTS`. They flow into the indeling/modules picker only.

### 2. Render configs in [moduleLayoutConfigs.ts](app/(configurator)/wasmachinekast/moduleLayoutConfigs.ts)

One `ModuleLayoutConfig` per new layoutId (all four):

- `id` matching the layoutId
- `elements[]` with `glbPath`, `anchor` (likely `fromBottom: 0`), `centered: true`, and mesh-name arrays for material slots (`glbMaterialMeshes`, `chromeMaterialMeshes`, `glassMaterialMeshes`) — read from the GLBs (Blender or three.js inspector). E.g. `15_WMOpen` has meshes `WMOpenBack_ws`, `WMOpenLeft_ds`, `WMOpenRight_ds`, `WMOpenTop_ws`.
- `fillZone` — for low section: `above: { type: 'closed' }` (capped by werkblad) and `below: { type: 'closed' }` (sits on plinth). Diverges from existing tall-section washer configs which use `open/open`.
- `minSlotHeight: 0.90` (or smaller if the module doesn't fill the full lage kast)

Register each in the `WASHER_CONFIGS` map (rename below).

### 3. Sanity entries (optional, only if priced)

Create matching Sanity `moduleLayout` documents with the same `layoutId`, `sectionType: 'low'`, and prices. `getWasmModuleLayouts()` already merges Sanity prices onto the hardcoded washer entries; extend it to also merge onto `WASM_LOW_MODULE_LAYOUTS`. Skip if these are free.

### 4. Rename for the non-washer array, not the washer array

`WASHER_LAYOUTS` keeps its name (it still contains only washer entries — now four: SINGLE, DOUBLE_GLB, PLANK, WMOPEN). Do NOT rename it.

Rename only the *config* map if helpful: `WASHER_CONFIGS` → `WASM_HARDCODED_CONFIGS`, because that map covers both washer and non-washer render configs. Update call sites: `getWasmLayoutConfig`, etc.

`getWasmModuleLayouts(sanityLayouts)` is extended to also append non-washer hardcoded entries (with Sanity price merge, like washers). `randomFill` consumes the merged list — confirm low-section random fill draws from `WASM_LOW_MODULE_LAYOUTS` only when the slot is in a lage kast (filtered via `filterForSection`).

## Acceptance criteria

- [ ] `15_WMOpen` registered as a washer entry in `WASHER_LAYOUTS` with `sectionType: 'low'`, `hasWashingMachineShelf: true`, fresh non-colliding `layoutId`, and is picked up by `WASHER_LAYOUT_IDS`.
- [ ] `12_WMPlankLow`, `13_WMSingleLow`, `14_WMDoubleLow` registered as non-washer entries in a new `WASM_LOW_MODULE_LAYOUTS` array with `sectionType: 'low'` and fresh non-colliding `layoutId`s.
- [ ] `WASHER_SINGLE` and `WASHER_DOUBLE_GLB` flipped from `sectionType: 'both'` to `'high'`. `WASHER_PLANK` remains `'high'`.
- [ ] In the Wasmachine step (step 3) with the active section = lage kast, the type picker shows **only** `15_WMOpen`. In hoge kast it shows `WASHER_SINGLE`, `WASHER_DOUBLE_GLB`, `WASHER_PLANK`.
- [ ] Four new `ModuleLayoutConfig` constants exist in `moduleLayoutConfigs.ts` with correct GLB paths, anchors, mesh names, and lage-kast-appropriate `fillZone`.
- [ ] All four GLBs render correctly inside a lage kast slot in the dev server (verified after #080 ships, or in a temporary harness scene).
- [ ] `WASHER_CONFIGS` renamed to `WASM_HARDCODED_CONFIGS` with call sites updated (`getWasmLayoutConfig`, etc.). `WASHER_LAYOUTS` keeps its name.
- [ ] `getWasmModuleLayouts()` merges Sanity prices onto both `WASHER_LAYOUTS` and `WASM_LOW_MODULE_LAYOUTS` entries.
- [ ] `filterForSection` returns the three new non-washer layouts when filtering for `'low'` and excludes them when filtering for `'high'`.
- [ ] `randomFill` in the store does not place the new low-section layouts in a hoge kast slot (filtered by section before random selection).
- [ ] Type check (`tsc`) clean.
- [ ] LayoutId assignment (20–23) confirmed by domain owner before merge — or alternate IDs picked.

## Blocked by

- Blocked by #075 (consumes `wasmModuleLayoutFilter`)
- Blocked by #079 (requires `sectionType` field in the schema + on existing docs)
