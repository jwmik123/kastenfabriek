# 005 — `createCheckoutSession` + `PriceSnapshot` Discount Fields

## Parent PRD

`issues/prd.md`

## What to build

Extend `createCheckoutSession` to accept optional coupon data and wire the discount through the full payment flow: a negative line item in Stripe, discount fields written to `PriceSnapshot`, and coupon columns written to the `order` record. Discount applies to product subtotal only, floored at zero.

See PRD § Implementation Decisions — "Modified: `createCheckoutSession`", "Modified: `PriceSnapshot` Type", "Modified: `order` Database Table", and "Architecture Decisions".

## Acceptance criteria

- [ ] `createCheckoutSession` accepts optional `couponCode` and `discountAmount` (cents) parameters
- [ ] When a discount is present, Stripe session includes a negative line item labeled `"Korting (CODE)"` with the correct amount
- [ ] Total passed to Stripe reflects the discounted amount (floored at zero)
- [ ] `PriceSnapshot` type gains optional fields: `discountCode`, `discountAmount` (cents), `discountType`
- [ ] These fields are populated on `order_item.configurationSnapshot` at order creation
- [ ] `order.coupon_code` and `order.discount_amount` are written at order creation when a discount is present
- [ ] Orders without a coupon are unaffected (all new fields nullable/optional)

## Blocked by

- `issues/002-order-table-db-migration.md`
- `issues/004-coupon-ui-checkout-step-2.md`

## User stories addressed

- User story 13
- User story 15
