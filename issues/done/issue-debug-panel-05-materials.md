# Debug panel — per-module material info with override indicator

## What to build

Add buitenkant and binnenkant material display to each module slot row. For each material show the human-readable name and the raw material ID. Indicate whether the value is a per-module override (`↑`) or inherited from the global closet setting (`↓`). Override entries should be visually distinguished (e.g. accent colour) so they stand out at a glance.

## Acceptance criteria

- [ ] Each module row shows buitenkant: `↑ Name (id)` or `↓ Name (id)`
- [ ] Each module row shows binnenkant: `↑ Name (id)` or `↓ Name (id)`
- [ ] `↑` appears when the slot has a per-module `buitenkantMaterialId` / `binnenkantMaterialId` that differs from the global setting
- [ ] `↓` appears when the slot inherits the global material (no per-module override set)
- [ ] Override rows are visually distinct from inherited rows (different text colour)
- [ ] Material name resolves from the `MATERIALS` array; falls back to raw ID if not found
- [ ] Changing the global material updates all inherited (`↓`) slots live; overridden (`↑`) slots are unaffected

## Blocked by

- Blocked by issue-debug-panel-01-shell (panel must exist to render into)
