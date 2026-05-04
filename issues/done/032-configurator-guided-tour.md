# 032 — Configurator Guided Tour for New Customers

## Problem Statement

New customers landing on the configurator (kledingkast or wasmachinekast) don't realise:

- The floating toolbar on the left has actionable buttons (zoom, measurements, doors, randomiser).
- The 3D scene is interactive — they can drag to rotate the camera.
- Modules in the scene are clickable for editing/replacement.
- The "Volgende" button advances them through the configuration steps.

Without surfacing these affordances explicitly, users miss core interactions and bounce or under-use the tool.

## Solution

Add a four-step guided tour that auto-starts on a customer's first configurator visit. The tour uses a spotlight/cutout overlay: the highlighted element stays fully visible, the rest of the page dims. Each step shows a small Dutch-language card explaining what to do.

The tour is the same conceptual flow on both configurators and on both desktop and mobile. After completion (or skip), the tour does not re-trigger automatically. A help button in the canvas toolbar lets users replay the tour any time.

## User Stories

1. As a new customer landing on the configurator for the first time, I want a brief guided tour, so that I understand what I can do before I start configuring.
2. As a new customer, I want the tour to start automatically without me having to find a "help" button, so that I don't miss it.
3. As a new customer, I want to see which buttons exist in the canvas toolbar, so that I know I can zoom, toggle measurements, open doors, and randomise the layout.
4. As a new customer, I want to learn that I can drag the 3D scene to rotate the camera, so that I can inspect the cabinet from any angle.
5. As a new customer, I want to learn that modules in the scene are clickable, so that I know how to customise them.
6. As a new customer, I want to learn what the "Volgende" button does, so that I know how to progress through the configuration.
7. As a returning customer, I do not want the tour to interrupt me on every visit, so that the tool stays out of my way.
8. As a returning customer who forgot how something works, I want to find a help button to replay the tour, so that I can re-learn at will.
9. As a customer mid-tour, I want to be able to skip it at any time, so that I can start configuring immediately if I already know how it works.
10. As a customer mid-tour, I want to be able to dismiss the tour with the ESC key, so that I have a fast keyboard escape hatch.
11. As a customer on the toolbar tour step, I want to be able to actually click the highlighted toolbar button, so that I can try the affordance the tour is teaching me.
12. As a customer mid-tour, I do not want clicks outside the highlighted area to trigger anything, so that I cannot accidentally break the tour by misclicking.
13. As a mobile customer, I want the tour to use touch-friendly language ("sleep" rather than "klik en sleep"), so that the instructions make sense for my device.
14. As a customer on a small screen, I want the tour cards to remain readable and positioned correctly, so that the tour does not feel broken.
15. As a customer on the "click a module" tour step, I want the highlighted module to be a real module visible in the scene, so that the spotlight tracks something I can interact with even as the camera moves.
16. As a returning customer who has already seen v1 of the tour, I want a future major UX overhaul to re-trigger the tour, so that I'm re-onboarded when the experience changes meaningfully.
17. As a developer adding a new configurator type later, I want to define a tour by writing a config object rather than building a new tour component, so that I don't duplicate tour infrastructure.
18. As a developer, I want the localStorage flag and the WebGL projection logic to be unit-testable in isolation, so that I can verify the tricky parts without running the full configurator.

## Implementation Decisions

### Architecture

- One shared tour system lives under `_shared/`. Per-configurator differences (which mesh to track, copy variations) are expressed as configuration data, not as duplicated components.
- Tour library: `@reactour/tour`. Chosen over `react-joyride` (heavier, more opinionated), `driver.js` (vanilla DOM, fights React state), and a from-scratch build (high cost for a feature seen once per user). If the default reactour styling cannot be made to match the existing `bg-background/90 backdrop-blur-sm` aesthetic, fall back to a hand-rolled overlay.
- Tour autostart is gated by a versioned localStorage flag (`kf-tour-seen-v1`). The version suffix lets us re-trigger the tour after meaningful UX changes by bumping to `v2`.
- Tour starts on the first configurator step (DimensionsStep). Modules are visible in step 1 even before any layout has been applied, so the "click a module" step has a real target.
- Tour and configurator state are independent: completing the tour does not change configurator step, and changing configurator step does not advance the tour. The tour advances only via its own "Volgende" / "Sla over" buttons (or ESC).
- Click-through behaviour is hybrid: the dimming overlay swallows clicks outside the spotlight cutout, but clicks inside the spotlight pass through to the underlying element. This lets users actually press the highlighted toolbar button while preventing them from breaking the flow elsewhere.
- The "drag the scene" step does not gate on the user actually dragging. It spotlights the canvas, shows Dutch text, and an animated hand/cursor icon hints at the gesture.

### Modules

- **`TourProvider`** — wraps the configurator subtree, mounts the reactour `<TourProvider>`, owns the autostart logic on mount, and exposes a `startTour()` callback for the help button. Thin wiring layer.
- **`useTourStorage`** — pure hook owning the versioned localStorage flag. Exposes `hasSeen` / `markSeen` / `reset`. Encapsulates the version-suffix scheme so callers don't deal with key strings.
- **`MeshScreenTracker`** — R3F component used inside the canvas. Given a mesh ref and a target DOM element id, each frame it computes the mesh's bounding box in world space, projects the eight corners through the active camera into screen space, derives the 2D bounding rect, and writes `top` / `left` / `width` / `height` onto the target div's style. The invisible target div is what reactour's selector points at, so the spotlight cutout tracks the mesh as the camera moves or resizes.
- **`tourSteps` config** — per-configurator object: an ordered array of `{ selector, title, body, position }`. One instance for kledingkast, one for wasmachinekast. Mobile/desktop variations of selectors are resolved inside this config (e.g. by querying the breakpoint).
- **`HelpButton`** — appended to `CanvasToolbar`, uses the `HelpCircle` lucide icon, separator above. Calls `startTour()` from `TourProvider` context.
- **Reactour theming layer** — custom step card matching site visual language, including the "Volgende" / "Sla over" buttons and the "Aan de slag" final button.

### Tour copy (Dutch, locked)

| Step | Title | Body |
|------|-------|------|
| 1 | Bedieningsbalk | Hier vind je knoppen voor zoomen, afmetingen, deuren en willekeurige indeling. |
| 2 | Bekijk je kast | Sleep om de kast te draaien en bekijk hem van alle kanten. |
| 3 | Pas modules aan | Klik op een module om hem te wijzigen of te vervangen. |
| 4 | Volgende stap | Klik op "Volgende" om door te gaan naar de volgende configuratiestap. |

Buttons: "Volgende" / "Sla over" / final step CTA "Aan de slag".

## Testing Decisions

A good test here exercises external behaviour — what the consumer of a module sees — and does not couple to internal data structures, render order, or library internals. Tests should still pass after a refactor that preserves behaviour.

- **`useTourStorage`**: unit test the storage logic in isolation. Cover: returns `false` on a fresh client, returns `true` after `markSeen()`, returns `false` again after a version bump (key changes), tolerates a corrupt or missing localStorage gracefully. Prior art: existing hook tests in the codebase (look under shared `__tests__` directories near other hooks).
- **`MeshScreenTracker`**: unit test the projection math with a mocked camera and a fixture mesh bounding box. Cover: known world-space coordinates project to expected screen rect; a mesh moved off-screen produces a rect outside the viewport; a camera change produces a different rect for the same mesh. The DOM-write side effect can be asserted by passing in a fake target object. Prior art: existing canvas/component tests under `_shared/canvas/` or `_shared/components/__tests__/`.

The remaining modules — `TourProvider` (thin wiring), `tourSteps` config (static data), `HelpButton` (one button calling one function), and the reactour theming layer (pure JSX) — are covered by manual QA rather than unit tests.

## Out of Scope

- Localisation: copy is Dutch only. No i18n infrastructure.
- Analytics on tour completion / skip rates.
- Step-specific gating (e.g. requiring the user to actually drag before the tour advances). The tour does not react to user actions on the underlying configurator.
- A separate tour for the cart, checkout, or order confirmation flows.
- Onboarding for returning users when product features change beyond bumping the storage version.
- A/B testing of tour copy or order.
- Accessibility audit beyond what reactour provides out of the box (keyboard nav, focus trap). A dedicated a11y pass is a follow-up.

## Further Notes

- The WebGL→DOM projection used by `MeshScreenTracker` is a non-obvious technique. Future readers seeing an invisible div whose position is mutated each frame should understand it exists to give reactour a DOM target that follows a 3D mesh through camera changes.
- Picking *which* module to track in step 3 is an implementation detail. Default heuristic: first module mesh by index. If the scene has no modules at step 1 (configurator-type-dependent), the step's selector may fall back to a static element.
- Toolbar already has four button groups (zoom / measurements / doors / dice). Adding a fifth (help) is intentional — discoverability of the replay action is highest when it lives inside the thing the tour first explains.
- The `kf-tour-seen-v1` storage key version should be bumped (not deleted) on future major UX overhauls so prior consent state remains auditable in any analytics added later.
