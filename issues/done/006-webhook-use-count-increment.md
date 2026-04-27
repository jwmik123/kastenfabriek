# 006 — Stripe Webhook Use Count Increment

## Parent PRD

`issues/prd.md`

## What to build

After a successful Stripe payment (`checkout.session.completed`), if the order has an applied coupon code, increment the `currentUses` field on the corresponding Sanity coupon document via the Sanity mutation API. This is the only place use count is recorded — validation reads this value to enforce `maxUses`.

See PRD § Implementation Decisions — "Modified: Stripe Webhook Handler" and "Architecture Decisions".

## Acceptance criteria

- [ ] Webhook handler reads `coupon_code` from the completed order
- [ ] If `coupon_code` is present, issues a Sanity patch to increment `currentUses` by 1
- [ ] If Sanity mutation fails, the webhook does not fail the overall payment confirmation (log error, continue)
- [ ] No use count change occurs for orders without a coupon
- [ ] A coupon that reaches `maxUses` will correctly block future validations (enforced by `validateCoupon` in slice 003)

## Blocked by

- `issues/001-sanity-coupon-schema.md`
- `issues/005-checkout-session-discount-integration.md`

## User stories addressed

- User story 3
- User story 4
