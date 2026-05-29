# Wasmachinekast: reorder Wasmachine step before Modules; add washerSection toggle scaffold

## Parent

[prd-wasmachinekast-low-section.md](prd-wasmachinekast-low-section.md)

## What to build

Move `WasherStep` to the position **before** `ModulesStep` in the wasmachinekast wizard. Add a "Wasmachine in hoge of lage kast?" toggle at the top of WasherStep. In this slice the toggle is locked to `'high'` because no lage kast exists yet — but the toggle UI, the `washerSection` store field, and the per-slot placement logic that reads from `washerSection` are wired up so that #080 can simply enable the lage kast.

Final order after this slice:

1. Afmetingen
2. Wasmachine (moved earlier; new section toggle at top, locked to 'high')
3. Modules
4. Materiaal
5. Handgrepen
6. Accessoires
7. (existing final step)

## Acceptance criteria

- [ ] Wizard step order matches the list above.
- [ ] `WasherStep` displays a section toggle ("Hoge kast / Lage kast") at the top; the "Lage kast" option is disabled with tooltip "Geen lage kast in deze layout".
- [ ] Store carries `washerSection: 'high' | 'low' | null`; setting `washerSection: 'low'` is rejected when `lowSection === null`.
- [ ] Existing washer placement (slot indices) is interpreted against `washerSection`; all current behavior preserved for high-only configs.
- [ ] Snapshot serializes `washerSection` going forward; legacy snapshots without it default to `'high'` when `washerModules.length > 0`, else `null`.
- [ ] Existing wasmachinekast tests pass.
- [ ] Kledingkast configurator is untouched.

## Blocked by

- Blocked by #077
