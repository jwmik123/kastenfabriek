# 054 — Materials registry expansion (9 metals) + swatch UI

## Parent

PRD: [issues/prd-doorhandles-grid-and-materials.md](./prd-doorhandles-grid-and-materials.md)

## What to build

Introduce the named metal-finish registry that the rest of the feature builds on, and replace the text-button finish row in the door-handles step with a swatch row. This slice expands the catalog from 3 finishes (chrome, black, gold) to 9 (adds rose-gold, silver, old-silver, gray-blue, gray, white) and tunes a `MeshPhysicalMaterial` for each so the renderer can apply any of them today.

Per-handle gating is not yet wired — every swatch is shown globally, applied to every handle. Sanity work and per-handle filtering land in slice 055.

## Acceptance criteria

- [ ] New `_shared/constants/handleMaterials.ts` exports a `METALS` registry with 9 entries: `chrome`, `black`, `gold`, `rose-gold`, `silver`, `old-silver`, `gray-blue`, `gray`, `white`
- [ ] Each entry contains: `id`, Dutch label, swatch hex (used for the UI swatch tint), and the PBR config needed to construct a `MeshPhysicalMaterial`
- [ ] `HandleMaterial` type union is exported from this module and replaces the inline `'chrome'|'black'|'gold'` unions in both stores and the lifted step
- [ ] `Handles.jsx` builds materials from the registry (memoised once) instead of constructing the three materials inline; selecting any of the 9 ids in the store renders correctly
- [ ] The lifted step renders a swatch row in place of the text buttons: small circles tinted with the entry's swatch hex, wrapped with `flex-wrap`, selected state indicated by a visible ring outline
- [ ] Each swatch carries an `aria-label` with the finish's Dutch label; hovering or focusing surfaces the label visibly (tooltip or inline label below the row)
- [ ] All 9 swatches render today regardless of handle (gating arrives in slice 055); push-to-open continues to hide the section
- [ ] Default `doorHandleMaterial` value remains `'chrome'`; existing snapshot tests still pass
- [ ] Verified manually in both configurators: each of the 9 finishes renders a visibly distinct material on a handle in the canvas; PBR values reviewed and adjusted as needed

## Blocked by

- Blocked by #053
