# 044 — Top cabinet corpus correctness under back-diagonal (mirror filler threshold to TC)

## Parent

[038-back-diagonal-corpus-and-room-fixes.md](./done/038-back-diagonal-corpus-and-room-fixes.md) — follow-up to [039](./done/039-back-diagonal-corpus-correctness.md).

## What to build

039 raised the back-diagonal filler threshold from `0` to `10cm` for the main corpus: `TopFillerWedge` renders when `flatSec < 10cm`, the flat top corpus panel only renders when `flatSec >= 10cm`, and `moduleCapY` decoupled module-cap from side-wall height.

The same threshold flip never propagated into the top cabinet (TC). TC still keys filler-active behaviour off `flatSec < 0.001`, so for `flatSec in (0, 10cm)` with TC enabled:

- The TC-internal flat ceiling panel ([TopCabinet.tsx:897-907](../app/(configurator)/kledingkast/scene/TopCabinet.tsx#L897-L907)) renders inside the TC interior at full closetHeight, while the main corpus is already painting `TopFillerWedge` covering the same region. Visible second ceiling panel inside the TC.
- `tcDoorTopH` stays at `doorCeilH` (innerCeilH = `closetHeight - SIDE_WALL_EXTRA - mainH - WALL`) instead of extending to the shell at slot-front, so the TC door panel and the corpus filler wedge sit in the same Z plane and z-fight.
- `tcDividerGeo` and `tcBdOuterProfile` use the `xFlatStart = depth - flatSec - WALL` kink (which assumes flat-zone-at-closetHeight) instead of the `tcFillerCrossingLZ` kink (slope-crossing of `fillerBottomY`). TC ceiling/divider profile mismatches the actual shell silhouette in the (0, 10cm) range.

Fix mirrors 039 in TC: bump `fillerActive` threshold to `FILLER_FLAT_SEC_THRESHOLD`, gate the TC-internal flat ceiling panel on the inverse, and invert the branch order in the two TC profile builders so `fillerActive` is checked first.

End-to-end:

- Import `FILLER_FLAT_SEC_THRESHOLD` from `diagonalUtils` into `TopCabinet.tsx`.
- `fillerActive` flips threshold from `0.001` to `FILLER_FLAT_SEC_THRESHOLD`.
- TC flat ceiling panel render gate flips from `flatSec > 0` to `flatSec >= FILLER_FLAT_SEC_THRESHOLD`.
- `tcDividerGeo` and `tcBdOuterProfile` invert their branches: `if (fillerActive) { tcFillerCrossingLZ kink } else if (flatSec > 0) { xFlatStart kink }`.
- All downstream values (`ceilH`, `innerCeilH`, `tcFillerCrossingLZ`, `doorCeilH`, `tcDoorTopH`, `shellAtHingeZ`, LED strip heights) already key off `fillerActive` and cascade automatically — no further code change.

## Acceptance criteria

- [ ] Back-diag on, TC active, `flatSec = 5cm`: the TC-internal flat ceiling panel does NOT render inside the TC interior.
- [ ] Back-diag on, TC active, `flatSec` anywhere in `(0, 9cm)`: TC ceiling profile slopes from `y=0` at TC back up to `innerCeilH = fillerBottomY - mainH` at the slope-shell crossing of `fillerBottomY`, then flat to slot-front. Divider trapezoid follows the same profile.
- [ ] Back-diag on, TC active, `flatSec` in `(0, 9cm)`: TC door front face and the main-corpus `TopFillerWedge` meet without z-fight or visible double-panel — TC door extends up to `shell_at_slot_front - WALL - mainH`.
- [ ] Back-diag on, TC active, `flatSec >= 10cm`: TC-internal flat ceiling panel renders. TC doors cap at `innerCeilH = closetHeight - SIDE_WALL_EXTRA - mainH - WALL`. Behaviour unchanged from current production.
- [ ] Back-diag on, TC active, `flatSec = 0`: behaviour unchanged from current production.
- [ ] Side-diagonal-only with TC active: render identical to current production.
- [ ] No-diagonal with TC active: render identical to current production.
- [ ] No new unit tests required — change is render-gate flips, not a new pure helper. `computeModuleCapY` tests from 039 already cover the helper.

## Implementation

Single file: [app/(configurator)/kledingkast/scene/TopCabinet.tsx](../app/(configurator)/kledingkast/scene/TopCabinet.tsx).

1. Add `FILLER_FLAT_SEC_THRESHOLD` to the existing `diagonalUtils` import.

2. [TopCabinet.tsx:745](../app/(configurator)/kledingkast/scene/TopCabinet.tsx#L745):
   ```ts
   const fillerActive = backDiagonal && flatSec < FILLER_FLAT_SEC_THRESHOLD
   ```

3. [TopCabinet.tsx:897](../app/(configurator)/kledingkast/scene/TopCabinet.tsx#L897) — gate flat top panel:
   ```tsx
   {backDiagonal && flatSec >= FILLER_FLAT_SEC_THRESHOLD && tcSlotDepth > WALL * 2 && (
     <mesh key="top-flat-bd" ... />
   )}
   ```

4. [TopCabinet.tsx:787-794](../app/(configurator)/kledingkast/scene/TopCabinet.tsx#L787-L794) `tcDividerGeo` — invert:
   ```ts
   if (fillerActive) {
     if (tcFillerCrossingLZ > xBack + 0.001 && tcFillerCrossingLZ < xFront - 0.001) {
       shape.lineTo(-tcFillerCrossingLZ, innerCeilH)
     }
   } else if (flatSec > 0) {
     const xFlatStart = depth - flatSec - WALL
     if (xFlatStart > xBack && xFlatStart < xFront) {
       shape.lineTo(-xFlatStart, innerCeilH)
     }
   }
   ```

5. [TopCabinet.tsx:807-815](../app/(configurator)/kledingkast/scene/TopCabinet.tsx#L807-L815) `tcBdOuterProfile` — same invert:
   ```ts
   if (fillerActive) {
     if (tcFillerCrossingLZ > tcBack_local + 0.001 && tcFillerCrossingLZ < moduleDepth - 0.001) {
       pts.push({ x: tcFillerCrossingLZ, y: trapNaN(innerCeilH, 'TC-bdCeil-innerCeilH-filler') })
     }
   } else if (flatSec > 0) {
     const xFlatStart = depth - flatSec - WALL
     if (xFlatStart > tcBack_local + 0.001 && xFlatStart < moduleDepth - 0.001) {
       pts.push({ x: xFlatStart, y: trapNaN(innerCeilH, 'TC-bdCeil-innerCeilH') })
     }
   }
   ```

## Out of scope

- Corpus side wall caps (commit `237ccbc`) only apply when `!needsTop`. TC keeps full-height side walls. No change.
- Room walls (commit `1873499`) mirror corpus side walls under same `!needsTop` condition. No change.
- `moduleCapY` / `computeModuleCapY` unchanged — TC active means `needsTop=true` which already returns `mainHeight` (TC handles the cap).

## Blocked by

None — 039 landed (commit `a913e80`) plus follow-ups (`fbe0205`, `237ccbc`, `1873499`).
