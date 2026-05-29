# Wasmachinekast: foundation integration (store, scene, snapshot, min depth)

## Parent

[prd-wasmachinekast-low-section.md](prd-wasmachinekast-low-section.md)

## What to build

Refactor `useWasmachinekastStore` and the 3D scene to use the new nested-sections shape and the pure modules from issue #075, while keeping the user-visible behavior identical to today (`layout` is always `'high-only'`, no UI exposes the new shape yet).

Concretely:
- Store gains `layout: 'high-only' | 'low-only' | 'low-left' | 'low-right'` (default `'high-only'`), `highSection: Section | null`, `lowSection: Section | null` (always `null` in this slice), `washerSection: 'high' | 'low' | null` (always `'high'` when washers exist).
- Top-level `width`, `height`, `moduleCount`, `modules[]`, `washerModules[]` either move into `highSection` or remain as compatibility accessors that read/write through `highSection`. Implementer's choice; existing call sites must keep working.
- `restoreConfig` and the cart-write path use `wasmSnapshotMigration` (from #075). Legacy carts (no `layout`) load as `high-only`.
- Depth minimum bumps from 65cm to 85cm in `setDepth` and the dimensions UI; legacy carts with depth < 85 clamp on restore.
- `WasmachinekastScene` renders the wardrobe via per-section `<group>` wrappers, even though only the high group is populated. Visual output is byte-identical to before.
- Wizard step count and order unchanged in this slice (Layout step ships in #080).

## Acceptance criteria

- [ ] `useWasmachinekastStore` exposes `layout`, `highSection`, `lowSection`, `washerSection`; all setters operate on the new shape.
- [ ] Existing tests under `app/(configurator)/wasmachinekast/__tests__/store.test.ts` pass without modification of their assertions (only test setup may be updated for the new shape).
- [ ] A fresh wasmachinekast config has `layout === 'high-only'`, `lowSection === null`, and renders identically to the pre-refactor wardrobe in the dev server.
- [ ] Depth slider minimum is 85cm; attempts to set depth < 85 clamp to 85.
- [ ] Legacy snapshot fixtures (with `depthCm: 65`, no `layout` field) load successfully; resulting state has `layout: 'high-only'`, `depth: 85`, all other fields intact.
- [ ] `WasmachinekastScene` wraps the high-section corpus in its own `<group>` (preparing for the second group in #080) but produces visually identical output.
- [ ] No regression in pricing for any pre-existing wasmachinekast configuration.
- [ ] Kledingkast configurator is untouched (no diffs under `app/(configurator)/kledingkast/`).
- [ ] `ClosetConfigSnapshot` shared type adds optional `layout`, `lowSection`, `washerSection` fields; kledingkast restore ignores them.

## Blocked by

- Blocked by #075
