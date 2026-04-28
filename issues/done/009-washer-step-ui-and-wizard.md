## Parent PRD

`issues/prd-washer-modules-usable.md`

## What to build

Add a dedicated washer selection step (step 2) to the wasmachinekast wizard and build the `WasherStep` UI component that lives inside it.

The wizard grows from 5 to 6 steps: Afmetingen → Wasmachine → Modules → Materiaal → Handgrepen → Accessoires. All existing step numbers shift by one.

The `WasherStep` component has two parts:
- **Type selector** — a row of cards, one per washer config in the washer configs array. Cards for types that do not fit the current cabinet width are disabled (greyed out). Selecting a card does not yet commit the slot — just sets the active type.
- **Slot picker** — after a type is selected, a slot grid (same visual pattern as the modules step) appears. Clicking a slot calls `setWasherModule(slotIndex, layoutId)` and advances the wizard.

Navigating back to step 2 calls `clearWasherModule()` so the user can re-select freely.

## Acceptance criteria

- [ ] Step indicator shows 6 steps with correct labels
- [ ] Step 2 renders `WasherStep`; existing steps 2–5 render at steps 3–6
- [ ] Type selector shows all washer configs as cards
- [ ] Types that require more width than the current cabinet have are visually disabled and unclickable
- [ ] Selecting a type reveals the slot grid
- [ ] Clicking a slot calls `setWasherModule` with the correct slot index and layout ID
- [ ] Navigating back to step 2 (via Vorige or step indicator) calls `clearWasherModule()`
- [ ] Adding a new washer config to the configs array causes it to appear in the type selector without any other changes

## Blocked by

- `issues/006-washer-slot-locking-store.md`

## User stories addressed

- User story 1 (dedicated washer step before modules)
- User story 2 (select washer module type)
- User story 3 (unavailable types greyed out)
- User story 4 (pick which slot the washer occupies)
- User story 7 (go back to change type/slot)
- User story 18 (step indicator shows 6 steps)
- User story 20 (extendable type selector)
