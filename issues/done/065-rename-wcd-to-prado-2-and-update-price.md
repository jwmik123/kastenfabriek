# 065 — Rename WCD → Prado 2.0 and update price to €145

## Parent

[prd-configurator-feedback-round](./prd-configurator-feedback-round.md)

## What to build

Pure Sanity data change. The existing `power-outlet` accessory document is renamed for customers from "WCD achter in kast" to "Prado 2.0" and its price moves from €75 to €145. The 3D rendering of the socket is unchanged — visual is correct as-is. The internal identifier `power-outlet` stays so cart snapshots, pricing engine references, and `hasPowerHole` continue to work without code changes.

End-to-end: customer in the accessoires step sees the option labelled **Prado 2.0** with a price of €145; selecting it adds €145 per slot with `hasPowerHole = true`; order summary lists "Prado 2.0".

## Acceptance criteria

- [ ] Sanity `accessory` document with `accessoryId = power-outlet` has `name` and `nameNl` updated to "Prado 2.0".
- [ ] Price field updated from 75 to 145.
- [ ] No code changes needed — verify by smoke test.
- [ ] AccessoiresStep label and pricing reflect the new value.
- [ ] Order summary / email rendering shows the new name and price.
- [ ] Identifier `power-outlet` and runtime field `hasPowerHole` are unchanged.

## Blocked by

None — can start immediately.
