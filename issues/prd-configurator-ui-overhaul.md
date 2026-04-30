# PRD: Configurator UI Overhaul — Full-Screen Layout, Top Stepper & Canvas Popover

## Problem Statement

The closet configurator (kledingkast and wasmachinekast) sits inside the global site layout, causing the site navigation and footer to render around a tool that demands the user's full attention. The right panel is cramped and scrolly — the step indicator, step content, module config card, and navigation buttons compete for a narrow third of the screen. Module editing requires the user to find a slot in a small grid, then read the config card in the side panel — two spatially separated interactions for one conceptual action. The pricing information is a small floating card tucked in a corner, easy to miss. There is no consistent visual hierarchy communicating where the user is in the configuration process.

## Solution

Replace the current layout with a focused, full-screen configurator shell that hides the global site navigation and footer. Add a top stepper bar that shows the user's position across all steps at a glance. Redesign the right panel to give each step a clear header and more breathing room. Move module editing into an inline canvas popover anchored to the clicked bay, so editing happens in context. Upgrade the pricing bar to a full-width frosted strip pinned at the bottom of the viewport, always visible regardless of panel scroll position. Lift shared UI components to eliminate duplication between kledingkast and wasmachinekast.

## User Stories

1. As a configurator user, I want the global site navigation and footer to be hidden while I configure, so that I can focus entirely on the configuration task without distractions.
2. As a configurator user, I want to see all wizard steps in a persistent top bar, so that I always know how far along I am without scrolling.
3. As a configurator user, I want completed steps to be visually marked with a checkmark, so that I can see my progress at a glance.
4. As a configurator user, I want to jump back to a completed step by clicking it in the top bar, so that I can revise earlier choices without clicking "Vorige" repeatedly.
5. As a configurator user, I want the current step to be clearly highlighted in the top bar, so that I am never confused about which step I am on.
6. As a configurator user, I want each step in the right panel to show a descriptive title and subtitle, so that I understand what I am configuring before I start.
7. As a configurator user, I want the step title to use the brand green as an eyebrow label, so that the visual language matches the site's design system.
8. As a configurator user, I want the right side panel to be a consistent width on large screens, so that the layout feels stable as I move between steps.
9. As a configurator user, I want the panel to adapt to smaller desktop screens without breaking, so that the configurator works on a range of monitor sizes.
10. As a configurator user, I want the 3D viewport to occupy roughly 60% of the horizontal space, so that I can see the closet clearly while still having room for controls.
11. As a configurator user, I want to click a numbered bay in the 3D view during the modules step, so that I can edit that bay without switching to the side panel.
12. As a configurator user, I want an inline popover to appear near the selected bay when I click it, so that I can edit the bay in spatial context.
13. As a configurator user, I want to change the interior layout of a bay (open shelving, hanging space, drawers, mix) directly in the popover, so that the 3D preview updates immediately as I try options.
14. As a configurator user, I want to toggle the door on a bay from the popover, so that I can quickly add or remove a door without navigating away.
15. As a configurator user, I want to toggle a bay into double-module mode from the popover, so that I can combine adjacent bays without leaving the canvas.
16. As a configurator user, I want the popover to close when I click elsewhere or press Escape, so that it does not obstruct the view.
17. As a kledingkast user, I want the popover to only show layout options that fit within a diagonal-constrained bay's available height, so that I cannot select an incompatible configuration.
18. As a wasmachinekast user, I want washer-locked bays to be inert — no popover opens on click — so that I cannot accidentally modify the machine bay.
19. As a configurator user, I want the total price and delivery window to be visible at all times in a bar at the bottom of the 3D viewport, so that I always know what I am about to spend.
20. As a configurator user, I want the pricing bar to show a summary of the current step's key choices, so that I can see the impact of my selection without reading the full panel.
21. As a configurator user, I want a "Bewaar" (save) button in the pricing bar, so that I can bookmark my design.
22. As a configurator user, I want the "Voeg toe aan winkelwagen" button to be in the pricing bar, so that the call-to-action is always reachable.
23. As a configurator user, I want the pricing bar to use a frosted glass treatment, so that the 3D scene remains partially visible behind it.
24. As a configurator user, I want the tool rail (zoom in/out, measurements, doors toggle, random fill) to sit on the left edge of the viewport as a vertical strip, so that it does not obscure the closet.
25. As a configurator user, I want the step navigation ("Vorige" / "Volgende") to remain in the side panel footer, so that it is visually separate from the cart action and there is no ambiguity between the two.
26. As a mobile user, I want the existing bottom sheet to remain unchanged, so that the mobile experience is not regressed by the desktop layout changes.
27. As a wasmachinekast user, I want the top stepper to show all six steps including the "Wasmachine" step, so that the bar correctly reflects the wasmachinekast wizard flow.
28. As a configurator user, I want my draft configuration to continue auto-saving to localStorage regardless of the layout changes, so that I do not lose work on page refresh.

## Implementation Decisions

### Route Structure

- Both configurator page trees are moved to a new `(configurator)` route group (sibling to `(main)`).
- The `(configurator)` layout is a bare wrapper with no navigation or footer.
- The `(main)` layout and its `Navigation` + `Footer` are not modified.
- The URL paths `/kledingkast` and `/wasmachinekast` are preserved exactly — no redirects needed.
- The existing `(bouw-je-kast)` grouping is removed as a result of the move.

### Shared `ConfiguratorTopBar` component

- Single component in the `_shared/components/` directory.
- Accepts: `steps: { label: string; number: number }[]`, `currentStep: number`, `onStep: (n: number) => void`.
- Renders: brand logo + product name on the left; step breadcrumbs with connector lines in the centre; heart, cart, and user icon buttons on the right.
- Step bubble states: todo (hollow, muted), current (filled dark), done (filled green with checkmark).
- Clicking a done bubble calls `onStep`; clicking current or todo bubbles does nothing.
- Height: 64px fixed, `border-bottom`.
- Each configurator passes its own step array (kledingkast: 5 steps; wasmachinekast: 6 steps including "Wasmachine" at position 2).

### Layout restructure (both Configurator roots)

- Top-level shell: `flex flex-col h-[100dvh]` — no `md:h-[92vh]` adjustment needed (nav is gone).
- `ConfiguratorTopBar` renders as the first child (64px).
- Below the bar: `flex flex-1 min-h-0` → canvas column (`flex-1 min-w-0`) + panel column (`w-full lg:w-[420px] shrink-0`).
- `pt-24` is removed from the panel.
- Mobile MobileSheet is unchanged.

### Step header in `StepWizard`

- A `STEP_META` constant defined in each configurator's `StepWizard` maps step number → `{ eyebrow: string; title: string; subtitle: string }`.
- The eyebrow uses the brand green and uppercase tracking.
- The title uses the serif typeface (Cormorant Garamond or equivalent) at a larger size.
- The subtitle is small and muted.
- The header is rendered above the scrollable step content area, outside the scroll container.

### Shared `CanvasPricePanel` redesign

- Layout changes from a small floating card (`absolute bottom-5 right-5`) to a full-width bar (`absolute bottom-0 left-0 right-0`).
- Frosted glass: `bg-background/90 backdrop-blur-sm`.
- Content columns (left to right): total price (serif, large) | vertical divider | delivery window | vertical divider | step summary | spacer | "Bewaar" ghost button | "Voeg toe aan winkelwagen" primary button.
- New prop: `stepSummary?: { label: string; value: string }`. When absent the column is hidden.
- Each per-configurator wrapper (`kledingkast/components/CanvasPricePanel.tsx`, `wasmachinekast/components/CanvasPricePanel.tsx`) computes `stepSummary` from its own store and passes it down.
- The shared display component does not import any store directly.

### Lifted shared `CanvasToolbar`

- Moved to `_shared/components/CanvasToolbar.tsx`.
- Uses `useConfiguratorStore` (context hook) instead of a hardcoded store import — works for both configurators because all required actions (`toggleDoors`, `toggleMeasurements`, `zoomIn`, `zoomOut`, `randomFill`, `userZoom`, `doorsOpen`, `showMeasurements`) are on `BaseConfiguratorState`.
- Repositioned from `absolute bottom-5 left-5` (horizontal row) to `absolute left-4 top-1/3` (vertical flex column).
- Button layout switches from `flex-row` to `flex-col` with horizontal separators becoming vertical ones.
- Per-configurator `CanvasToolbar` files are deleted.
- Canvas files updated to import from `_shared`.

### Canvas `ModulePopover` (per-configurator)

- Implemented as an HTML overlay inside each canvas's `relative` wrapper div, rendered alongside the existing `CanvasToolbar` and `CanvasPricePanel` overlays.
- Renders only when: the active step is the modules step AND `selectedSlot !== null`.
- Position: `absolute`, horizontally offset based on `selectedSlot / moduleCount` to approximate the bay's screen position. Arrow indicator points toward the bay.
- Content:
  - Bay number badge + "Vak N instellen" header + close button.
  - Layout picker: thumbnail grid showing available layouts for the slot; active layout highlighted.
  - "Deur" toggle.
  - "Dubbele module" toggle (hidden when slot cannot be doubled).
  - "Covered slot" message replaces all controls when the slot is the second half of a double module.
- Kledingkast version filters available layouts by `selectedSlotEffectiveHeightM` (diagonal constraint logic unchanged, moved/referenced from `ModulesStep`).
- Wasmachinekast version: popover does not open for washer-locked slots (guard at the click handler level).
- Closes on outside click or Escape key.

### `ModulesStep` cleanup (both)

- The "config card" section (the `selectedSlot !== null` block rendering deur/dubbele toggles and the layout carousel) is removed.
- The slot-grid remains: clicking a slot sets `selectedSlot` (which triggers the canvas popover) and deselects on second click.
- "Deuren tot de vloer" toggle section remains.
- The module count stepper remains.
- Kledingkast `ModulesStep` retains the `isUnderDiagonal` / `canBeDouble` / `selectedSlotEffectiveHeightM` calculations — these are now consumed by the canvas `ModulePopover` (imported or colocated).

### Panel width

- Panel uses `w-full lg:w-[420px] lg:max-w-[420px]` — fluid on small/medium, fixed on large.

## Testing Decisions

Good tests verify the externally observable behaviour of a module against its public interface — what renders given certain inputs, what callbacks are called given certain interactions — without asserting on internal implementation details or CSS class names.

**`ConfiguratorTopBar`**

- Given `currentStep = 3` and a 5-step array, steps 1 and 2 render a checkmark, step 3 renders as current (distinct from others), steps 4 and 5 render as todo.
- Clicking a done step button calls `onStep` with the correct step number.
- Clicking the current step button does not call `onStep`.
- Prior art: `renderToStaticMarkup`-based tests in `kledingkast/__tests__/`, no external test runner setup needed beyond what already exists.

**`ModulePopover` (kledingkast)**

- Given a normal slot, the layout picker, deur toggle, and dubbele module toggle all render.
- Given a covered slot (second half of a double), only the "covered slot" message renders — no controls.
- Given a diagonal-constrained slot whose available height is below a layout's required height, that layout option does not appear in the picker.
- Uses a mocked `useClosetStore` (same pattern as existing `AccessoiresStep.test.tsx`).

**`CanvasPricePanel`**

- Given `totalPrice = 3597`, renders the formatted price.
- Given a delivery window string, renders it.
- Given `stepSummary = { label: 'Modules', value: '6 modules · 4 deuren' }`, renders both the label and value.
- Given no `stepSummary` prop, the summary column is not present in the output.
- Uses `renderToStaticMarkup` with all required props passed directly (no store dependency in the shared display component).

## Out of Scope

- The "Doorsnede" and "Vooraanzicht" view switcher pill (skipped entirely).
- Any camera mode changes (orthographic, cross-section).
- "Meer opties" deep-link in the popover — the button is rendered but does not navigate.
- Wishlist / save functionality behind the "Bewaar" button (button rendered but not wired).
- Per-step pricing breakdown or price delta display.
- Responsive behaviour below the `md` breakpoint (mobile is handled by the unchanged MobileSheet).
- Any changes to Sanity schemas or pricing data queries.
- Changes to the `ClosetSummarySection` that appears below the kledingkast configurator.

## Further Notes

- The `(configurator)` route group must also include any shared layout concerns currently handled by `(bouw-je-kast)/layout.tsx` — that layout is currently a passthrough and can be replaced without behaviour change.
- The `ModulePopover` position is approximate (CSS-based offset from slot index), not a true 3D projection. The existing `MeasurementsOverlayLayer` 3D→2D projection system is available for a future improvement.
- Both configurator canvas files (`KledingkastCanvas`, `WasmachinekastCanvas`) currently import `CanvasToolbar` and `CanvasPricePanel` directly. Both imports must be updated to the new shared locations after the lift.
- The `BrightnessAudit` debug function in `KledingkastCanvas` can be removed as part of this work.
- `ClosetSummarySection` (kledingkast only) is rendered below the configurator in the page. Since the configurator moves to the `(configurator)` route group, this section must move with it or be handled in the new page file — its route is unchanged but it currently lives inside the `(main)` tree.
