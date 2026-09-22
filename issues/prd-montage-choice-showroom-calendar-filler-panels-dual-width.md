# PRD — Montage-keuze, showroomkalender, afwerkpanelen en restruimte bij dubbele wasmachineopstelling

Implements the second client feedback batch (September 2026). Four independent features; each can ship on its own. Terminology follows [`CONTEXT.md`](../CONTEXT.md).

> **Terminology note.** The client says **plinten** for the strip beside the washing machines. In this codebase that strip is the **afwerkpaneel** (`FillerPanel`) of a wasmachinekast section. "Plint" (`OnderstelPlinth`) is the low base under the kledingkast and is **not** what this brief is about. The client's "0,5 mm plinten" are afwerkpanelen of a few millimetres, produced when the section width minus the machine widths leaves a rest that is far too narrow to build.

## Original brief (verbatim, Dutch)

1. Montage staat volgens mij nu standaard aan. Ik wil zelf aan de achterkant kunnen aan- of uitzetten of klanten hierin een keuze krijgen. Zodra we zover zijn dat klanten zelf kunnen installeren, kan ik die keuze dus beschikbaar maken.
2. Een afsprakenkalender op de hoofdpagina voor de showroom, waarbij ik zelf aan de achterkant de beschikbare dagen en tijden kan instellen. De showroom is met ongeveer twee maandjes klaar, dus dan staat dat alvast.
3. Plinten links én rechts mogelijk maken. Nu is het volgens mij óf links óf rechts. Er ontstaan nu ook plinten van 0,5 mm. Het liefst verwerken we die ruimte in de zijpanelen als de kast tussen muren staat.
4. Bij de hoge en lage wasmachineopstellingen eventueel een vraag toevoegen: wil je de overige ruimte verdelen over de lage of juist de hoge modules waar geen wasmachines komen?

## Status (2026-09-22)

- **Feature 1 (montage-keuze):** built. Sanity field "Montage-keuze" on the pricing config; off by default.
- **Feature 3 (afwerkpanelen):** built. "Beide" option, `minFillerPanelCm` constraint (default 3), absorbed rest thickens both side panels for every placement type.
- **Feature 2 (showroomkalender):** built. Sanity singleton "Showroom-afspraken" with a calendar preview, Postgres table (migration 0006), homepage section with slot popup, two e-mails. Needs: migration run, singleton created and enabled in Studio.
- **Feature 4 (restruimte dubbele opstelling):** not started.

## Verified current state

- **Montage** is always included. Both configurators pick an `installationTier` by subtotal and add its price; the only owner-side switch is the `freeMontage` promo toggle on the pricing config, which zeroes the amount but keeps montage as a service. There is no "zelf monteren" option anywhere (configurator, cart, checkout, order, e-mails).
- **Showroom** has a V1 call-to-action in the cart and wishlist: a prefilled `mailto:` asking for a Saturday and a time. The component's own comment says V2 is a bookable calendar. There is no appointment data model, no availability config, and no calendar on the homepage. The only owner "back office" is Sanity Studio; the app has no admin pages. Prior art for an anonymous form that writes to Postgres and sends two Resend e-mails is the material-sample request.
- **Afwerkpaneel** (wasmachinekast only): one panel per section, side `left | right`, width = section inner width minus the fixed machine widths, only when that rest is below one module's minimum width. Any rest above zero becomes a panel, so a 0,05 cm panel is produced and priced as a door. The wasmachinekast already knows `placementType: 'ingebouwd' | 'vrijstaand'` ("tussen twee muren" vs "los in de ruimte") and a `sidePanelThickness` of 18 or 36 mm.
- **Dual layouts** (`low-left`, `low-right`) have two independent width inputs (high section, low section). There is no total-width input and no way to say where the rest should go; the customer balances this by hand.

## Problem Statement

As the shop owner I cannot offer "zelf monteren" as a customer choice without a code change, even though I expect to allow self-installation soon. I want the option to exist but stay hidden until I switch it on.

Customers who want to see materials first have to compose an e-mail and wait for a reply; I have to answer every one by hand and there is no shared view of when the showroom is free. The showroom opens in roughly two months (late November 2026) and I want the booking flow ready before then, with the open days and times under my own control.

In the wasmachinekast, the rest beside the machines is always closed off with one afwerkpaneel on one side, even when that rest is a few millimetres. A customer cannot split the panel over both sides, and a 0,5 mm panel cannot be produced; when the cabinet stands between walls that rest should disappear into thicker side panels instead.

In a high+low wasmachineopstelling the customer has to work out two widths themselves. What they actually know is the total width between the walls and a preference: should the leftover space go to the tall cabinet or to the low one?

## Solution

1. **Montage-keuze toggle.** Pricing config gets an owner toggle "Klant mag montage kiezen". Off (default): everything as today. On: both configurators show a montage choice — "Laten monteren" (tier price, or gratis during the promo) or "Zelf monteren" (€0, with an explanatory text the owner writes in Sanity). The choice is frozen into the cart price snapshot and shown consistently in the price panel, cart, checkout, order page, order e-mails and the admin notification.
2. **Showroomkalender.** A new Sanity singleton "Showroom-afspraken" holds the opening schedule (weekly template, exceptions, slot length, booking window, capacity, enabled switch). The homepage gets a "Bezoek de showroom" section with a month calendar; the customer picks an available day and slot, leaves name, e-mail, phone and an optional note, and gets a confirmation e-mail. The owner gets a notification e-mail. Bookings live in Postgres. The cart/wishlist CTA links to the calendar instead of the mailto.
3. **Afwerkpanelen links én rechts, en geen mini-panelen.** The afwerkpaneel side gains a third option "Beide zijden" that splits the rest equally. A minimum panel width (owner-configurable, default 3 cm) is introduced: a rest below it is no longer a panel but is absorbed into the two side panels (each grows by half the rest), for both placement types — the built cabinet always fills the typed width. *(Built: the free-standing "build narrower" variant was dropped for simplicity; see status.)*
4. **Restruimte-vraag bij dubbele opstelling.** In dual layouts the Dimensions step asks for the **total** width plus a preference "Overige ruimte naar: hoge kast / lage kast / gelijk verdelen". The two section widths are derived from that and from the machines placed in each section, and update automatically when machines are added or removed.

## User Stories

### Montage choice

1. As a shop owner, I want a toggle in the pricing configuration that decides whether customers may choose between "laten monteren" and "zelf monteren", so that I can enable self-installation the day I am ready for it, without a developer.
2. As a shop owner, I want the toggle to be off by default and to leave every current flow untouched while off, so that enabling the feature later is a deliberate act and nothing changes now.
3. As a shop owner, I want to write the short explanatory text shown next to "zelf monteren" (what the customer gets: bouwpakket, handleiding, etc.) in Sanity, so that the copy is mine.
4. As a shop owner, I want the toggle to apply to the kledingkast and the wasmachinekast at the same time, so that the offer is consistent.
5. As a customer, when the choice is enabled, I want to see a clear montage choice in the configurator with the price difference next to each option, so that I can decide on cost.
6. As a customer, I want "laten monteren" to be preselected, so that the safe default is the full service.
7. As a customer who picks "zelf monteren", I want the price panel total to drop by the montage amount immediately and the montage line to read "Zelf monteren · € 0", so that I see the effect at once.
8. As a customer who picks "zelf monteren", I want the "incl. levering & montage" note to become "incl. levering", so that the panel does not promise a service I declined.
9. As a customer, I want my montage choice to be frozen when I add the cabinet to the cart, so that a later change of the owner toggle does not alter what I am paying.
10. As a customer, I want the cart, checkout summary, order page and confirmation e-mail to show "Zelf monteren" where they would otherwise show the montage tier, so that every document agrees.
11. As a customer paying via Stripe, I want the charge to equal the total without montage when I chose self-installation, so that I am billed what I saw.
12. As a customer during a "gratis montage" promo with the choice enabled, I want "laten monteren" to read "gratis" and "zelf monteren" to read € 0, so that both options are honest and I can still choose the service.
13. As a customer restoring a saved configuration that has "zelf monteren" while the owner has switched the choice off again, I want the configuration to fall back to "laten monteren" with a notice, so that I cannot order something that is no longer offered.
14. As the fulfilment team, I want the admin order notification and the order spec to state "ZELF MONTEREN" prominently, so that no crew is scheduled for that order.
15. As the fulfilment team, I want the installation tier name still recorded for "laten monteren" orders exactly as today, so that planning does not change.

### Showroom calendar

16. As a shop owner, I want a "Showroom-afspraken" document in Sanity Studio where I set which weekdays the showroom is open and the time ranges per weekday, so that the calendar follows my real opening hours.
17. As a shop owner, I want to set the slot length (for example 30 or 60 minutes), so that slots match how long a visit takes.
18. As a shop owner, I want to add exceptions: closed dates (holidays) and extra open dates with their own times, so that one-offs do not require changing the weekly template.
19. As a shop owner, I want to set how far ahead customers may book (for example at most 8 weeks) and a minimum lead time (for example 24 hours), so that I am never surprised by a same-hour booking.
20. As a shop owner, I want to set how many bookings a slot can hold (default 1), so that I can allow two families at once when I want to.
21. As a shop owner, I want an "Boeken ingeschakeld" switch and an optional "Boekbaar vanaf" date, so that the calendar can be hidden or show "vanaf …" until the showroom is finished.
22. As a shop owner, I want an e-mail for every new booking with the date, time, name, e-mail, phone and note, so that I know who is coming.
23. As a shop owner, I want the confirmation e-mail the customer receives to be branded like the other transactional e-mails, so that it looks like us.
24. As a customer on the homepage, I want a "Bezoek de showroom" section with a month calendar in which open days are clearly marked, so that I see at a glance when I can come.
25. As a customer, I want to navigate to next and previous months within the booking window, so that I can plan ahead.
26. As a customer, I want to tap an open day and see its free time slots, with full slots disabled, so that I only pick something that is actually available.
27. As a customer, I want to enter my name, e-mail, phone and an optional note and submit, so that the booking is made without e-mail ping-pong.
28. As a customer, I want a clear success state with the chosen date and time and a line that a confirmation is on its way, so that I know it worked.
29. As a customer, I want a confirmation e-mail with date, time, the showroom address and a Google Maps link, so that I can find it.
30. As a customer, I want the calendar to work on a phone (the homepage is mostly visited on mobile), so that I can book from anywhere.
31. As a customer, I want the cart and wishlist showroom CTA to take me to the calendar instead of opening my mail client, so that booking is one flow.
32. As a customer, if two people try the same last slot at the same time, I want the second one to get a friendly "dit tijdslot is net geboekt" message and a refreshed list, so that no one gets a booking that does not exist.
33. As a shop owner, I want bots kept out with the same honeypot approach as the sample-request form, so that my inbox is not flooded.
34. As a shop owner, I want to cancel a booking by replying to the customer myself for now, so that V1 needs no admin screens.

### Afwerkpanelen

35. As a customer, I want a third option "Beide zijden" next to "Links" and "Rechts" for the afwerkpaneel of a section, so that the cabinet looks symmetrical between two walls.
36. As a customer choosing "Beide zijden", I want each panel to be half the rest and both to be shown in the 3D view and in the measurements, so that I see what I get.
37. As a customer, I want "Beide zijden" to be unavailable (greyed out with a hint) when half the rest would be narrower than the minimum panel width, so that I cannot create two mini-panels.
38. As a customer, I do not want an afwerkpaneel of a few millimetres to appear at all, so that the cabinet is buildable.
39. As a customer with a cabinet between walls, I want a rest below the minimum panel width to disappear into thicker side panels, so that the cabinet still fills the wall-to-wall width exactly.
40. As a customer with a cabinet between walls, I want the summary and the order spec to say "zijpanelen verdikt met X mm" when that happens, so that it is explicit.
41. As a customer with a free-standing cabinet, I want a rest below the minimum panel width to be dropped, with the effective built width shown, so that I know the cabinet is a few millimetres narrower than I typed.
42. As a shop owner, I want the minimum panel width in the pricing configuration, so that I can decide what is worth producing.
43. As a shop owner, I want the order spec, wireframe and admin e-mail to list both panels when the customer chose "Beide zijden", so that production builds the right thing.
44. As a customer, I want the price for a split afwerkpaneel to equal the price of a single one (same total material), so that symmetry does not cost extra. *(Assumption — see open questions.)*
45. As a customer restoring an old saved cabinet with a single-sided panel, I want it to load exactly as before, so that nothing breaks.

### Rest space in dual layouts

46. As a customer with a high+low layout, I want to enter the total width of the whole cabinet once, so that I do not have to split it in my head.
47. As a customer with a high+low layout, I want a question "Waar moet de overige ruimte naartoe?" with the options "Hoge kast", "Lage kast" and "Gelijk verdelen", so that the leftover goes where I want storage.
48. As a customer, I want the two section widths to be derived from that answer and shown read-only next to it, so that I still see what each part will be.
49. As a customer, when I place or remove a washer in either section, I want the section widths to re-balance automatically according to my preference, so that machines always fit and the rest stays where I asked.
50. As a customer, I want a section without machines to always keep at least one usable vak, even when I sent all the rest to the other section, so that no section becomes a bare panel.
51. As a customer, I want a clear message when the machines I placed no longer fit in the total width, so that I can widen the cabinet or remove a machine.
52. As a customer restoring a saved dual configuration made before this change, I want its two widths preserved and the preference inferred (the section that holds more free space), so that nothing shifts unexpectedly.
53. As the shop owner, I want the order spec to keep listing each section's own width, so that production is unaffected.

## Implementation Decisions

### Feature 1 — Montage choice

- **Pricing config schema.** Add an object "Montage-keuze" to the pricing config with: `customerCanChoose` (boolean, default false), `selfInstallLabel` (default "Zelf monteren"), `selfInstallDescription` (short text). It sits directly under the existing "Gratis Montage" toggle so both montage switches are together. The GROQ pricing query and the `PricingConfig` type are extended accordingly.
- **Store.** Both configurator stores get `montageOption: 'included' | 'self'`, default `'included'`, persisted in the saved configuration. When the store hydrates a config with `'self'` while the fetched pricing config has the choice disabled, it coerces to `'included'` and surfaces a one-time notice.
- **Montage pricing module.** The existing free-montage helper becomes a single montage helper taking `{ subtotal, installationTier, freeMontage, montageOption, choiceEnabled }` and returning `{ effectiveInstallationCost, freeMontageDiscount, freeMontageApplied, montageOption, installationTierName, originalPrice, grandTotal }`. Rules: choice disabled ⇒ treat as `'included'`; `'self'` ⇒ cost 0, no tier name, free-montage discount 0 and not applied; `'included'` ⇒ exactly today's behaviour. Both configurators' price hooks and the wasmachinekast pure pricing function call this one helper.
- **Price snapshot.** Add `montageOption` to the snapshot. `installationTierName` is null for self-install. `total` remains the amount charged, so Stripe session creation needs no change.
- **UI.** A "Montage" choice block appears in the last configuration step of both configurators (accessoires/summary), rendered only when the choice is enabled. Two radio cards: "Laten monteren" with the tier price (or "gratis" during the promo, with the struck-through price) and the self-install label with € 0 and the owner's description. The canvas price panel montage line reads the self-install label with € 0, and the note under the total drops "& montage". The mobile header note follows the same rule.
- **Downstream documents.** Cart line items, checkout summary, order page, order confirmation, admin notification and the spec PDF read `montageOption` from the snapshot and render the self-install label instead of the tier row. The admin notification and the spec PDF show it as a highlighted line.
- **Not a coupon, not a discount.** Self-install is a different service level, not a discount; it is never shown in green or as a minus line.

### Feature 2 — Showroom calendar

- **Sanity singleton `showroomAvailability`** ("Showroom-afspraken", under the Website group in Studio structure): `enabled` (boolean), `bookableFrom` (date, optional), `slotMinutes` (number, default 60), `capacityPerSlot` (number, default 1), `minLeadHours` (number, default 24), `maxWeeksAhead` (number, default 8), `weeklySchedule` (array of `{ weekday, ranges: [{ start, end }] }` using "HH:mm" strings), `exceptions` (array of `{ date, closed: boolean, ranges?: [...] }`), `introText`, `confirmationText`. Validation: ranges must be ordered, end after start, slot length divides each range.
- **Postgres table `showroom_appointment`**: `id`, `date` (date), `startTime`/`endTime` ("HH:mm"), `name`, `email`, `phone`, `note`, `status` (`confirmed | cancelled`), `createdAt`, `cancelledAt`. A partial unique index on `(date, startTime, seq)` is not needed; capacity is enforced by counting confirmed rows for the slot inside the insert transaction with a row lock on a per-slot advisory key, so concurrent bookings cannot exceed capacity. Migration generated with drizzle-kit like the existing ones.
- **Availability module (deep, pure).** `computeAvailability({ config, bookings, from, to, now, timeZone: 'Europe/Amsterdam' })` returns, per date in the range, the list of slots with `{ start, end, remaining }`. It applies: enabled and bookableFrom, weekly template, exceptions (closed wins; an exception with ranges replaces the weekday's ranges), slot slicing, min lead time, max weeks ahead, and subtracts confirmed bookings. All date arithmetic is done in Europe/Amsterdam so DST changes do not shift slots. This module carries most of the logic and is fully unit-tested.
- **Server actions.** `getShowroomAvailability(monthISO)` returns the month's availability (Sanity config + DB bookings through the module). `createShowroomAppointment(input)` validates (name, e-mail format, phone, note length, honeypot field), re-runs availability for the requested slot inside the transaction, inserts, and sends two Resend e-mails: `ShowroomAppointmentConfirmation` (customer) and `ShowroomAppointmentAdminNotification` (owner), modelled on the sample-request pair. A lost race returns `{ ok: false, code: 'slot-taken' }` and the UI refreshes the slots.
- **Homepage section** "Bezoek de showroom" (client component, rendered by the server homepage only when `enabled`; when `bookableFrom` is in the future it renders the intro plus "Afspraken mogelijk vanaf …" without a calendar). Month grid, day list of slots, form, success state. Anchored at `/#showroom`. Mobile-first layout: calendar and form stack; slots as a wrapping list of pill buttons.
- **Cart / wishlist CTA** keeps its copy but its button becomes a link to `/#showroom`; the mailto body is removed. The "elke zaterdag" copy is replaced by a generic line since the schedule is now Sanity-driven.
- **No admin UI** for bookings in V1; the notification e-mail is the owner's channel and the DB is the source of truth.

### Feature 3 — Afwerkpanelen

- **Filler side** becomes `'left' | 'right' | 'both'`. The store's `fillerPanelSide` per section accepts `'both'`; the derived `fillerPanel(section)` returns `{ side, widthCm }` where `widthCm` is the **total** rest, plus a derived `panels: Array<{ side: 'left' | 'right'; widthCm }>` (one entry, or two of half width).
- **Minimum panel width** `minFillerPanelCm` added to the pricing config constraints (default 3). Passed into the section-plan module.
- **Section-plan module extension.** `planSectionWidths` gains `minFillerCm` and returns `fillerWidthCm` only when the rest ≥ `minFillerCm`; otherwise it returns `absorbedRestCm` (the rest that is not a panel). The store exposes `sideWallExtraCm(section)`: for `ingebouwd`, `absorbedRestCm / 2` per side; for `vrijstaand`, 0, and the section's effective outer width becomes `width − absorbedRestCm`. "Beide zijden" is only selectable when `fillerWidthCm / 2 ≥ minFillerCm`; if it is already `'both'` and the rest shrinks below that, the store falls back to `'right'`.
- **Scene.** The filler-panel mesh renders per entry of `panels`; side walls read the extra thickness and grow inward on the section's outer sides; the measurements overlay measures each panel and, when absorbed, shows the side panel with its total thickness. The shared module/light-strip interior offsets take both sides into account.
- **Pricing.** The afwerkpaneel is priced once per section regardless of split (one door-panel price for the total strip). *(Assumption — see open questions.)*
- **Snapshot / order docs.** The cart snapshot's `fillerPanel` gains `side: 'both'` support and a `sideWallExtraCm` field; closet-spec and wireframe output both panels and note thickened side panels. Old snapshots without these fields load unchanged.
- **Summary text.** The modules-step hint and the summary section state either "afgewerkt met een afwerkpaneel van X cm links/rechts/aan beide zijden (2 × Y cm)" or "de resterende X mm wordt verwerkt in de zijpanelen" or, free-standing, "de kast wordt X mm smaller gebouwd".

### Feature 4 — Rest space in dual layouts

- **Store fields** for dual layouts: `totalWidth` (cm) and `restPreference: 'high' | 'low' | 'split'` (default `'high'`, since the tall cabinet holds the most storage). In dual layouts the section widths become derived; the single-section layouts keep their existing width input untouched.
- **Dual-width module (deep, pure).** `splitDualWidth({ totalCm, high: { fixedCm, wallsCm, hasMachines }, low: { fixedCm, wallsCm, hasMachines }, minVarWidthCm, preference })` returns `{ highWidthCm, lowWidthCm, fits, restCm }`. Rules: each section first receives its walls plus its fixed machine widths; a section without machines is guaranteed one minimum vak; the remaining rest goes fully to the preferred section, or is halved for `'split'`; `fits` is false when the guaranteed parts exceed the total. The store re-runs it after every change to total width, preference, machines, side-panel thickness or layout, then runs the existing per-section reconcile.
- **Dimensions step** for dual layouts: one "Totale breedte" input, the preference control (three cards with a one-line hint each), and a read-only line "Hoge kast X cm · Lage kast Y cm". When `fits` is false the step shows the existing style of inline error and blocks continuing.
- **Migration of saved configs.** A dual snapshot without `totalWidth` gets `totalWidth = highWidth + lowWidth` and `restPreference` inferred from which section has more non-machine width (`'split'` when equal). Section widths are then re-derived; because the inferred preference reproduces the saved rest, the derived widths match the saved ones.
- **Order documents** keep per-section widths; nothing changes downstream.

## Testing Decisions

A good test exercises a module through its public function or the rendered UI and asserts on outcomes (numbers, returned slots, visible text), never on internal state or call order. Existing patterns to follow: the pure section-plan and wasmachinekast pricing tests, the filler-panel and snapshot tests, and the e-mail template tests in `emails/__tests__`.

Modules to test:

- **Montage helper**: choice disabled ignores `'self'`; `'self'` zeroes cost and tier name and disables the promo discount; `'included'` matches today's numbers including the promo; snapshot round-trip keeps `montageOption`.
- **Availability module**: weekly template slicing; closed exception; exception with own ranges; lead time excludes today's near slots; max weeks ahead; capacity subtraction with one and two bookings; DST transition days keep the same wall-clock slots; disabled config yields nothing; `bookableFrom` in the future yields nothing.
- **Appointment action**: validation errors per field; honeypot returns ok without a row; slot-taken race returns the specific code (simulate with a pre-inserted booking); both e-mails render with the booking data.
- **Section-plan extension**: rest below minimum produces no panel and the right `absorbedRestCm`; `'both'` halves; `'both'` rejected below the threshold; wall-extra per placement type; old single-side snapshot loads unchanged.
- **Dual-width module**: each preference; section without machines keeps a vak; `fits` false when machines overflow; adding a machine moves width out of the rest; migration inference reproduces saved widths.
- **UI smoke** (existing component-test style): montage block hidden when disabled and visible when enabled; filler control shows three options and disables "Beide zijden" correctly; dual dimensions step shows the derived widths.

## Out of Scope

- Customer-side cancelling or rescheduling of showroom appointments, an owner booking overview page, and calendar sync (ICS / Google Calendar). Owner handles changes by e-mail in V1.
- Reminders before the visit.
- Charging a deposit or any payment for a showroom visit.
- Self-installation manuals, packaging or logistics changes; this PRD only adds the commercial option and its price effect.
- A per-product montage toggle (the choice is global, like the promo).
- Afwerkpanelen or side-panel absorption in the kledingkast; it has no afwerkpaneel concept.
- Changing how a single-section wasmachinekast handles its width; only dual layouts get the total-width flow.

## Further Notes

**Open questions for the client (answered with an assumption so work can start):**

1. **Split panel price** — priced as one panel (assumed) or as two door panels?
2. **Minimum panel width** — 3 cm assumed; the owner can change it in Sanity afterwards.
3. **Free-standing cabinet with a mini rest** — assumed the cabinet is built slightly narrower. Alternative: absorb into side panels there too.
4. **Default rest preference** in dual layouts — "hoge kast" assumed.
5. **Slot capacity and slot length defaults** — 1 visit per slot, 60 minutes assumed.
6. **Self-install copy** — the owner writes it in Sanity; a placeholder ships.

**Sequencing suggestion.** Features 3 and 4 both touch the wasmachinekast store and section plan; ship 3 first (it changes the plan module), then 4. Feature 2 is the largest and independent; it can start immediately since the showroom opens in about two months. Feature 1 is the smallest and can ship first.
