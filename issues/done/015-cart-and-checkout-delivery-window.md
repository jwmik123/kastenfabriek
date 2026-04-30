# feat: delivery window in cart and checkout review

## What to build

Add a "Geschatte aankomst" delivery window below the total line in two pre-order surfaces: the cart's Overzicht summary card and the checkout flow's review step. Both use the current date as the reference point. Does not appear on the payment step (transient Stripe-redirect screen).

## Acceptance criteria

- [ ] Cart Overzicht card shows "Geschatte aankomst" with the formatted 8–12 week range below the total
- [ ] Checkout review step order summary shows "Geschatte aankomst" below the total line
- [ ] Delivery window does NOT appear on the checkout payment step
- [ ] Both surfaces use the current date as the reference point
- [ ] Format matches the shared utility output (e.g. `25. jun – 23. jul`)

## Blocked by

- Blocked by #014
