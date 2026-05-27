# 067 — Sanity: `handle.heightCm` field + backfill

## Parent

[prd-configurator-feedback-round](./prd-configurator-feedback-round.md)

## What to build

Add a `heightCm` field (number, cm) to the Sanity `handle` schema, describing the vertical extent of the physical handle. Backfill every existing handle document with a real value from the Hafele / Prodinter spec sheet (Indy is the reference). This is the foundational data slice for the sloped-door handle behaviour (#068).

End-to-end: a Sanity editor opens any handle document, sees a "Height (cm)" field that is populated for every existing handle, and can edit it for new handles. No code consumes the field yet — that lands in #068.

## Acceptance criteria

- [ ] `handle.heightCm` defined in `sanity/schemaTypes/handle.ts`, type number, required, validated `min(1).max(100)`.
- [ ] Every existing handle document in the dataset has a non-null `heightCm` value sourced from the supplier spec.
- [ ] `FullPricingData.handles[].heightCm` exposed in the GROQ query and type definitions so #068 can consume it.
- [ ] Studio preview/list shows the new field.
- [ ] No runtime behaviour change yet (handle picker and door rendering unaffected).

## Blocked by

None — can start immediately.
