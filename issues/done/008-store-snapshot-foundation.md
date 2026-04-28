## Parent PRD

`issues/prd-wizard-redesign.md`

## What to build

Add all new store fields and update every layer that reads or writes configuration state, so the rest of the wizard redesign has a stable foundation to build on.

- Add `doorHandleMaterial: 'chrome' | 'black' | 'gold'` to the store (default `'chrome'`).
- Add `doorsExtendToFloor: boolean` to the store (default `false`).
- Add `hasPowerHole?: boolean` to `ModuleSlot` (default `false`).
- Remove the global `powerCableHolesEnabled` field and its setter.
- Update `setModuleCount` to preserve `hasPowerHole` on existing slots and initialize new slots with `false`.
- Update `restoreConfig` to map old snapshots (missing `hasPowerHole`) to `false` per slot, and to restore `doorHandleMaterial` and `doorsExtendToFloor`.
- Update `ClosetConfigSnapshot` type with the three new fields and remove `powerCableHolesEnabled`.
- Update `KledingkastConfigurator` snapshot builder to write the new fields and drop `powerCableHolesEnabled`.
- Update `useCartPrice` to count `modules.filter(m => m.hasPowerHole).length` instead of reading the global flag.

## Acceptance criteria

- [ ] Store compiles with no TypeScript errors after removing `powerCableHolesEnabled`.
- [ ] `setModuleCount` called with a higher count initializes new slots with `hasPowerHole: false`.
- [ ] `setModuleCount` called with a lower count preserves `hasPowerHole` on surviving slots.
- [ ] `restoreConfig` with an old snapshot (no `hasPowerHole` on modules) defaults every slot to `false`.
- [ ] `restoreConfig` with a new snapshot correctly restores per-slot `hasPowerHole` values.
- [ ] `useCartPrice` price increases by one unit price for each module with `hasPowerHole: true`.
- [ ] `useCartPrice` price is unchanged when no modules have `hasPowerHole: true`.
- [ ] `KledingkastConfigurator` snapshot includes `doorHandleMaterial`, `doorsExtendToFloor`, and per-module `hasPowerHole`.

## Blocked by

None — can start immediately.

## User stories addressed

- User story 18 (plug hole selections persist across steps)
- User story 19 (plug holes contribute to order price per module)
