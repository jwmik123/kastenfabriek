# 072 — Side panels accessory (18 mm / 36 mm)

## Parent

[prd-configurator-feedback-round](./prd-configurator-feedback-round.md)

## What to build

Add a side-panels option with two thickness variants. Modelled as two separate Sanity `accessory` documents (no schema change for variants), surfaced in the UI as a single toggle with a thickness selector.

End-to-end: customer in the accessoires step toggles "Side panels" on, picks 18 mm or 36 mm; price line appears in the summary; cart snapshot records the choice; order email shows the chosen thickness and price.

## Acceptance criteria

- [ ] Two new Sanity `accessory` documents: `side-panels-18mm` and `side-panels-36mm`. Prices to be supplied by client; placeholder is acceptable in dev seed.
- [ ] `ClosetConfigSnapshot.sidePanelThickness: 'none' | '18mm' | '36mm'`, default `'none'` in `restoreConfig`.
- [ ] AccessoiresStep UI: single toggle "Side panels"; when on, a thickness selector appears (radio or segmented control). Off ↔ `'none'`.
- [ ] Pricing engine adds the chosen variant's accessory price to the total when `sidePanelThickness !== 'none'`.
- [ ] Order summary + email rendering show the side-panel line with the chosen thickness.
- [ ] Snapshot round-trip test covers all three values.
- [ ] Manual QA: pick 18 mm, observe price; switch to 36 mm, observe price change; toggle off, observe removal.

## Blocked by

None — can start immediately.
