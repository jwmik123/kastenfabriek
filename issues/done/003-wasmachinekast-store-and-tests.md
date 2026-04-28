# 003 — Wasmachinekast store + tests

## Parent PRD

`issues/prd-wasmachinekast-configurator.md`

## What to build

Build the Zustand store for the wasmachinekast configurator. It implements `BaseConfiguratorState` only — no `DiagonalSlice`. This store is the single source of truth for all wasmachinekast configuration state.

Key differences from the kledingkast store:
- No diagonal fields or actions
- No `placementType` / diagonal interaction
- Min depth: 65cm (enforced in `setDepth`)
- Dimension defaults appropriate for a washing machine cabinet
- `setModuleLayout` enforces a per-layout minimum slot width: if the chosen layout specifies a minimum width and the current slot width is below it, the action is a no-op (or adjusts module count to make the slot wide enough)

The store follows the same hydration pattern as kledingkast: a `hydrate(data: FullPricingData)` action populates `pricingData`, `constraints`, and `moduleLayouts` from Sanity.

Write unit tests mirroring the pattern in `kledingkast/__tests__/store.test.ts`:
- Min depth clamp (setDepth below 65cm is rejected)
- Module count bounds (minModules / maxModules)
- Washer layout min-width constraint (setModuleLayout rejected when slot too narrow)
- `restoreConfig` round-trip
- `setModuleCount` preserving existing slot state

## Acceptance criteria

- [ ] `wasmachinekast/store.ts` created, exports `useWasmachinekastStore`
- [ ] Store satisfies `BaseConfiguratorState` (TypeScript compile check)
- [ ] `setDepth` clamps to minimum 65cm
- [ ] `setModuleLayout` enforces per-layout minimum slot width
- [ ] `hydrate` populates pricing data and constraints from Sanity `FullPricingData`
- [ ] `restoreConfig` restores full state correctly
- [ ] Unit tests written and passing for all behaviours listed above
- [ ] No diagonal fields present anywhere in the store

## Blocked by

- `issues/001-base-configurator-interface-and-context.md`

## User stories addressed

- User story 3 (set width)
- User story 4 (set height)
- User story 5 (set module count)
- User story 15 (config persistence via restoreConfig)
- User story 19 (depth minimum 65cm enforced)
- User story 20 (washer slot min-width enforced)
