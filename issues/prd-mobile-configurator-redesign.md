# PRD — Mobile-friendly configurator layout (kledingkast + wasmachinekast)

## Problem Statement

On a phone, both configurators (kledingkast and wasmachinekast) currently hide the
`StepWizard` side panel and show a swipe-up bottom drawer (`MobileSheet`, built on
vaul) instead. The customer dislikes the swipe-up interaction: the drawer floats over
the 3D scene, has to be dragged between snap points, and competes with canvas gestures.

The drawer is also incomplete: it hardcodes only **4** steps. On kledingkast it omits
**Accessoires**; on wasmachinekast it omits **Layout**, **Wasmachine**, and
**Accessoires** — so a customer literally cannot reach those steps on mobile. The
desktop `ConfiguratorTopBar` step rail does not fit a phone width either, and there is
no price or menu affordance in a mobile header.

## Solution

Replace the swipe-up drawer with a simple, fixed, top-to-bottom mobile layout for both
configurators. From top to bottom:

1. **Header bar** — total price on the left, a hamburger menu on the right. The
   hamburger opens the site navigation (Home / Producten / Blog links plus
   wishlist / cart / account icons), mirroring the existing site `Navigation`
   hamburger. Tapping a link leaves the configurator; the draft is already autosaved
   so the configuration is not lost.
2. **3D scene** — occupies ~40% of the viewport height. The canvas toolbar is laid out
   **horizontally across the top** of the scene instead of the vertical left rail, and
   the zoom in/out buttons are removed on mobile (pinch-to-zoom remains via
   `CameraControls`).
3. **Step content** — the full `StepWizard` rendered below the scene, vertically
   scrollable. **All** steps are reachable (including Accessoires and the
   wasmachinekast-only Layout/Wasmachine steps), reusing the existing `StepWizard`
   component rather than the drawer's 4-step subset.
4. **Fixed navigation buttons** — **Vorige** / **Volgende** (and **Voeg toe aan
   winkelwagen** on the last step) pinned to the bottom, always visible while the step
   content scrolls.

Desktop (`md` and up) is unchanged.

## User Stories

1. As a mobile customer, I want the configurator to use a normal top-to-bottom page
   layout, so that I don't have to drag a floating drawer to see the controls.
2. As a mobile customer, I want to always see the running total price in a header bar,
   so that I know the cost as I make changes.
3. As a mobile customer, I want a hamburger menu in the header, so that I can navigate
   to other parts of the site (Home, Producten, Blog) without hunting for a way out.
4. As a mobile customer, I want the hamburger menu to also expose my wishlist, cart,
   and account, so that I can reach those flows from inside the configurator.
5. As a mobile customer, I want my configuration kept when I open the menu and navigate
   away, so that I don't lose my work (covered by existing draft autosave).
6. As a mobile customer, I want the 3D scene to take a fixed ~40% of the screen, so that
   I can see my cabinet while still having room for the step controls below.
7. As a mobile customer, I want the scene tools laid out horizontally at the top of the
   scene, so that they don't eat into the limited width of a phone screen.
8. As a mobile customer, I want to pinch to zoom the 3D scene, so that I don't need
   dedicated zoom buttons taking up toolbar space.
9. As a mobile customer, I want to toggle measurements, open/close doors, and randomize
   the layout from the horizontal toolbar, so that I keep the same scene controls the
   desktop has (minus zoom).
10. As a mobile customer, I want the step content to scroll vertically below the scene,
    so that long steps (e.g. Materiaal, Accessoires) are fully usable.
11. As a mobile customer, I want the Vorige and Volgende buttons fixed at the bottom of
    the screen, so that I can always advance or go back without scrolling to find them.
12. As a mobile customer on the last step, I want the primary button to become "Voeg toe
    aan winkelwagen", so that I can complete my purchase from mobile.
13. As a mobile kledingkast customer, I want to reach the **Accessoires** step, so that I
    can add lighting and extras that were previously unreachable on mobile.
14. As a mobile wasmachinekast customer, I want to reach the **Layout**, **Wasmachine**,
    and **Accessoires** steps, so that I can complete a full wasmachinekast on mobile.
15. As a mobile customer, I want a step indicator showing where I am in the flow, so that
    I understand my progress (StepWizard already shows the "Stap X van N" eyebrow).
16. As a mobile customer editing an existing cart item, I want the same mobile layout, so
    that editing and creating feel identical.
17. As a returning mobile customer, I want my autosaved draft restored, so that I can pick
    up where I left off (existing behavior, preserved).
18. As a developer, I want the horizontal/vertical toolbar choice and the visible-button
    set driven by a single tested piece of logic, so that the two orientations can't drift
    apart.
19. As a developer, I want the mobile shell shared between both configurators, so that a
    layout fix lands in both products at once.
20. As a desktop customer, I want the existing side-panel layout untouched, so that the
    mobile work does not regress the desktop experience.

## Implementation Decisions

### Modules to build / modify

- **`ConfiguratorMobileHeader` (new, shared, `_shared/components/`)** — mobile-only header
  bar. Renders the formatted total price (left) and a hamburger button (right) that opens
  a site-navigation menu reusing the link/icon set and open/close pattern of
  `components/Navigation.tsx` (Home / Producten / Blog + wishlist / cart / account). Price
  is supplied by the per-configurator `useCartPrice` hook via the shared store context, so
  the component stays product-agnostic.

- **`CanvasToolbar` (modify, `_shared/components/`)** — gain an `orientation`
  (`'vertical' | 'horizontal'`) and the ability to hide the zoom buttons. Desktop keeps the
  vertical left rail with zoom; mobile renders horizontally across the top of the scene with
  zoom omitted. The decision of *which buttons render* and *in which orientation* is
  factored into a small pure helper so it is testable without mounting the 3D canvas.

- **Mobile layout shell (modify `KledingkastConfigurator.tsx` and
  `WasmachinekastConfigurator.tsx`, optionally extract a shared
  `ConfiguratorMobileLayout`)** — replace the `MobileSheet` render path with the fixed
  stack: `ConfiguratorMobileHeader` → scene container fixed at ~40svh with the horizontal
  toolbar → `StepWizard` (scrollable) → fixed Vorige/Volgende bar. Desktop branch
  (`md:` and up) keeps `ConfiguratorTopBar` + canvas + side-panel `StepWizard` exactly as
  today. Use responsive utility classes (mobile shell `md:hidden`, desktop shell
  `hidden md:flex`) rather than JS breakpoint detection where possible.

- **`StepWizard` (reuse, both products)** — already scrollable with pinned Vorige/Volgende
  and the full step list; reused as the mobile step content. Its internal
  overflow-scroll-middle / fixed-buttons-bottom structure already satisfies the
  "scrollable content, fixed buttons" requirement. The fixed bottom bar requirement is met
  by `StepWizard`'s own button row; a separate mobile button bar is not needed.

- **`MobileSheet` (remove, both products)** — `kledingkast/components/MobileSheet.tsx` and
  `wasmachinekast/components/MobileSheet.tsx` are deleted along with the `vaul` drawer usage.
  Remove the now-unused `vaul` dependency if nothing else imports it.

### Notes / constraints

- Scene height "~40%" uses a viewport-relative unit (e.g. `40svh`) chosen to behave well
  with mobile browser chrome; the exact unit is an implementation detail.
- Pinch-to-zoom continues to work through the existing `CameraControls`; removing the zoom
  buttons does not remove zoom capability. The store's `userZoom`/`zoomIn`/`zoomOut` stay for
  desktop.
- The configurator route still renders `Footer` per the layout (does not render the site
  `Navigation`); the mobile header is configurator-local and lives inside the configurator
  component, consistent with the existing top bar.
- No store, pricing, schema, or cart-snapshot changes. This is presentation/layout only.

## Testing Decisions

A good test here asserts **external behavior** — the inputs a caller passes and the
decisions that come back — not DOM structure or class names, which will churn during
layout work.

- **Toolbar orientation logic (tested).** The pure helper that, given orientation/viewport
  context, decides (a) horizontal vs vertical and (b) which buttons are present (zoom shown
  on desktop, hidden on mobile; randomize gated by its existing `showRandomize` flag) is
  unit-tested in isolation. Cases: desktop → vertical + zoom present; mobile → horizontal +
  zoom absent; `showRandomize=false` → randomize absent in both. No canvas mount required.
- **Prior art.** Follow the existing pure-logic unit tests under
  `app/(configurator)/.../__tests__/` (e.g. `slotWidths.test.ts`, store tests) — plain
  function-in / value-out assertions with Vitest, no React rendering.
- Not separately tested: the header presentation, the layout shell wiring, and `StepWizard`
  reuse — these are presentational/integration concerns covered by existing store and
  pricing tests and by manual verification on a device/emulator.

## Out of Scope

- Desktop layout changes of any kind.
- Changes to step content, pricing, the 3D scene contents, cart, or Sanity schema.
- A configurator-specific step-jump menu in the hamburger (decided against; hamburger is
  site navigation only).
- Tablet-specific tuning beyond the existing `md` breakpoint behavior.
- Gesture/animation polish on the scene beyond keeping pinch-to-zoom working.
- Replacing or restyling the desktop `ConfiguratorTopBar`.

## Further Notes

- Decisions captured from the planning conversation: hamburger = **site nav + account
  icons**; mobile shows **all steps (reuse StepWizard)**; the only module getting isolated
  tests is the **toolbar orientation logic**.
- Removing `MobileSheet` also removes the only consumers of `vaul`; confirm before dropping
  the dependency.
- Because both configurators share `_shared/components`, the header and toolbar changes land
  in both products from one implementation; the per-product configurator files only change
  in how they assemble the mobile shell.
