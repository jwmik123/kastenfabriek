# Pre-existing test failures on `main`

Snapshot captured 2026-05-28 while landing slice [075-wasm-pure-modules-and-tests.md](075-wasm-pure-modules-and-tests.md). All failures predate that slice — `npx vitest run app/(configurator)/wasmachinekast/sections` is green (5 files / 42 tests). Listed here so they can be picked up later as separate vertical slices.

Totals: **4 files failing, 9 tests failing, 403 passing**.

---

## 1. `lib/actions/__tests__/checkout.test.ts` — 3 failures

All three throw `TypeError: Cannot read properties of undefined (reading 'create')` at [checkout.ts:179](../lib/actions/checkout.ts#L179) — `stripe.coupons.create(...)`. The `stripe` client is undefined in test scope; tests likely need to mock `stripe.coupons` (or the whole `stripe` import) and don't.

Failing cases:

- `createCheckoutSession > includes negative Stripe line item labeled 'Korting (CODE)' when coupon applied`
- `createCheckoutSession > writes couponCode and discountAmount to order record`
- `createCheckoutSession > caps negative line item at totalCents when discount exceeds order total`

**Likely fix**: add a `vi.mock('stripe', ...)` or inject a fake `stripe.coupons.create` in the test setup.

---

## 2. `app/(configurator)/kledingkast/__tests__/resolveElementPositions.test.ts` — 4 failures

All four assert the wrong constant for module-layout vertical positions. Expected `0.35`, received `0.368`; one expects `startY: 1.75`, receives `1.84`. A constant was changed in the layout source (likely in [app/(configurator)/kledingkast/moduleLayouts.ts](../app/(configurator)/kledingkast/moduleLayouts.ts) or [resolveElementPositions](../app/(configurator)/kledingkast/scene/resolveElementPositions.ts)) without updating the corresponding test expectations.

Failing cases (all under `MODULE_LAYOUTS (slice 3)`):

- `L3 double-rod: top fromTop(0.35), bottom midpoint(0)` — got `0.368`
- `L6 rod+shelf: fromTop(0.35) and fixedShelves [0.35] below` — got `0.368`
- `L7 drawer+rod: two elements with fromBottom(0) and fromTop(0.35)` — got `0.368`
- `L8 desk: shelves with explicit startY 1.75 above` — got `1.84`

**Likely fix**: decide whether `0.35 → 0.368` and `1.75 → 1.84` are intentional product changes (then update tests) or regressions (then revert constants). The repeated 0.018 delta suggests a deliberate offset bump.

---

## 3. `app/(configurator)/wasmachinekast/__tests__/store.test.ts` — 1 failure

`no diagonal fields > store has no placementType field` at line 340 asserts the store has no `placementType` field, but [store.ts:42-43](../app/(configurator)/wasmachinekast/store.ts#L42-L43) still defines `placementType: 'ingebouwd'` and `setPlacementType`.

**Likely fix**: either remove `placementType` from the wasmachinekast store (it's not used by the current step flow — confirm via grep before deleting) or relax the test if placementType is meant to stay.

---

## 4. `app/(configurator)/_shared/components/__tests__/CanvasPricePanel.test.tsx` — 1 failure

`CanvasPricePanel > renders add-to-cart primary button` expects the rendered HTML to contain the string `"Voeg toe aan winkelwagen"`. Current render only contains a "Bewaar" (save) button and price/delivery info — no "Add to cart" CTA. [CanvasPricePanel](../app/(configurator)/_shared/components/CanvasPricePanel.tsx) was reworked and the primary CTA appears to have been removed or renamed.

**Likely fix**: either restore the add-to-cart button, update the test to look for the new primary CTA label, or move the assertion into a context where the cart button is actually rendered (e.g. on the final step).

---

## Suggested grouping into issues

These are unrelated failures with different owners/areas — recommend three issues, not one:

1. **checkout stripe mock** — one fix for all 3 cases.
2. **resolveElementPositions constants** — single decision on `0.35 → 0.368` / `1.75 → 1.84`.
3. **wasm store placementType + CanvasPricePanel CTA** — both touch configurator UI cleanup, can ship together or split.
