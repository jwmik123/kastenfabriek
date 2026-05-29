# Wasmachinekast: pure modules + tests for sections feature

## Parent

[prd-wasmachinekast-low-section.md](prd-wasmachinekast-low-section.md)

## What to build

Add five pure, side-effect-free modules under `app/(configurator)/wasmachinekast/sections/` (or similar), each with its own unit-test file. No integration with the store, scene, or UI yet — this slice ships logic + tests only, ready for the integration slice to consume.

The five modules:

1. **`wasmLayoutTransitions`** — `transition(state, nextLayout) → { nextState, requiresConfirm }`. Encodes the mirror-swap / create-default / destroy-with-confirm rules for all 16 layout pair transitions.
2. **`wasmSectionDefaults`** — `defaultLowSection(highSection | null, sharedMaterials) → Section`. Mirrors high-section width when present, else 120cm; height 90cm; moduleCount 2; `topPanelThicknessMm: 18`; `countertopMaterialId` copied from buitenkant.
3. **`wasmSectionPricing`** — `priceWasmachinekast(state) → { high, low, werkblad, shared, total }`. Calls existing `PricingEngine` once per non-null section; computes werkblad price as `lowSection.width × depth × buitenkant per-cm² rate`; thickness has no price impact.
4. **`wasmSnapshotMigration`** — `restore(snapshot) → state` and `serialize(state) → snapshot`. Restore handles both legacy (no `layout` field → high-only, top-level fields map to high section, depth clamped to 85) and new-format snapshots. Serialize always writes `layout`.
5. **`wasmModuleLayoutFilter`** — `filterForSection(layouts, section) → layouts` using each layout's `sectionType` (`'high' | 'low' | 'both'`).

## Acceptance criteria

- [ ] Five new modules exported from their own files under the wasmachinekast directory.
- [ ] All five modules are pure: no imports of zustand, react, three.js, or any side-effecting library.
- [ ] Unit tests for `wasmLayoutTransitions` cover all 16 layout-pair transitions (table-driven), asserting both `nextState` shape and `requiresConfirm` flag.
- [ ] Unit tests for `wasmSectionDefaults` cover: with-high-section (mirrors width), without-high-section (defaults to 120cm), copies countertop material from buitenkant.
- [ ] Unit tests for `wasmSectionPricing` cover: high-only, low-only, low-left, low-right configurations against expected totals; werkblad price is zero when no low section; 18mm and 36mm produce identical totals.
- [ ] Unit tests for `wasmSnapshotMigration` cover: legacy snapshot → high-only state with depth clamped from 65 to 85; new-format snapshot round-trips through `serialize(restore(s))`; new-format snapshot always has `layout` populated after serialize.
- [ ] Unit tests for `wasmModuleLayoutFilter` cover: 'high' section yields high + both, 'low' section yields low + both, never returns layouts from the wrong section.
- [ ] All tests pass via the project's existing test runner (vitest).
- [ ] No changes to `useWasmachinekastStore`, scene, or step components in this slice.

## Blocked by

None - can start immediately.
