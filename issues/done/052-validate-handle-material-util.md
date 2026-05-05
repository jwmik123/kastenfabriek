# 052 — `validateHandleMaterial` pure util + unit tests

## Parent

PRD: [issues/prd-doorhandles-grid-and-materials.md](./prd-doorhandles-grid-and-materials.md)

## What to build

A pure resolver utility that decides which metal finish a handle should display given the user's currently selected finish and the handle's `allowedMaterials` list. This is the single source of truth for the store invariant `(doorHandleId, doorHandleMaterial)` enforced in slice 055.

This slice is foundation only — no store wiring or UI usage in this issue. The util ships with full unit-test coverage so the validation contract is locked before stores adopt it.

## Acceptance criteria

- [ ] `validateHandleMaterial` exists as a pure function exported from a shared utils location consumable by both stores (e.g. `_shared/utils/`)
- [ ] Signature accepts: `currentMaterial: HandleMaterial`, `allowedMaterials: HandleMaterial[] | undefined`
- [ ] Returns a `HandleMaterial` that is guaranteed valid: `currentMaterial` if it is in `allowedMaterials`, otherwise the first entry of `allowedMaterials`
- [ ] When `allowedMaterials` is `undefined` or empty, the function treats every metal as allowed and returns `currentMaterial` unchanged
- [ ] When `currentMaterial` is somehow outside the full metal union (defensive case), the function returns a stable default (e.g. `'chrome'`)
- [ ] Type signature uses the `HandleMaterial` union from `_shared/constants/handleMaterials.ts` (created in slice 054); if that module does not yet exist when this issue is taken first, define a minimal local union and refactor in slice 054
- [ ] Unit tests cover: current is in allowed → pass-through; current is not in allowed → returns first allowed; allowed undefined → pass-through; allowed empty → pass-through; defensive fallback path
- [ ] Tests follow the style of existing pure-function tests (e.g. `computePopoverPlacement.test.ts`)
- [ ] No changes to the existing step files, stores, schema, or `Handles.jsx` in this issue

## Blocked by

None - can start immediately.
