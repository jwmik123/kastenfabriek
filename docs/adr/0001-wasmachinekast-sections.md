# Wasmachinekast: two-corpus sections (high + low)

## Status

Accepted — 2026-05-28.

## Context

Client wants wasmachinekast to support a **lage kast** (low section, max 90cm, topped by a werkblad/countertop) placed next to or instead of the existing full-height closet. Customer picks one of four **layouts** in step 1: `high-only`, `low-only`, `low-left`, `low-right`. The countertop is the roof of the low section (no separate slab), thickness 18mm or 36mm, independently colored.

## Decision

Model this as **two physically separate corpuses**, one per **section**, both sitting on the floor with their own side walls, roof, and plinth. The store carries `highSection: Section | null` and `lowSection: Section | null`; the `layout` enum determines which are populated and their left-right order. Shared concerns (depth, handle, accessories, buitenkant/binnenkant material) stay at the top level. The pricing engine is called once per section and summed; the existing `PricingEngine` is reused unchanged.

Sections apply to **wasmachinekast only**. Kledingkast remains a single-corpus model. The `CONTEXT.md` glossary entry for Corpus is extended with this exception.

## Considered options

- **B. One corpus with mixed-height modules and a countertop panel inlaid mid-height.** Rejected: the low section's space above the countertop must be open air (per client + screenshot), not enclosed by a shared roof — so a single tall shell with internal countertop is wrong.
- **C. Two fully independent wardrobes glued in the UI.** Rejected: would duplicate pricing, snapshot, and rendering for a single customer-facing wardrobe; breaks "one cart line = one wardrobe."

## Consequences

- `ClosetConfigSnapshot` (shared with kledingkast) gains optional `layout`, `lowSection`, and a per-row `section` field on `washerModules`. Old carts (no `layout`) default to `high-only` and map existing top-level dimensions onto the high section — no DB migration needed.
- New Sanity `moduleLayout.sectionType: 'high' | 'low' | 'both'` field controls per-section GLB availability. Existing layouts default to `'both'` (or `'high'` for tall-only washer-with-shelf).
- New Sanity `accessory.availableForLowSection: boolean` (default `true`) filters accessories when only a low section exists.
- Wizard step count grows 6 → 7 (new Layout step at position 1) and handles split out of Materials into their own step. Order: Layout, Afmetingen, Wasmachine, Modules, Materiaal, Handgrepen, Accessoires.
- Slopes are now formally out of scope for wasmachinekast (codified in `CONTEXT.md`).
- Min depth for wasmachinekast bumped 65cm → 85cm globally to ensure an under-counter washer fits.
