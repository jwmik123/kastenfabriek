# PRD: Gratis Montage Toggle

## Problem Statement

As a shop owner, I occasionally want to run a promotion where installation (montage) is offered for free to customers. Currently there is no way to enable this without manually editing prices in Sanity or issuing a coupon. The promotion needs to be visible to the customer throughout the entire purchase journey — in the configurator, checkout, and order confirmation email.

## Solution

Add a single on/off toggle — "Gratis Montage" — to the Pricing Configuration document in Sanity Studio. When enabled, the installation cost is zeroed out for all product types. The customer sees the original price crossed out next to the new lower price in the configurator canvas panel, a dedicated discount line in the checkout summary, and a discount line in the order confirmation email. The reduced amount is also reflected in the actual Stripe charge.

## User Stories

1. As a shop owner, I want a toggle in Sanity Studio's Pricing Configuration, so that I can activate or deactivate free montage without developer involvement.
2. As a shop owner, I want the toggle to appear at the top of the Pricing Configuration document, so that it is immediately visible and easy to find.
3. As a shop owner, I want the toggle to apply to both the kledingkast and wasmachinekast configurators simultaneously, so that the promotion is consistent across all products.
4. As a customer configuring a kledingkast, I want to see the original total price crossed out next to the new lower price in the canvas price panel, so that the saving is immediately obvious.
5. As a customer configuring a wasmachinekast, I want to see the same strikethrough price display in the canvas price panel, so that the experience is consistent.
6. As a customer, I want the crossed-out price to reflect the full original total including installation, so that the saving amount is clear.
7. As a customer, I want the new displayed price to be the total without installation, so that I understand exactly what I will pay.
8. As a customer reviewing my order in checkout, I want to see a "Gratis montage" line item in the price breakdown showing the installation amount deducted in green, so that I can confirm the promotion has been applied.
9. As a customer reviewing my order in checkout, I want the order total to correctly reflect the deduction, so that I am not surprised at payment.
10. As a customer proceeding to payment, I want the Stripe checkout to charge me the reduced amount, so that I am actually billed correctly.
11. As a customer, I want the free montage discount to be captured at the moment I add the item to the cart, so that the promotion amount is locked in even if the toggle is later turned off before I complete checkout.
12. As a customer, I want to receive an order confirmation email that shows "Gratis montage" as a discount line in the price breakdown, so that I have a record of the promotion.
13. As a customer, I want the email total to match the amount I was actually charged, so that there is no confusion about billing.
14. As a customer who also applies a coupon code, I want both the coupon discount and the free montage discount to appear as separate lines in the checkout summary, so that I can see each saving clearly.
15. As a shop owner, I want the installation tier name (e.g. "Groot project") to still be recorded in the order even when montage is free, so that fulfilment knows the scale of the job.

## Implementation Decisions

### Schema changes
- Add a `freeMontage` boolean field (Dutch label: "Gratis Montage", default `false`) to the top of the `pricingConfig` Sanity document type.
- Add this field to the GROQ pricing data query so it is fetched alongside other config fields.
- Extend the `PricingConfig` TypeScript interface with `freeMontage?: boolean`.

### PriceSnapshot changes
- Add two optional fields to `PriceSnapshot`: `freeMontageApplied: boolean` and `freeMontageDiscount: number`.
- When free montage is active, `installationCost` in the snapshot is stored as `0` (the actual charged amount), `freeMontageDiscount` holds the original installation tier price, and `freeMontageApplied` is `true`.
- The `installationTierName` is still recorded for fulfilment purposes.
- The `total` field stores the actual total the customer pays (without installation).
- These values are computed at add-to-cart time and frozen in the snapshot, consistent with the existing snapshot pattern.

### Price hook changes (both configurators)
- Read `freeMontage` from `pricingData.config`.
- Compute `effectiveInstallationCost`: `0` when free montage is active, otherwise the tier price.
- Compute `freeMontageDiscount`: the original tier price when active, otherwise `0`.
- Compute `grandTotal`: `subtotal + effectiveInstallationCost`.
- Expose `originalPrice` (the grand total including montage) for display when `freeMontageDiscount > 0`; otherwise `undefined`.
- The canvas price panel receives `grandTotal` as the displayed price and `originalPrice` as the optional strikethrough value.

### Canvas price panel changes
- Add an optional `originalPrice` prop.
- When `originalPrice` is provided, render it with a strikethrough style alongside the new lower price.
- When not provided, render the price as today (no change to existing display).

### Checkout display changes
- Sum `freeMontageDiscount` across all cart items.
- When this total is greater than zero, render a green "Gratis montage" line item in the price breakdown (same visual style as coupon discount lines).
- Deduct this amount from the displayed order total.
- No changes to `createCheckoutSession` are required: because `priceSnapshot.total` already excludes the installation cost when free montage is active, the Stripe charge is automatically correct.

### Order confirmation email changes
- When a cart item has `freeMontageApplied: true` and `freeMontageDiscount > 0`, render a "Gratis montage" discount row in the item price breakdown, styled consistently with the existing coupon discount row.
- The email total already uses `priceSnapshot.total` which is correct.

### Out-of-scope interactions
- The free montage toggle does not interact with coupon codes; both can apply simultaneously as independent discounts.
- Free montage discount is not tracked through the `coupon` database table; it is captured purely in the price snapshot.

## Testing Decisions

**What makes a good test:** tests exercise the price calculation logic through its public return values — they do not assert on internal variables or implementation steps. A test should fail only when the external behaviour (the numbers returned or stored in the snapshot) is wrong.

**Module to test:** the price calculation logic inside `useCartPrice` for both configurators — specifically the free montage branch.

**Cases to cover:**
- When `freeMontage` is `false`: `installationCost`, `total`, `freeMontageApplied`, and `freeMontageDiscount` all behave as today (no regression).
- When `freeMontage` is `true`: `installationCost` is `0`, `total` equals `subtotal`, `freeMontageApplied` is `true`, `freeMontageDiscount` equals the original tier price, and `originalPrice` equals `subtotal + tierPrice`.
- Edge case: `freeMontage` is `true` but subtotal falls below all installation tier thresholds (no tier matched, `installationCost` was already `0`): `freeMontageApplied` should be `false` and `freeMontageDiscount` should be `0`.

**Prior art:** existing price calculation tests for `PricingEngine` in `lib/configurator/` (if present) serve as the model for how to construct a minimal `FullPricingData` fixture and assert on numeric outputs.

## Out of Scope

- Per-product-type free montage (toggle applies globally to all configurators).
- Time-limited or scheduled activation (toggled manually in Studio).
- Displaying free montage savings on product listing or marketing pages.
- Reporting or analytics on how many orders used free montage.
- Retroactively applying free montage to orders already placed.

## Further Notes

- The decision to bake the discount into `PriceSnapshot` at add-to-cart time means the customer's saved price is guaranteed even if the Studio toggle is switched off between cart and checkout — consistent with how all other pricing works in this codebase.
- The `installationTierName` is preserved in the snapshot so fulfilment staff can see the scale of the assembly job regardless of whether it was charged.
