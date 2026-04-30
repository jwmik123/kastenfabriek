## What to build

Replace the placeholder washer GLB with the real `ModuleWasherSingle.glb`, clean up fill zones, and remove the stacked washer variant entirely. This is a pure config change — after this slice the real GLB renders in the configurator, but depth positioning and door suppression are not yet applied.

## Acceptance criteria

- [ ] Washer module IDs 11 (single) and 12 (double side-by-side) use GLB path `/objects/washermodules/ModuleWasherSingle.glb`
- [ ] Both washer configs have fill zones set to `'open'` (above and below)
- [ ] Stacked washer config (ID 13) is removed from the layout config array
- [ ] ID 13 is removed from the washer IDs set in the layout merger
- [ ] The real GLB renders visibly in the 3D scene for both single and double washer slots

## Blocked by

None — can start immediately.
