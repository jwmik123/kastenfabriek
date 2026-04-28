## Parent PRD

`issues/prd-wizard-redesign.md`

## What to build

Add a "Deuren tot de vloer" section to `ModulesStep` with a global toggle. When enabled, the main corpus door meshes in the 3D scene extend downward so their bottom edge sits at y=0.02 m (2 cm above the floor). Top cabinet doors are not affected. The change is purely visual with no price impact.

The new section lives below the slot configuration area and above the step navigation buttons.

## Acceptance criteria

- [ ] A clearly labelled toggle for "Deuren tot de vloer" appears in the Modules step.
- [ ] Toggling on sets `doorsExtendToFloor: true` in the store; toggling off sets it to `false`.
- [ ] When enabled, all main corpus door meshes visually extend to y=0.02 m in the 3D scene.
- [ ] Top cabinet doors are visually unchanged regardless of the toggle state.
- [ ] The toggle state persists when navigating away from and back to the Modules step.
- [ ] No change to the quoted price when the toggle is on or off.

## Blocked by

- Blocked by `issues/008-store-snapshot-foundation.md`

## User stories addressed

- User story 10 (extend doors to 2 cm above floor)
- User story 11 (toggle in modules step)
- User story 12 (reflected in 3D preview immediately)
- User story 20 (applies to all main corpus doors simultaneously)
