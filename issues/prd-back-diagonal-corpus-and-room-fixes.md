# 038 — Back-diagonal corpus and room-wall fixes

## Problem Statement

When the kledingkast back-diagonal is enabled, three visual defects appear:

1. **Side walls fall short of the closet top** when `backDiagFlatSectionDepth` (flatSec) is `0`. As soon as flatSec is `1cm` or more, the side walls reach the correct height.
2. **The top-front filler panel only shows when flatSec is `0`.** It should appear whenever flatSec is below `10cm`, because shallower flat sections are visually wrong and not buildable in real life.
3. **The room's back wall is invisible above the kink height** when the back-diagonal is active. The same class of defect previously affected the room's side walls when side-diagonals were enabled, and was solved there.

These defects only surface when the back-diagonal is active, but they degrade the configurator's preview enough that customers cannot trust what they see.

## Solution

Three coordinated fixes, all on the kledingkast scene:

1. Stop overloading `mainHeight` to also carry the "module cap under filler" semantic. Introduce a separate, explicitly-named cap value so the corpus side walls keep using the real `mainHeight` and reach full closet height regardless of flatSec.
2. Render the top-front filler wedge whenever flatSec is below `10cm`, not just when it is `0`. Keep the existing flat top panel rendering whenever flatSec is at least `~0`, so both panels coexist and abut for flatSec values in the `0..10cm` range.
3. Flip the winding of the back-diagonal slope panel in the room shell so its inner face faces the room interior. The panel will then be visible when the user looks up-and-back from inside the closet.

## User Stories

1. As a customer configuring a kledingkast with the back-diagonal enabled and `flatSec = 0`, I want the corpus side walls to reach the full closet height at the back, so that the closet preview matches the actual product.
2. As a customer configuring a kledingkast with the back-diagonal enabled and `flatSec = 5cm`, I want the corpus side walls to reach the full closet height at the back, so that the preview is consistent across all flatSec values.
3. As a customer configuring a kledingkast with the back-diagonal enabled and any flatSec from `0cm` to `9cm`, I want a top-front filler panel to be drawn, so that the closet has a visually closed top consistent with how it would be built.
4. As a customer configuring a kledingkast with `flatSec = 10cm` or more, I want only the flat top panel (no filler), so that I see the same configuration that would be manufactured.
5. As a customer configuring a kledingkast with the back-diagonal enabled and `flatSec` between `0cm` and `9cm`, I want the flat top panel and the filler wedge to meet without gap or overlap, so that the top of the closet looks continuous.
6. As a customer placing modules in a kledingkast with the back-diagonal enabled and a small flatSec, I want module heights under the filler to be capped under the filler bottom, so that no module pokes through the visible filler panel.
7. As a customer placing modules in a kledingkast with the back-diagonal enabled and `flatSec >= 10cm`, I want module heights to extend up to the real corpus top, so that I can use the full vertical space.
8. As a customer placing modules in a kledingkast with a top cabinet and the back-diagonal active, I want the module-cap behaviour to remain unchanged, so that the existing TC layout continues to work.
9. As a customer viewing the room around the kledingkast with the back-diagonal enabled, I want the back room wall to be visible above the kink height when I look up-and-back, so that the room reads as enclosed.
10. As a customer viewing the room around the kledingkast in `vrijstaand` placement with the back-diagonal enabled, I want the back room slope to be visible across the full extended scene width, so that the room reads as enclosed even when the closet is narrower than the scene.
11. As a customer with side-diagonals enabled (no back-diagonal), I want all existing room and corpus geometry to render unchanged, so that this fix does not regress the side-diagonal preview.
12. As a customer with no diagonals at all, I want the corpus and room to render exactly as before, so that this fix does not regress the simple closet preview.

## Implementation Decisions

### Module cap semantic split

- Extend `DiagParams` with an additional field that names the module cap height explicitly (separate from `mainHeight`).
- The kledingkast scene compositor computes this cap height. When the back-diagonal is active, flatSec is below `10cm`, and there is no top cabinet, the cap is the shell height at the filler back face (the existing `getBackDiagHeightAtZ(depth - 0.15, p)` formula). Otherwise the cap equals `mainHeight`.
- The shared `Module` component switches its "cap module top" call sites to consume the new field. Diagonal-math call sites (slope rise, side-diag rise, TC door cap) keep consuming `mainHeight`.
- The corpus side walls always consume the real `mainHeight`. The previous override of `mainHeight` to `fillerBottomY` in the scene compositor is removed.

### Filler / top panel coexistence

- The filler wedge in the corpus renders whenever flatSec is below `10cm` (the previous threshold was effectively `0`).
- The flat top panel in the corpus continues to render whenever flatSec is greater than approximately `0`. For flatSec values in the `0..10cm` range both panels render and abut at the filler back-face Z. For flatSec at exactly `0` only the filler renders. For flatSec at `10cm` or above only the flat panel renders.
- The filler wedge geometry is unchanged — its existing `getBackDiagHeightAtZ`-derived front/back top heights handle the case where the filler back face sits inside the flat zone (the wedge degenerates into a slab, which is the correct shape).
- The top cabinet branch is unchanged.

### Room back-diagonal slope visibility

- The back-diagonal slope panel in the room shell is constructed with the opposite triangle winding, so its surface normal points down-and-forward into the room interior. With the project's `FrontSide` material this makes the panel visible from inside the closet looking up-and-back.
- No change to the back room wall rectangle, the side-diag side-wall builder, the ceiling, the floor, or the corpus back wall.

### Deep-module extraction

- The cap computation is extracted as a pure helper in the diagonal-utils module. It takes the `DiagParams` plus a `needsTop` boolean and returns the cap height. It is the only piece of new logic with a non-trivial branch and is the natural unit to test in isolation.

## Testing Decisions

- **What makes a good test here:** assert the externally-visible contract of the cap helper — for a given combination of `backDiagonal`, flatSec, `needsTop`, and shell parameters, what cap value is returned. Do not assert on the intermediate formula or the exact `getBackDiagHeightAtZ` invocation; only on the resulting number.
- **Modules to test:** the new pure cap helper in diagonal-utils. The cases worth covering are: back-diagonal off; back-diagonal on with flatSec at exactly `0`; flatSec just below `10cm`; flatSec at `10cm`; flatSec above `10cm`; and `needsTop = true` with the back-diagonal active (cap should equal `mainHeight`).
- **Prior art:** the kledingkast scene already uses the `diagonalUtils` helpers (`getDiagHeightAt`, `getBackDiagHeightAtZ`) as pure functions. The new helper follows the same shape — pure, deterministic, no React or Three.js dependency — and should be tested the same way other pure utilities in the repo are tested.
- All other changes (corpus filler threshold, room slope winding, side-wall reach) are visual-only and verified by inspecting the kledingkast preview with: back-diag on + flatSec = 0; back-diag on + flatSec = 5cm; back-diag on + flatSec = 10cm; back-diag on + `needsTop`; back-diag on + `vrijstaand`; side-diag on, back-diag off (regression); no diagonals (regression).

## Out of Scope

- Wasmachinekast back-diagonal behaviour (the wasmachinekast configurator does not use the back-diagonal feature in this code path).
- Changes to the side-diagonal corpus or room geometry.
- Changes to the top cabinet, plinth, structural shelves, or light strips.
- The `15cm` filler depth constant — kept as is.
- Any change to user-facing inputs in `DimensionsStep` or the closet store. The `0..10cm` range remains a valid user input; the change is purely in how it is rendered.

## Further Notes

- The `effectiveMainH = fillerBottomY` override in the kledingkast scene compositor was the root cause that linked problem (1) to problem (2). Removing it cleanly is what enables changing the filler threshold from `0` to `10cm` without making the side-wall defect worse across the wider range.
- The room back-wall slope winding bug is independent of the corpus changes and can ship in the same PR or separately. It is grouped here because all three defects appear together when a customer enables the back-diagonal.
- The cap helper's `15cm`-from-front offset matches the existing filler-bottom computation in the corpus. If that constant ever changes, both the corpus and the cap helper must be updated together; consider lifting it to a named constant in `diagonalUtils` as a follow-up.
