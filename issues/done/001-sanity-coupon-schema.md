# 001 — Sanity Coupon Schema

## Parent PRD

`issues/prd.md`

## What to build

Add a new `coupon` document type to Sanity CMS so the client can create and manage coupon codes without developer intervention. The schema must support all fields required by the validation logic: unique code, discount type and value, expiry date, global use limit, and current use count.

See PRD § Implementation Decisions — "New: Sanity Coupon Schema" and "Further Notes" on use count tracking.

## Acceptance criteria

- [ ] `coupon` document type appears in Sanity Studio
- [ ] Fields: `code` (unique string, required), `discountType` (`"percent"` | `"fixed"`, required), `discountValue` (number, required), `expiresAt` (datetime, required), `maxUses` (number, required), `currentUses` (number, default 0, read-only in Studio), `description` (string, optional)
- [ ] Schema registered in Sanity schema index
- [ ] Client can create, edit, and delete coupon documents in Studio

## Blocked by

None — can start immediately.

## User stories addressed

- User story 1
- User story 2
- User story 3
- User story 4
- User story 5
