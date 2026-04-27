# 004 — Coupon UI in Checkout Step 2

## Parent PRD

`issues/prd.md`

## What to build

Add a coupon input section to Step 2 (Review) of the checkout form. The section includes a text input, an "Apply" button, and — once a valid code is applied — an applied state showing the code label, discount amount, and a remove button. Applied coupon is stored in React state only (cleared on page refresh, persisted across step navigation). Discount is applied to the subtotal only, floored at zero.

See PRD § Implementation Decisions — "Modified: `CheckoutForm` Component".

## Acceptance criteria

- [ ] Coupon input and Apply button visible in Step 2
- [ ] Submitting an invalid/expired/exhausted code shows an inline error message
- [ ] Submitting a valid code transitions to applied state: shows code, discount amount, and remove (×) button
- [ ] Remove button clears the applied coupon and returns to the input state
- [ ] Applied coupon persists when navigating back to Step 1 and returning to Step 2
- [ ] Discount amount displayed in the order subtotal area as a separate line
- [ ] Discount floors at zero (never shows negative subtotal)
- [ ] Applied coupon data (code, discountAmount in cents, discountType) is passed to the payment step

## Blocked by

- `issues/003-validate-coupon-server-action.md`

## User stories addressed

- User story 6
- User story 7
- User story 8
- User story 9
- User story 10
- User story 11
- User story 12
