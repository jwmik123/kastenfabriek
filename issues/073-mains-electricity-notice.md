# 073 — Mains-electricity notice for LED and Prado 2.0

## Parent

[prd-configurator-feedback-round](./prd-configurator-feedback-round.md)

## What to build

When the customer toggles LED lighting on, or toggles Prado 2.0 on, an inline notice appears under the toggle reading (Dutch) something like *"Let op: er moet netstroom achter de kast aanwezig zijn."* The exact copy is editorial — pulled from a new `siteSettings.mainsElectricityNotice` field.

End-to-end: customer toggles LED in the materials step → notice appears under the toggle; customer toggles Prado 2.0 in the accessoires step → same notice appears under that toggle; toggling off hides the notice. Editing the copy in Sanity Studio reflects on the next page load.

## Acceptance criteria

- [ ] `siteSettings.mainsElectricityNotice` field added to the Sanity site-settings schema. Type: localized string (NL + EN if site is bilingual; otherwise plain string).
- [ ] Notice is exposed to the frontend via the existing site-settings GROQ fetch.
- [ ] `MaterialStep` renders the notice inline under the LED toggle when `lightStripsEnabled` is true.
- [ ] `AccessoiresStep` renders the notice inline under the Prado 2.0 toggle when any module has `hasPowerHole = true`.
- [ ] Notice has a visible "warning" treatment (icon or coloured background) — not just plain text — so it does not get lost.
- [ ] Manual QA: toggle LED + Prado in both orders, confirm notice appears in the right place; edit the Sanity field, reload, confirm new copy.

## Blocked by

- Blocked by #065 (the Prado 2.0 rename should be live so the notice and the toggle label agree).
