# 001 — Base configurator interface + store context

## Parent PRD

`issues/prd-wasmachinekast-configurator.md`

## What to build

Define the TypeScript interfaces and React context that allow multiple independent configurators to share the same 3D primitives.

Specifically:
- A `BaseConfiguratorState` interface covering dimensions, module slots, materials, door options, lighting, step wizard state, view state, selection state, pricing data, constraints, module layouts, and all derived functions (`moduleWidthCm`, `minModules`, `maxModules`, `needsTopCabinet`, `topCabinetHeight`, `mainHeight`).
- A `DiagonalSlice` interface covering all diagonal wall fields and actions (diagonalSide, startHeights, topWidths, backDiagonal, and all setters).
- A `ConfiguratorStoreContext` React context that holds a reference to a Zustand store satisfying at least `BaseConfiguratorState`.
- A `useConfiguratorStore<T>(selector)` hook that reads from the context, mirroring the calling convention of `useClosetStore`.

No UI changes. No store changes. No file moves. This is pure interface and context scaffolding that downstream slices depend on.

The kledingkast `ClosetState` type should be verifiable as satisfying `BaseConfiguratorState & DiagonalSlice` via a TypeScript assignability check — this is the acceptance test that the interface is correct.

## Acceptance criteria

- [ ] `BaseConfiguratorState` interface defined and exported from `_shared/store/`
- [ ] `DiagonalSlice` interface defined and exported from `_shared/store/`
- [ ] Kledingkast `ClosetState` satisfies `BaseConfiguratorState & DiagonalSlice` (TypeScript compile check)
- [ ] `ConfiguratorStoreContext` created with correct generic typing
- [ ] `useConfiguratorStore(selector)` hook exported and callable with the same signature as `useClosetStore`
- [ ] No existing tests broken
- [ ] No runtime behaviour changed

## Blocked by

None — can start immediately.

## User stories addressed

- User story 22 (foundation for all future configurators)
