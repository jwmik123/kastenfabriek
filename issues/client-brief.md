# Client Brief — Configurator Feedback

**Project:** bouw-je-kast — custom wardrobe configurator
**Stack:** Next.js 16 · Sanity CMS (Studio at `/studio`) · TypeScript · Tailwind CSS · Three.js
**Status:** Feedback round — items below grouped by area, with our recommendation where the client asked for input.

---

## 1. Slopes (schuinte)

### 1.1 Lower the slope start point — left and right
The diagonal (sloped side panels) should be able to start lower than they currently do. **Minimum start height: 30 cm.** Today the slope cannot be brought down far enough for low-eave situations.

### 1.2 Always place a shelf at the start of the slope
On left and right slopes, a shelf must **always** be placed at the point where the sloped section begins. The slope running back-to-front (schuin naar achter) is correct as-is.

### 1.3 Lower the handle automatically on a sloped door
When a door sits under a slope, its handle should be repositioned lower automatically so it stays reachable and visually correct.

### 1.4 Disable handles that don't fit a slope
Handles that cannot physically be mounted because of the slope must not be selectable for those doors.

---

## 2. Pricing & dimensioning logic

### 2.1 Auto-add an extra corpus when the cabinet gets wider
When the customer increases the total width, an extra corpus should be added automatically. More corpuses = more revenue, and it should feel logical that going wider adds cost — currently the price stays flat for too long.

- **Trigger:** add an extra corpus when width crosses **50 cm** and again at **100 cm** (client to confirm the exact thresholds).
- The customer can still **manually reduce** the corpus count afterward.

> **Note on current behaviour:** price staying the same across a wide width range is the core problem here — widening should visibly add a corpus *and* add cost.

### 2.2 Auto-adjust logically when going narrower
The reverse must also work: when the customer reduces the width, corpus count should reduce automatically and sensibly (mirror of 2.1).

### 2.3 Show a proposal immediately after dimensions are entered
Once the customer enters width / height / depth, we can show a starting proposal straight away.

> **Client question:** what should we show — a pre-filled cabinet (e.g. via the "dobbelstenen" / dice layout) so a cabinet appears immediately, or an empty shell for the customer to build up themselves?
>
> **Our recommendation:** show a **pre-filled default cabinet** immediately. An empty shell makes the customer do setup work before they see value; a filled cabinet gives an instant "this is mine" moment, communicates a baseline price, and is easier to then edit down than to build up from nothing. Use a sensible default layout per width tier.

---

## 3. Accessories & options

### 3.1 Accessories — add to the configurator
The customer should be able to add accessories. Confirmed items and prices:

- **Extra shelf (plank):** €45
- **Pull-out rail (uittrekbare roede):** €105

> **Client question:** can these be added later? — Yes, accessories can be delivered as a follow-up batch, but we'd like the full intended list up front so the data model and Sanity schema are built once.

### 3.2 Side panels option (zijpanelen)
Add a side-panel option with a thickness choice: **18 mm** or **36 mm**.

### 3.3 Sloped back wall — surcharge
Sloped back wall: **+€1,100**.

### 3.4 Sloped side wall — surcharge
Sloped side wall: **+€1,100**.

### 3.5 Power socket (WCD / wandcontactdoos) — rename to Prado 2.0
The power socket option stays. In 3D the socket can remain visually identical to the current one — good as is. Two changes:

- Rename the option to **Prado 2.0**.
- Update the price to **€145**.
- Add a notice (see 3.6).

### 3.6 Electrical notice for LED and WCD
When LED lighting **or** the WCD is selected, display a note that **mains electricity must be available behind the cabinet**. This applies to both options.

---

## 4. Handles (grepen / handgrepen)

### 4.1 Verify all handle colours — @Indy
Check that every handle is shown in the correct colour.

### 4.2 Handle colours and options are incorrect
The handle colours and available options do not currently match. **Check carefully against Prodinter** — use Indy's list as the reference.

### 4.3 Handles split white / grey
Handles come in part white, part grey — the configurator must reflect this split correctly.

### 4.4 Rename handles
> **Client question:** can we rename the handles? — Yes, handle names should be editable (planned via Sanity so the client can manage them).

### 4.5 Disable handles incompatible with a slope
(See 1.4 — handles that cannot be mounted because of a slope must not be selectable.)

### 4.6 Handle pricing
Handle prices are **still to be determined (ntb)** in the pricing sheet — pending input from the client.

---

## 5. Hinges (scharnieren)

### 5.1 Hinges are rotated incorrectly
Hinges currently appear rotated. They need to be corrected to the right orientation.

### 5.2 Bottom hinges look wrong at 80 cm
The bottom hinges don't look right at a height of 80 cm — needs to be checked and fixed.

---

## 6. 3D viewer — usability

### 6.1 Add an undo / return button in the 3D view
Add a return (undo) button inside the 3D view so the customer can easily step back after a mistake.

---

## 7. Layout / shelf behaviour

### 7.1 Shelves disappear too quickly in tall upper sections
In tall sections, shelves are removed too fast at the top and the result doesn't match the template. Shelf placement in high sections should follow the template.

---

## Open questions for the client

These items need a client decision before implementation:

1. **Proposal style** (3.3 / 2.3) — pre-filled cabinet vs empty shell. *Our recommendation: pre-filled.*
2. **Auto-corpus thresholds** (2.1) — confirm whether the extra-corpus triggers are at 50 cm and 100 cm.
3. **Full accessory list** (3.1) — beyond the extra shelf and pull-out rail, what else should be included so the schema is built once.
4. **Handle pricing** (4.6) — prices marked "ntb" in the pricing sheet.
5. **Handle naming source** (4.4) — confirm the definitive list (Indy / Prodinter) so names can be loaded into Sanity.

---

## Confirmed prices (from pricing sheet)

| Item | Price |
|---|---|
| Extra shelf (Plank Extra) | €45 |
| Pull-out rail (Uitrek roede) | €105 | (later addition)
| WCD — Prado 2.0 | €145 |
| Sloped back wall | +€1,100 |
| Sloped side wall | +€1,100 |
| Side panels (18 mm / 36 mm) | TBD |
| Handles | TBD (ntb) |
