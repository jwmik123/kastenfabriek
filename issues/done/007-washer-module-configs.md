## Parent PRD

`issues/prd-washer-modules-usable.md`

## What to build

Update the washer module configs and layout definitions to match the agreed specifications: single washer at 65 cm (down from 75 cm), double side-by-side at 130 cm, and a new stacked double variant at 65 cm. All washer configs switch to a `fixed fromBottom: 0` anchor so the washer sits on the module floor. The real `washer.glb` is wired as the `glbPath` for all washer variants. Fill zone above the washer zone is shelves; nothing below.

End-to-end: after this slice, the config layer correctly describes all three washer types. The 3D scene does not yet render them correctly — centering and stacked rendering are handled in the next slice.

## Acceptance criteria

- [ ] `WASHER_SINGLE` has `minSlotWidth: 65` (was 75) and `fixedWidth: 65`
- [ ] `WASHER_DOUBLE` (side-by-side) has `minSlotWidth: 130` and `fixedWidth: 130`
- [ ] A new `WASHER_STACKED` config exists with `layoutId: 13`, `fixedWidth: 65`, washer zone height 180 cm (2 × 90 cm)
- [ ] All three washer `ModuleLayoutConfig` entries use `glbPath: '/objects/washer.glb'`
- [ ] All three use anchor `{ type: 'fixed', fromBottom: 0 }` — not `{ type: 'bottom' }`
- [ ] All three have `fillZone.above: { type: 'shelves' }` and `fillZone.below: { type: 'open' }`
- [ ] `WASHER_LAYOUTS` array and `getWasmModuleLayouts` include the stacked variant
- [ ] `isLayoutAvailable` correctly gates: single/stacked require width ≥ 65 cm, side-by-side requires width ≥ 130 cm

## Blocked by

None — can start immediately (parallel with `006-washer-slot-locking-store.md`).

## User stories addressed

- User story 13 (single washer 65 cm)
- User story 14 (double side-by-side 130 cm)
- User story 15 (double stacked 65 cm, two washers)
- User story 20 (extendable washer type configs)
