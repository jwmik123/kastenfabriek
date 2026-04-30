# PRD: Delivery Date Estimate (Geschatte aankomst)

## Problem Statement

Customers configuring and ordering custom furniture have no visibility into when their order will arrive. This creates uncertainty at the most critical moments in the purchase funnel — in the configurator while building, in the cart before committing, during checkout review, and after placing an order. Without a delivery estimate, customers may hesitate or abandon.

## Solution

Show a "Geschatte aankomst" (estimated arrival) date range of 8–12 weeks from a reference date across four surfaces: the configurator canvas panel, the cart summary, the checkout review step, and the order confirmation email. The window is hardcoded as a business rule — no per-SKU backend data needed. A shared utility function computes and formats the range consistently across all surfaces.

## User Stories

1. As a customer configuring a kledingkast, I want to see an estimated delivery window in the canvas panel, so that I know upfront how long my custom furniture will take.
2. As a customer configuring a wasmachinekast, I want to see an estimated delivery window in the canvas panel, so that I can plan my purchase around the lead time.
3. As a customer using any future configurator, I want to see a consistent estimated delivery window in the canvas panel, so that I have reliable expectations regardless of product type.
4. As a customer viewing my cart, I want to see an estimated delivery window in the order summary, so that I can make a final decision before proceeding to checkout.
5. As a customer in the checkout review step, I want to see an estimated delivery window next to the order summary, so that I can confirm my expectations before paying.
6. As a customer who has just placed an order, I want to see an estimated delivery window in my order confirmation email, so that I know when to expect my furniture without needing to contact support.
7. As a customer whose order spans the new year, I want to see the year shown in the delivery estimate, so that I am not confused about whether the dates are this year or next year.
8. As a customer whose delivery window falls within the same calendar year, I want a clean date display without unnecessary year suffixes, so that the UI stays readable.
9. As a customer reading my confirmation email months after ordering, I want the delivery window to be anchored to my order date (not the email render date), so that the estimate is accurate and stable.

## Implementation Decisions

### Shared delivery window utility

A single `getDeliveryWindow(referenceDate: Date): string` function encapsulates all delivery date logic:
- Adds 56 days (8 weeks) to the reference date for the start
- Adds 84 days (12 weeks) for the end
- Formats both dates in Dutch abbreviated month style (`nl-NL` locale, `month: 'short'`)
- Includes the full year on a date only when it falls in a different calendar year than the reference date
- Always shows the month for both dates — no compression for same-month ranges
- Example output: `25. jun – 23. jul` or `24. jan – 21. mrt 2027`

This utility lives in a shared lib module so it can be imported by UI components and the email template alike.

### Shared configurator canvas panel

The `CanvasPricePanel` component is lifted to the shared configurator folder. It accepts the price and cart interaction values as props rather than calling a store-specific hook directly. Each configurator (kledingkast, wasmachinekast, and future ones) keeps its own `useCartPrice` hook bound to its own store, calls it locally, and passes the return values into the shared panel.

The shared panel renders four sections left-to-right:
1. Totaalprijs block (label + formatted price)
2. Geschatte aankomst block (label + delivery window string)
3. "Voeg toe aan winkelwagen" / "Wijzigingen opslaan" CTA button
4. Heart (save) button

The panel remains desktop-only (`hidden md:flex`). Reference date for the configurator is the current date at render time.

### Cart

The delivery window appears in the "Overzicht" summary card in `CartView`, below the total line. Reference date is the current date at render time.

### Checkout

The delivery window appears in the order summary block on the review step (`step === 'review'`) of `CheckoutForm`, below the total line. It does not appear on the payment step (transient Stripe-redirect screen). Reference date is the current date at render time.

### Order confirmation email

A fourth cell is added to the existing order meta table in `OrderConfirmation` (currently: Bestelnummer / Datum / Status). The new cell is "Geschatte aankomst" and shows the delivery window computed from the `orderDate` prop — not the current render time. This keeps the estimate stable if the email is ever re-sent or previewed.

### What does NOT change

- The 8–12 week window is not configurable per product type. All configurators share the same rule.
- No schema changes. No backend changes. No Sanity changes.
- Mobile views are out of scope — the configurator panel is already hidden on mobile; cart and checkout already show on mobile but delivery date is not added there in this iteration.

## Testing Decisions

Good tests verify observable behavior from the outside — not implementation details like internal state or function names.

### What to test

**Delivery window utility** — the highest-value test target since it's pure logic with no React or network dependencies:
- Returns a correctly formatted string for a reference date where both dates fall in the same year
- Returns year suffixes when start or end crosses into a different calendar year
- Always shows both months (no compression)
- Edge case: reference date on 31 December (window spans two years)

**Email component** — snapshot or structural test verifying that the "Geschatte aankomst" cell appears in the rendered output with the correct value derived from `orderDate`, not from the wall clock.

### Prior art

- `emails/__tests__/OrderConfirmation.test.tsx` — existing email component test; extend it or follow its pattern for the delivery date cell assertion.
- The utility tests are pure unit tests with no framework dependencies — follow the pattern in `lib/actions/__tests__/checkout.test.ts`.

### What not to test

- The React UI components (cart, checkout, canvas panel) rendering the delivery window — these are thin consumers of the utility and would require heavy mocking for little gain.
- The specific pixel layout or Tailwind classes of the delivery block.

## Out of Scope

- Per-SKU or backend-driven lead times
- Mobile display of the delivery window (cart, checkout, configurator mobile sheet)
- Admin tools to update the delivery window without a code deploy
- Real-time delivery date updates based on stock or production queue
- The "heart" / save-for-later button functionality (already present, not modified here)

## Further Notes

- The 8–12 week window is a business promise, not a production schedule. It should be revisited if production capacity changes significantly.
- When a third (or fourth/fifth) configurator is added, the only work needed is: create its `useCartPrice` hook and render the shared `CanvasPricePanel` with the hook's return values — no changes to the panel itself.
- Dutch month abbreviations from `Intl` with `nl-NL` and `month: 'short'` are: jan, feb, mrt, apr, mei, jun, jul, aug, sep, okt, nov, dec.
