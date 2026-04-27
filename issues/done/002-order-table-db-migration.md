# 002 — Order Table DB Migration

## Parent PRD

`issues/prd.md`

## What to build

Add two nullable columns to the `order` database table to store the applied coupon code and discount amount at order creation time. This enables querying coupon usage from the database and is required before the checkout session can write discount data.

See PRD § Implementation Decisions — "Modified: `order` Database Table".

## Acceptance criteria

- [ ] `coupon_code` column added to `order` table (nullable varchar)
- [ ] `discount_amount` column added to `order` table (nullable integer, value in cents)
- [ ] Drizzle schema definition updated to match
- [ ] Migration generated and runs without error
- [ ] Existing orders unaffected (both columns default to null)

## Blocked by

None — can start immediately.

## User stories addressed

None directly — enables slice 005.
