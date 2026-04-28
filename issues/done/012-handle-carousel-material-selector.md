## Parent PRD

`issues/prd-wizard-redesign.md`

## What to build

Replace the 2-column handle grid in `DoorHandlesStep` with the shared carousel (3.5 items visible). Below the carousel, add a segmented control for handle material: Chrome / Zwart / Goud. The material selector is hidden when push-to-open (`doorHandleId === 'none'`) is selected. Update `HandleByType` in the 3D scene to accept a `material` prop and render the correct `MeshPhysicalMaterial` variant.

Material values:
- Chrome: `#d3d3d3`, metalness 0.9, roughness 0.2, clearcoat 1.
- Zwart: `#1a1a1a`, metalness 0.9, roughness 0.35.
- Goud: `#c9a84c`, metalness 0.9, roughness 0.3.

## Acceptance criteria

- [ ] Handle options appear in a horizontal carousel with 3.5 items visible.
- [ ] Each carousel item shows the handle image, name, and price per door.
- [ ] The selected handle is highlighted in the carousel.
- [ ] A segmented control (Chrome / Zwart / Goud) appears below the carousel when a handle is selected.
- [ ] The material segmented control is not rendered when push-to-open is selected.
- [ ] Selecting a material updates `doorHandleMaterial` in the store.
- [ ] The 3D scene renders handles with the correct material color/finish immediately on change.
- [ ] Push-to-open option remains accessible in the carousel or as a separate tile below it.
- [ ] No regression in handle selection or push-to-open pricing.

## Blocked by

- Blocked by `issues/008-store-snapshot-foundation.md`
- Blocked by `issues/009-shared-carousel-component.md`

## User stories addressed

- User story 5 (handle options in a carousel)
- User story 6 (3.5 handle options visible)
- User story 7 (select handle material finish)
- User story 8 (material selector hidden for push-to-open)
- User story 9 (material reflected in 3D preview)
