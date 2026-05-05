# 039 — Corpus correctness under back-diagonal (filler threshold + module cap split)

## Parent

[038-back-diagonal-corpus-and-room-fixes.md](./038-back-diagonal-corpus-and-room-fixes.md)

## What to build

Fix two coupled defects in the kledingkast corpus when the back-diagonal is enabled:

1. The corpus side walls fall short of the closet top whenever `backDiagFlatSectionDepth` (flatSec) is `0`.
2. The top-front filler panel only renders when flatSec is exactly `0`, but should render whenever flatSec is below `10cm`.

Root cause is shared: the kledingkast scene compositor overloads `mainHeight` to also carry a "module cap under filler" semantic, which makes the side walls follow a reduced height. The fix introduces a separate, explicitly-named cap value, removes the override, and raises the filler threshold to `10cm`. The flat top panel and the filler wedge will coexist for flatSec in `0..10cm`, abutting at the filler back-face.

End-to-end:

- A new pure helper in `diagonalUtils` computes the module cap height from `DiagParams` plus `needsTop`.
- `DiagParams` gains a `moduleCapY` field; the scene compositor populates it via the helper.
- `Module` consumes `moduleCapY` at its "cap module top" call sites and continues to consume `mainHeight` at slope-math sites.
- `ClosetCorpus` raises the filler render threshold to `< 10cm` and keeps the flat top panel rendering for flatSec greater than approximately `0`.

## Acceptance criteria

- [ ] With back-diagonal on and `flatSec = 0`, the corpus side walls reach the full closet height at the back.
- [ ] With back-diagonal on and `flatSec = 5cm`, the corpus side walls reach the full closet height at the back.
- [ ] With back-diagonal on and `flatSec` anywhere in `0..9cm`, the top-front filler panel is drawn.
- [ ] With back-diagonal on and `flatSec` in `0..9cm`, the flat top panel and the filler wedge meet without visible gap or overlap.
- [ ] With back-diagonal on and `flatSec >= 10cm`, only the flat top panel is drawn (no filler).
- [ ] With back-diagonal on and a small flatSec, modules placed under the filler are capped under the filler bottom and do not poke through.
- [ ] With back-diagonal on and `flatSec >= 10cm`, modules extend up to the real corpus top.
- [ ] With back-diagonal on and a top cabinet, module-cap behaviour is unchanged from current production.
- [ ] Side-diagonal-only configurations (no back-diagonal) render identically to current production.
- [ ] No-diagonal configurations render identically to current production.
- [ ] The new `computeModuleCapY` helper has unit tests covering: back-diagonal off; back-diagonal on with `flatSec = 0`; flatSec just below `10cm`; flatSec at `10cm`; flatSec above `10cm`; and `needsTop = true` with back-diagonal active.

## Blocked by

None - can start immediately
