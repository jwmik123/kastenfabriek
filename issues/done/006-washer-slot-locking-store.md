## Parent PRD

`issues/prd-washer-modules-usable.md`

## What to build

Extend the wasmachinekast store with washer slot locking. The store tracks which slot and layout ID are reserved for the washer. The randomizer skips that slot. When the module count is reduced (directly or via a width change) to the point where the washer slot no longer exists, the washer selection is cleared and the wizard step resets to 2 so the user is prompted to re-select.

End-to-end: after this slice, the store correctly enforces all washer-locking invariants. The UI does not yet surface this — that comes in later slices.

## Acceptance criteria

- [ ] Store has `washerSlotIndex: number | null` and `washerLayoutId: number | null` (both null by default)
- [ ] `setWasherModule(slotIndex, layoutId)` sets both fields
- [ ] `clearWasherModule()` resets both to null
- [ ] `randomFill` never changes the `layoutId` of the module at `washerSlotIndex`
- [ ] `setModuleCount` to a count ≤ `washerSlotIndex` calls `clearWasherModule()` and sets `step` to 2
- [ ] `setWidth` that forces a module count reduction below the washer slot triggers the same reset
- [ ] `restoreConfig` does not restore a washer slot index that exceeds the restored module count
- [ ] All new behaviours covered by tests in `store.test.ts`

## Blocked by

None — can start immediately.

## User stories addressed

- User story 6 (randomizer skips washer slot)
- User story 7 (going back to washer step unlocks selection)
- User story 8 (dimension change resets washer if slot invalid)
- User story 9 (user returned to washer step on reset)
