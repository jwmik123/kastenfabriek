# fix(wasmachinekast): clearWasherModule must also clear the slot's layoutId

## What to build

When the user navigates back to the washer step (step 2), `clearWasherModule` is called to reset the previous washer selection. Currently it only resets the tracking fields (`washerSlotIndex`, `washerLayoutId`) but leaves the old slot's `layoutId` and `fixedWidth` intact in the `modules` array. When the user then picks a new slot, `setWasherModule` sees `washerSlotIndex === null` and skips its clearing guard — leaving both the old and new slots with washer layouts, producing two visible washing machines.

Fix: extend `clearWasherModule` to also null out `layoutId` and `fixedWidth` on the module at the old `washerSlotIndex` before resetting the tracking state. Add a regression test that proves clear-then-reassign results in exactly one washer slot.

## Acceptance criteria

- [ ] After `setWasherModule(0, id)` → `clearWasherModule()`, `modules[0].layoutId` is `null` and `modules[0].fixedWidth` is `undefined`
- [ ] After `setWasherModule(0, id)` → `clearWasherModule()` → `setWasherModule(1, id)`, only `modules[1].layoutId` is non-null; `modules[0].layoutId` is `null`
- [ ] `clearWasherModule()` on a store with `washerSlotIndex === null` does not throw and leaves `modules` unchanged
- [ ] Existing `clearWasherModule` tests (`washerSlotIndex` and `washerLayoutId` reset to null) still pass

## Blocked by

None — can start immediately.
