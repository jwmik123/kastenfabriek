# Wasmachinekast: final QA pass for sections feature

## Parent

[prd-wasmachinekast-low-section.md](prd-wasmachinekast-low-section.md)

## What to build

Manual end-to-end verification of the full sections feature across all four layouts. **HITL** slice — no code changes expected, but minor polish PRs may spin off from findings.

QA scope:
1. **Layouts** — configure each of `high-only`, `low-only`, `low-left`, `low-right` from scratch, take screenshots of the 3D scene for each. Compare against client reference image.
2. **Layout transitions** — exercise all 16 layout-pair transitions; verify mirror-swaps preserve, additions create defaults, destructive transitions show confirm and discard cleanly.
3. **Legacy cart regression** — restore a sampling of pre-feature wasmachinekast carts from the prod-like dataset; verify each loads as `high-only`, depth clamps to 85 if needed, and the visual + pricing output matches the original.
4. **Pricing parity** — for a few representative configs spanning all four layouts, verify the pricing panel total equals `wasmSectionPricing` programmatic output (component breakdown visible in dev tools or a debug overlay).
5. **Werkblad** — verify 18mm vs 36mm renders correctly and produces identical totals; verify werkblad material picker writes to `lowSection.countertopMaterialId` and re-renders the 3D scene.
6. **Washer placement** — for each layout, place washers in both sections (where supported), confirm the section toggle behavior and the empty-state message when no GLB qualifies.
7. **Accessoires filtering** — confirm `availableForLowSection: false` accessories disappear under `low-only` and reappear under other layouts.
8. **Kledingkast smoke test** — quickly run through kledingkast configurator and verify no behavior or visual differences.
9. **Type check + test suite** — confirm `tsc` and the full vitest suite are green.

Findings tracked in this issue's comments; any code fixes spin off as small follow-up PRs.

## Acceptance criteria

- [ ] Screenshots of all four layouts archived alongside this issue.
- [ ] All 16 layout-pair transitions exercised; behavior matches spec; results recorded.
- [ ] At least 5 legacy carts restored successfully with no regression in pricing or visual output.
- [ ] Pricing parity confirmed for at least 4 representative configurations across the four layouts.
- [ ] Werkblad thickness toggle + material picker verified visually and in totals.
- [ ] Washer placement verified per layout.
- [ ] Accessoires filtering verified.
- [ ] Kledingkast smoke test passes with no observed regression.
- [ ] `tsc` clean, full vitest suite green.
- [ ] Sign-off from a second reviewer.

## Blocked by

- Blocked by #081
- Blocked by #082
