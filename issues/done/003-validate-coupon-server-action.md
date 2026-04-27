# 003 — `validateCoupon` Server Action

## Parent PRD

`issues/prd.md`

## What to build

A server action that accepts a coupon code string and returns a typed result indicating whether the coupon is valid, and if so, the discount details. Validation checks: existence in Sanity, expiry date, and global use limit (checked against `currentUses` in Sanity). Input is normalized to uppercase before lookup.

See PRD § Implementation Decisions — "New: `validateCoupon` Server Action".

## Acceptance criteria

- [ ] Server action accepts a code string and returns `{ valid: true, discount: { code, discountType, discountValue } }` on success
- [ ] Returns `{ valid: false, error: "not_found" }` for unknown codes
- [ ] Returns `{ valid: false, error: "expired" }` when `expiresAt` is in the past
- [ ] Returns `{ valid: false, error: "limit_reached" }` when `currentUses >= maxUses`
- [ ] Input normalized to uppercase and trimmed before Sanity query
- [ ] Does NOT increment use count
- [ ] Unit tests cover all four outcome branches with mocked Sanity client

## Blocked by

- `issues/001-sanity-coupon-schema.md`

## User stories addressed

- User story 6
- User story 11
- User story 16
- User story 17
- User story 18
