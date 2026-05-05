# 033 — Tour scaffold + storage + first step (kledingkast toolbar)

## Parent

[032-configurator-guided-tour.md](./032-configurator-guided-tour.md)

## What to build

End-to-end tracer bullet for the guided tour. Install `@reactour/tour`, wire a `TourProvider` into the kledingkast configurator, and ship a single tour step that highlights the canvas toolbar with Dutch copy.

The tour auto-starts on first visit (gated by a versioned localStorage flag), can be dismissed with "Sla over" or ESC, persists the dismissal, and can be replayed via a new help button appended to `CanvasToolbar`.

This slice proves the full loop — storage, autostart, dismiss, replay — before any additional steps or WebGL projection work.

## Acceptance criteria

- [ ] `@reactour/tour` installed
- [ ] `useTourStorage` hook owns the versioned localStorage flag (`kf-tour-seen-v1`); exposes `hasSeen`, `markSeen`, `reset`
- [ ] `useTourStorage` has unit tests covering: fresh client returns `false`, returns `true` after `markSeen`, version bump invalidates prior consent, missing/corrupt localStorage tolerated
- [ ] `TourProvider` wraps the kledingkast configurator subtree and auto-starts the tour on first visit
- [ ] Single tour step renders, spotlights the `CanvasToolbar`, shows Dutch title "Bedieningsbalk" + body copy
- [ ] "Sla over" button and ESC key both dismiss the tour and call `markSeen`
- [ ] On reload after dismissal, the tour does not re-trigger
- [ ] `HelpCircle` button appended to `CanvasToolbar` (with separator above) calls `startTour()` and re-shows the tour regardless of `hasSeen` state
- [ ] No regressions in existing kledingkast canvas/toolbar interactions when the tour is closed

## Blocked by

None — can start immediately.
