# 034 — Static-target steps (canvas drag + Volgende) + hybrid click overlay

## Parent

[032-configurator-guided-tour.md](./032-configurator-guided-tour.md)

## What to build

Extend the kledingkast tour from one step to three by adding the two static-DOM-target steps:

- **Step 2 — "Bekijk je kast"**: spotlight the entire canvas, body copy "Sleep om de kast te draaien en bekijk hem van alle kanten.", animated hand/cursor icon hinting at the gesture.
- **Step 4 — "Volgende stap"**: spotlight the StepWizard (desktop) / MobileSheet (mobile) "Volgende" button, body copy explaining it advances configuration steps.

Also implement the hybrid click overlay: clicks outside the spotlight cutout are swallowed by the dim layer, clicks inside the cutout pass through to the underlying element. Tour advances only via its own "Volgende" / "Sla over" buttons regardless of underlying clicks.

Final step CTA reads "Aan de slag" instead of "Volgende".

## Acceptance criteria

- [ ] Step 2 added: spotlights the canvas with correct copy and animated hand/cursor icon
- [ ] Step 4 added: spotlights the "Volgende" button — selector resolves correctly for both desktop StepWizard and mobile MobileSheet
- [ ] Hybrid click behaviour: clicking inside the spotlight passes through to the underlying element (e.g. a toolbar button can be pressed during step 1); clicking outside the spotlight does nothing
- [ ] Underlying click during the tour does not advance the tour — only "Volgende" / "Sla over" / ESC do
- [ ] Final step button label is "Aan de slag", not "Volgende"
- [ ] Tour can be navigated forwards through all three steps end-to-end and completes by setting `hasSeen`

## Blocked by

- Blocked by #033
