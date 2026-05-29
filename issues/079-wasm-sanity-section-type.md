# Wasmachinekast: Sanity schema — moduleLayout.sectionType + accessory.availableForLowSection

## Parent

[prd-wasmachinekast-low-section.md](prd-wasmachinekast-low-section.md)

## What to build

Add two Sanity schema fields and deploy. Editorial work (assigning real values to existing documents) is included — this is a **HITL** slice.

Schema:
- `moduleLayout.sectionType: 'high' | 'low' | 'both'` with default `'both'`. Pickable in the studio as a radio/select with clear labels.
- `accessory.availableForLowSection: boolean` with default `true`.

Editorial:
- Existing `moduleLayout` documents reviewed and assigned a `sectionType` per real fit. Bare washer GLBs → `'both'`. WASHER_PLANK (washer-with-shelf-above) → `'high'`. Hanging rails, full-height drawers → `'high'`. Plain shelves, plain doors, drawer blocks that fit a 90cm box → `'both'`.
- Existing `accessory` documents reviewed and `availableForLowSection` set to `false` for any accessory that physically can't fit a 90cm cabinet (e.g. pull-out hanging rail, full-height side panels).

Code:
- Pricing-data fetch + types extended to carry the two new fields.
- `wasmModuleLayoutFilter` (from #075) is now consumed by `ModulesStep` to filter the GLB picker based on the active section (high-only in this slice, so filter passes everything with `sectionType ∈ {'high', 'both'}`).

## Acceptance criteria

- [ ] Sanity studio shows the new `sectionType` field on `moduleLayout` documents with three radio options.
- [ ] Sanity studio shows the new `availableForLowSection` boolean on `accessory` documents.
- [ ] All existing `moduleLayout` documents have a `sectionType` value populated (no nulls) and the assignments have been reviewed by a domain owner.
- [ ] All existing `accessory` documents have `availableForLowSection` populated.
- [ ] `WASHER_PLANK` constant in `moduleLayouts.ts` carries `sectionType: 'high'`; `WASHER_SINGLE` and `WASHER_DOUBLE_GLB` carry `sectionType: 'both'`.
- [ ] `ModulesStep` in wasmachinekast uses `wasmModuleLayoutFilter` to filter GLBs; today this is still effectively a no-op because only `'high'` is the active section, but the filter is in place.
- [ ] Kledingkast moduleLayout filtering is unaffected.
- [ ] TypeScript types for `ModuleLayout` and `Accessory` updated.

## Blocked by

- Blocked by #075 (uses `wasmModuleLayoutFilter` for the ModulesStep wiring).

The schema and editorial parts can proceed in parallel with #075; only the final wiring step requires it.
