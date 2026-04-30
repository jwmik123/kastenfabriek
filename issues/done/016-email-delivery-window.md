# feat: delivery window in order confirmation email

## What to build

Add a "Geschatte aankomst" cell to the order meta table in the order confirmation email (currently: Bestelnummer / Datum / Status). The delivery window is computed from `orderDate` — not the current render time — so the estimate stays stable if the email is ever re-sent or previewed. Extend the existing email component test to assert the delivery window cell is present with the correct value.

## Acceptance criteria

- [ ] Order confirmation email meta table shows a fourth cell: "Geschatte aankomst" with the formatted range
- [ ] Delivery window is anchored to `orderDate`, not the wall clock
- [ ] Year is shown when the window crosses into a different calendar year than `orderDate`
- [ ] Existing email test is extended to assert the delivery window cell renders correctly
- [ ] No change to `OrderConfirmationProps` interface is required (uses existing `orderDate` field)

## Blocked by

- Blocked by #014
