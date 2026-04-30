# Gratis montage: checkout discount line

## What to build

In the checkout review step and payment summary, sum `freeMontageDiscount` across all cart items and display it as a "Gratis montage" green discount line — styled identically to the existing coupon discount line. The order total shown to the customer must reflect this deduction.

No changes to `createCheckoutSession` are required: because `priceSnapshot.total` already excludes installation cost when free montage is active, Stripe is automatically charged the correct amount.

End result: a customer who added a kast while free montage was active sees a green "Gratis montage −€720" line in their checkout summary, and the total is correct.

## Acceptance criteria

- [ ] Checkout review step sums `freeMontageDiscount` across all cart items
- [ ] When the sum is greater than zero, a green "Gratis montage" line appears in the price breakdown, showing the deducted amount (same visual style as the coupon discount line)
- [ ] The displayed order total correctly deducts the free montage discount
- [ ] The payment step summary also shows the "Gratis montage" line and correct total
- [ ] If a coupon is also applied, both discount lines appear separately
- [ ] When no item has `freeMontageDiscount > 0`, no gratis montage line appears (no regression for normal orders)
- [ ] The Stripe charge amount matches the displayed total

## Blocked by

- Blocked by #018
