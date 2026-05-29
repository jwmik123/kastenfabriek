# Wasmachinekast: register initial low-section module layouts

## Parent

[prd-wasmachinekast-low-section.md](prd-wasmachinekast-low-section.md)

## What to build

Register four new module layouts that are pickable only inside a **lage kast**. GLB assets already exist in `public/objects/washermodules/`:

- `12_WMPlankLow.glb`
- `13_WMSingleLow.glb`
- `14_WMDoubleLow.glb`
- `15_WMOpen.glb`

> Naming note: the numeric prefix in the filenames is a sort-order, **not** the layoutId. Existing washer layoutIds 11/13/14 must not be reused. This issue assigns fresh IDs 20–23 to avoid collision. Confirm before merging.

Per layout, both registration files are updated:

1. **Catalogue entry** in [moduleLayouts.ts](app/(configurator)/wasmachinekast/moduleLayouts.ts) — `ModuleLayout` constant with:
   - new `layoutId` (20, 21, 22, 23)
   - `name`, `description`, `contents` (for pricing — shelves/rods/drawers counts)
   - `minSlotWidth` per real GLB footprint
   - `priceSingle: 0`, `priceDouble: 0` (free unless a Sanity doc is added; see step 3)
   - `availableForTopCabinet: false`
   - **`sectionType: 'low'`** — gates the picker via `wasmModuleLayoutFilter` (#075)
   
   Add each new constant to the hardcoded array.

2. **Render config** in [moduleLayoutConfigs.ts](app/(configurator)/wasmachinekast/moduleLayoutConfigs.ts) — `ModuleLayoutConfig` constant with:
   - `id` matching the layoutId
   - `elements[]` with `glbPath`, `anchor` (likely `fromBottom: 0`), `centered: true`, and mesh-name arrays for material slots (`glbMaterialMeshes`, `chromeMaterialMeshes`, `glassMaterialMeshes`) — read from the GLBs (Blender or three.js inspector)
   - `fillZone` — for low section likely `above: { type: 'closed' }` (capped by werkblad) and `below: { type: 'closed' }` (sits on plinth). Diverges from existing tall-section washer configs which use `open/open`.
   - `minSlotHeight: 0.90` (or smaller if the module doesn't fill the full lage kast)
   
   Register each in the `WASHER_CONFIGS` map (rename below).

3. **Sanity entries (optional, only if priced)** — create matching Sanity `moduleLayout` documents with the same `layoutId`, `sectionType: 'low'`, and prices. `getWasmModuleLayouts()` already merges Sanity prices onto the hardcoded entries. Skip if these are free.

4. **Rename** `WASHER_LAYOUTS` → `WASM_HARDCODED_LAYOUTS` (and `WASHER_CONFIGS` → `WASM_HARDCODED_CONFIGS`). The arrays no longer contain only washers. Update all call sites including `randomFill`, `getWasmModuleLayouts`, and `getWasmLayoutConfig`.

## Acceptance criteria

- [ ] Four new `ModuleLayout` constants exist in `moduleLayouts.ts` with `sectionType: 'low'` and fresh, non-colliding layoutIds.
- [ ] Four new `ModuleLayoutConfig` constants exist in `moduleLayoutConfigs.ts` with correct GLB paths, anchors, mesh names, and lage-kast-appropriate `fillZone`.
- [ ] All four GLBs render correctly inside a lage kast slot in the dev server (verified after #080 ships, or in a temporary harness scene).
- [ ] `WASHER_LAYOUTS` renamed to `WASM_HARDCODED_LAYOUTS` (and `WASHER_CONFIGS` likewise) with all call sites updated.
- [ ] `wasmModuleLayoutFilter` correctly returns the four new layouts when filtering for `'low'` and excludes them when filtering for `'high'`.
- [ ] Existing washer layouts (11, 13, 14) continue to render unchanged and retain `sectionType: 'high'` (or `'both'` per #079's editorial decision).
- [ ] `randomFill` in the store does not place the new low-section layouts in a hoge kast slot (filtered by section before random selection).
- [ ] Type check (`tsc`) clean.
- [ ] LayoutId assignment (20–23) confirmed by domain owner before merge — or alternate IDs picked.

## Blocked by

- Blocked by #075 (consumes `wasmModuleLayoutFilter`)
- Blocked by #079 (requires `sectionType` field in the schema + on existing docs)
