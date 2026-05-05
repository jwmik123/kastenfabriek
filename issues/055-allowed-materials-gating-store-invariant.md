# 055 — Sanity `allowedMaterials` + per-handle gating + store invariant

## Parent

PRD: [issues/prd-doorhandles-grid-and-materials.md](./prd-doorhandles-grid-and-materials.md)

## What to build

Wire the `allowedMaterials` field end-to-end so editors can constrain finishes per handle in Sanity Studio and the configurator never displays or persists a finish that the selected handle disallows. The swatch row filters to the allowed list per handle, and both Zustand stores enforce the `(doorHandleId, doorHandleMaterial)` invariant via `validateHandleMaterial` from issue 052.

## Acceptance criteria

**Schema + data**

- [ ] `sanity/schemaTypes/handle.ts` adds an `allowedMaterials` field: array of strings, `options.list` enumerating the 9 metal ids from `METALS` (slice 054), `layout: 'grid'`, `Rule.unique()`, not required
- [ ] Field description states that leaving the value empty means all finishes are allowed
- [ ] GROQ projection in `lib/configurator/queries.ts` returns `allowedMaterials` on each handle
- [ ] `HandleType` in `types/configurator-pricing.ts` gains `allowedMaterials?: HandleMaterial[]`

**Store invariant (both configurators)**

- [ ] `setDoorHandleId` calls `validateHandleMaterial` against the new handle's `allowedMaterials` and rewrites `doorHandleMaterial` if it is no longer valid
- [ ] `setDoorHandleMaterial` calls `validateHandleMaterial` against the current handle's `allowedMaterials` and rewrites the value if it is not allowed
- [ ] `setPricingData` (and the snapshot/hydration path that flows through it) re-validates `(doorHandleId, doorHandleMaterial)` once handles are known
- [ ] Empty / missing `allowedMaterials` is treated as "all metals allowed" — no rewrite occurs
- [ ] Logic is identical in `kledingkast/store.ts` and `wasmachinekast/store.ts`

**UI**

- [ ] The swatch row renders only swatches whose ids appear in the selected handle's `allowedMaterials` (or all 9 if the field is empty/missing)
- [ ] When `allowedMaterials` allows exactly one finish, that single swatch is rendered selected; the row is not hidden
- [ ] The finish section continues to be hidden when push-to-open is the active selection

**Tests**

- [ ] Store tests in `kledingkast/__tests__/store.test.ts` and `wasmachinekast/__tests__/store.test.ts` cover: handle switch with disallowed current material → material is rewritten to first allowed; setting a disallowed material → rewritten; loading pricing data after a hydrated snapshot with an invalid combination → corrected; push-to-open does not interfere with validation
- [ ] All existing tests in both store test files continue to pass

**Verification**

- [ ] Verified manually: in Studio, restrict a handle to two finishes; in the configurator, only those two swatches appear when that handle is selected, and switching to a handle that allows only one finish auto-corrects an incompatible current selection

## Blocked by

- Blocked by #052
- Blocked by #054
