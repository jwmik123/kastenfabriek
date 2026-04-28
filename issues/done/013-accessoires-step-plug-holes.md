## Parent PRD

`issues/prd-wizard-redesign.md`

## What to build

Rename `LightingStep` to `AccessoiresStep` and update the step label to "Accessoires". Retain the existing LED strip toggle. Add a new "Stekkerdoos gaten" section: a slot-grid selector (same pattern as ModulesStep) where each slot can be toggled to enable a plug hole. In the 3D scene, render a flat circle mesh on the back wall of each module with `hasPowerHole: true`.

The circle mesh is decorative only — no actual hole geometry. It should be placed at a consistent height on the back wall regardless of the module's layout, and use a neutral matte material.

## Acceptance criteria

- [ ] Step 5 label reads "Accessoires" in the step indicator.
- [ ] The LED strip toggle is present and functional as before.
- [ ] A slot-grid selector shows all current module slots.
- [ ] Selecting a slot and toggling the plug hole sets `hasPowerHole: true` on that slot in the store.
- [ ] Slots with `hasPowerHole: true` show a visual indicator (plug icon or marker) on their grid cell.
- [ ] The 3D scene renders a circle mesh on the back wall of each module with `hasPowerHole: true`.
- [ ] No circle mesh appears for modules with `hasPowerHole: false`.
- [ ] Circle mesh position is consistent across different module layouts.
- [ ] Plug hole state persists when navigating between steps.
- [ ] The price summary reflects the per-module plug hole cost (driven by the store/pricing changes from issue 008).

## Blocked by

- Blocked by `issues/008-store-snapshot-foundation.md`

## User stories addressed

- User story 13 (step called "Accessoires")
- User story 14 (LED strip toggle retained)
- User story 15 (add plug hole to individual modules)
- User story 16 (slot-grid selector, consistent with modules step)
- User story 17 (circle mesh visible in 3D preview)
