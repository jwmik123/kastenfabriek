# 007 — Email Discount Line

## Parent PRD

`issues/prd.md`

## What to build

Add a discount row to the pricing table in the `OrderConfirmation` email template. The row appears between the subtotal and delivery lines, shows the coupon code and discount amount as a negative value, and is only rendered when a discount was applied to the order.

See PRD § Implementation Decisions — "Modified: `OrderConfirmation` Email Template".

## Acceptance criteria

- [ ] Pricing table renders a discount row when `discountAmount > 0` in the price snapshot
- [ ] Row label: `Korting (CODE)` where CODE is the applied coupon code
- [ ] Row value: `-€XX,XX` formatted consistently with other price values in the template
- [ ] Discount row appears after subtotal and before delivery
- [ ] Discount row is absent when no coupon was applied (no empty row, no zero-value row)
- [ ] Final total in the email reflects the discounted amount

## Blocked by

- `issues/005-checkout-session-discount-integration.md`

## User stories addressed

- User story 14
