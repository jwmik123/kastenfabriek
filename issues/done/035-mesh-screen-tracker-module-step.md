# 035 — `MeshScreenTracker` + module-tracking step (kledingkast)

## Parent

[032-configurator-guided-tour.md](./032-configurator-guided-tour.md)

## What to build

Add the "Pas modules aan" step (step 3) to the kledingkast tour. Because modules live in WebGL, not the DOM, build a `MeshScreenTracker` R3F component that projects a target mesh's bounding box into screen space each frame and writes the resulting rect onto an invisible DOM div. The reactour selector points at that div, so the spotlight cutout follows the module as the camera moves or the viewport resizes.

Picking which module to track: default to the first module mesh by index. If no modules exist on DimensionsStep for some configuration, the step should degrade gracefully (skip or fall back to a static element) rather than crash.

## Acceptance criteria

- [ ] `MeshScreenTracker` component takes a mesh ref + a target div id and updates `top` / `left` / `width` / `height` on the target each frame from the projected bounding box
- [ ] Unit tests for `MeshScreenTracker` projection math: known world-space coords project to expected screen rect, off-screen mesh produces a rect outside viewport, camera change shifts the rect for the same mesh
- [ ] Invisible target div mounted into the configurator DOM with a stable id used by the tour selector
- [ ] Step 3 added to kledingkast tour: title "Pas modules aan", body "Klik op een module om hem te wijzigen of te vervangen.", spotlight tracks the chosen module
- [ ] Spotlight stays correctly positioned when the user rotates the camera or resizes the window during the step
- [ ] Graceful fallback when no module is available to track (step skips or points at a sensible alternative)
- [ ] Full four-step tour now plays end-to-end on kledingkast

## Blocked by

- Blocked by #034
