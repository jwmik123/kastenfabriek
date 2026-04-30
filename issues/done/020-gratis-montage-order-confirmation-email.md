# Gratis montage: order confirmation email

## What to build

In the order confirmation email, when a cart item has `freeMontageApplied: true` and `freeMontageDiscount > 0`, render a "Gratis montage" discount row in the per-item price breakdown. Style it consistently with the existing coupon discount row (negative amount). The email total already uses `priceSnapshot.total` which correctly excludes the installation cost, so no total calculation changes are needed.

End result: a customer who received free montage sees a "Gratis montage −€720" line in their confirmation email price breakdown.

## Acceptance criteria

- [ ] When `freeMontageApplied` is `true` and `freeMontageDiscount > 0`, a "Gratis montage" row appears in the item price breakdown in the email
- [ ] The row displays the discount as a negative amount, styled consistently with the coupon discount row
- [ ] The email total is correct (already uses `priceSnapshot.total` which excludes installation)
- [ ] When `freeMontageApplied` is `false` or absent, no gratis montage row appears (no regression for normal orders)
- [ ] The normal "Montage (tier name)" row does not appear when `installationCost` is `0` (existing guard already handles this)

## Blocked by

- Blocked by #018
