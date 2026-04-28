## Parent PRD

`issues/prd-washer-modules-usable.md`

## What to build

Update the modules step (step 3) to visually lock the washer slot and hide layout controls for it. The washer slot button in the slot grid shows a distinct locked appearance and cannot be selected. The layout carousel and span toggle are hidden when the selected slot is the washer slot. Door toggle and any other non-layout controls remain accessible.

This slice completes the loop: the washer is chosen in step 2, locked in the store, and visually enforced in step 3.

## Acceptance criteria

- [ ] Washer slot button in the slot grid is visually distinct from regular slots (e.g. lock icon or different style)
- [ ] Clicking the washer slot button does not select it / does not open the layout panel
- [ ] When the washer slot is selected (edge case: via direct store manipulation), the layout carousel is not shown
- [ ] Span ("dubbele module") toggle is hidden for the washer slot
- [ ] Door toggle remains available for the washer slot
- [ ] Other slots are unaffected — full layout picking and controls work as before
- [ ] Randomizer button (if present) does not change the washer slot layout

## Blocked by

- `issues/006-washer-slot-locking-store.md`
- `issues/009-washer-step-ui-and-wizard.md`

## User stories addressed

- User story 5 (washer slot visually locked on modules step)
- User story 6 (randomizer cannot overwrite washer slot)
- User story 19 (door toggle still available for washer slot)
