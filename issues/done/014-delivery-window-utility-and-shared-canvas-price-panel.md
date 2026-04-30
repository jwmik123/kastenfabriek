# feat: delivery window utility + shared CanvasPricePanel with Geschatte aankomst

## What to build

Create a shared `getDeliveryWindow(referenceDate: Date): string` utility that computes an 8–12 week delivery range from a reference date and formats it in Dutch (e.g. `25. jun – 23. jul`, with year shown only when a date crosses into a different calendar year). Then lift `CanvasPricePanel` to the shared configurator folder so future configurators can reuse it without duplication. Add the `Geschatte aankomst` block to the panel (between Totaalprijs and the CTA button). Convert the existing kledingkast and wasmachinekast panel files to thin wrappers that call their own `useCartPrice` hook and pass values as props.

## Acceptance criteria

- [ ] `getDeliveryWindow(referenceDate)` returns a correctly formatted Dutch date range string
- [ ] Both dates show their month; no same-month compression
- [ ] Year is appended on a date only when it falls in a different calendar year than the reference date
- [ ] Unit tests cover: same-year range, cross-year range, and 31 December edge case
- [ ] Shared `CanvasPricePanel` accepts price/cart values as props (no direct store access)
- [ ] Panel renders four sections left-to-right: Totaalprijs → Geschatte aankomst → CTA button → Heart
- [ ] kledingkast and wasmachinekast configurators render identically to before (thin wrappers)
- [ ] Panel remains desktop-only (`hidden md:flex`)

## Blocked by

None — can start immediately
