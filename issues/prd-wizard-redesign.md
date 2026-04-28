# PRD: Step Wizard Redesign — Handle Materials, Carousel Selectors & Accessories

## Problem Statement

The closet configurator's 5-step wizard presents some choices in ways that limit usability and visual clarity. The module layout selector is a dense grid that gives little visual weight to each option. The handle selector is similarly cramped. Handle material (currently always chrome) cannot be changed, limiting the product offering. There is no way to extend doors down to the floor for a flush look. The lighting step is a single toggle that underrepresents what will become a growing set of accessories. Electrical plug holes exist as a global toggle but should be configurable per module to match how customers actually think about their closet.

## Solution

Redesign the configurator wizard to improve the presentation of key choices:

- Replace the module layout grid and handle grid with horizontal-scroll carousels (3.5 items visible, indicating more content).
- Add a handle material selector (Chrome / Zwart / Goud) on the handles step, rendered visually in the 3D scene.
- Add a global toggle on the modules step to extend main corpus doors to 2 cm above the floor.
- Rename the "Verlichting" step to "Accessoires" and restructure it to hold LED strips (global) and electrical plug holes (per module, with 3D circle mesh on the module backwall).
- Update the store and snapshot types to reflect all new fields.

## User Stories

1. As a customer, I want to see module layouts presented as a horizontal carousel, so that each layout option gets more visual space and is easier to evaluate.
2. As a customer, I want to see 3.5 layouts at once in the carousel, so that I can immediately tell there are more options to explore.
3. As a customer, I want to swipe or scroll through module layouts per selected slot, so that I can browse all options without the interface feeling cluttered.
4. As a customer, I want the currently active layout to be visually highlighted in the carousel, so that I always know which layout is selected.
5. As a customer, I want to see handle options in a horizontal carousel with images, names, and prices, so that I can compare handles at a glance.
6. As a customer, I want to see 3.5 handle options at once in the carousel, so that I can tell more handles are available without scrolling.
7. As a customer, I want to select a handle material finish (Chrome, Zwart, Goud) after choosing a handle type, so that I can match the hardware to my room's aesthetic.
8. As a customer, I want the handle material selector to disappear when I choose push-to-open, so that irrelevant controls are not shown.
9. As a customer, I want the selected handle material to be reflected immediately in the 3D preview, so that I can judge how it looks before ordering.
10. As a customer, I want to extend the main corpus doors to 2 cm above the floor, so that the closet has a floor-to-ceiling look without visible plinth.
11. As a customer, I want the door extension toggle to be in the modules step, so that it is grouped with other door-related configuration.
12. As a customer, I want the door extension to be reflected immediately in the 3D preview, so that I can see how it changes the appearance.
13. As a customer, I want the last step to be called "Accessoires" instead of "Verlichting", so that I understand it covers more than just lighting.
14. As a customer, I want to see the LED strip toggle in the Accessoires step, so that I can still add lighting to my closet.
15. As a customer, I want to add an electrical plug hole to individual modules in the Accessoires step, so that I can plan power access for specific compartments.
16. As a customer, I want to select which module slots get plug holes using the same slot-grid I know from the modules step, so that the interaction feels consistent.
17. As a customer, I want to see a visual indicator (circle mesh) on the back wall of modules that have plug holes enabled, so that I can verify placement in the 3D preview.
18. As a customer, I want plug hole selections to persist as I navigate between wizard steps, so that I do not have to re-configure after going back.
19. As a customer, I want plug holes to contribute to the order price per enabled module, so that the quoted price accurately reflects my configuration.
20. As a customer, I want the door extension option to apply to all main corpus doors simultaneously, so that the look is consistent across the full closet width.

## Implementation Decisions

### Modules to Build or Modify

**Modified: `ModulesStep` component**
- Layout grid for the selected slot → horizontal scroll carousel, 3.5 items visible per view.
- New "Deuren tot de vloer" section: global toggle that sets `doorsExtendToFloor` in the store.
- Section lives below the module count and slot configuration, above the step navigation.

**Modified: `DoorHandlesStep` component**
- Handle type grid → horizontal scroll carousel, 3.5 items visible per view.
- Add a material segmented control (Chrome / Zwart / Goud) directly below the carousel.
- Material control is hidden (not rendered) when `doorHandleId === 'none'` (push-to-open).

**Modified: `LightingStep` component (renamed to `AccessoiresStep`)**
- File renamed, step label in `STEPS` array updated to "Accessoires".
- LED strips section retained as-is (global toggle).
- New "Stekkerdoos gaten" section: slot-grid selector (same pattern as ModulesStep) with a per-slot toggle.
- Slots with `hasPowerHole === true` show a visual indicator (plug icon) on their grid cell.

**Modified: `StepWizard` component**
- `STEPS` array: step 5 label changed from "Verlichting" to "Accessoires".
- Import updated to reference the renamed Accessoires step component.

**Modified: Closet store (`store.ts`)**
- Add `doorHandleMaterial: 'chrome' | 'black' | 'gold'` field (default: `'chrome'`).
- Add `setDoorHandleMaterial` action.
- Add `doorsExtendToFloor: boolean` field (default: `false`).
- Add `setDoorsExtendToFloor` action.
- Add `hasPowerHole?: boolean` to `ModuleSlot` interface (default: `false`).
- Remove global `powerCableHolesEnabled` field and its setter.
- `setModuleCount` and `restoreConfig` updated to handle `hasPowerHole` on each slot.

**Modified: `ClosetConfigSnapshot` type**
- Add `doorHandleMaterial: 'chrome' | 'black' | 'gold'`.
- Add `doorsExtendToFloor: boolean`.
- Per-module snapshot entries gain `hasPowerHole: boolean`.
- Remove `powerCableHolesEnabled` top-level field (breaking change; old configs default to `false` per module).

**Modified: `HandleByType` 3D component**
- Accepts a `material` prop: `'chrome' | 'black' | 'gold'`.
- Three `MeshPhysicalMaterial` variants created via `useMemo`:
  - Chrome: `color #d3d3d3`, high metalness, low roughness, clearcoat.
  - Black: `color #1a1a1a`, high metalness, moderate roughness.
  - Gold: `color #c9a84c`, high metalness, moderate roughness.
- Material applied to the handle mesh instead of the hardcoded chrome material.
- All callers updated to pass the material prop from the store.

**Modified: Door mesh in 3D scene**
- When `doorsExtendToFloor` is true, the main corpus door mesh height is extended downward so the bottom edge sits at y=0.02 m (2 cm above floor).
- Top cabinet doors are not affected.
- Change is purely visual; no price impact.

**New: Power hole circle mesh**
- When a `ModuleSlot` has `hasPowerHole === true`, a flat circle mesh is placed on the back wall of that module.
- Purely decorative — no actual hole geometry.
- Material: neutral matte color matching the binnenkant material.

**Modified: `useCartPrice` hook**
- Remove reference to `powerCableHolesEnabled`.
- Count modules where `hasPowerHole === true` and multiply by the per-hole unit price from pricing data.

**Modified: `KledingkastConfigurator` component**
- Snapshot builder updated: replace `powerCableHolesEnabled` with per-module `hasPowerHole`, add `doorHandleMaterial`, add `doorsExtendToFloor`.

### Architecture Decisions

- Handle material is purely visual — no Sanity pricing entry needed.
- Door extension is purely visual — no pricing impact.
- Plug holes move from global to per-module; pricing aggregates module count.
- `restoreConfig` treats missing `hasPowerHole` on old snapshot modules as `false` for backwards compatibility.
- Carousel component is a shared scrollable row using CSS scroll snap; no external library required. `scroll-snap-type: x mandatory` with `calc(100% / 3.5)` item widths produces the 3.5-visible effect.

### API Contracts

- `HandleByType` new prop signature: `{ id: string; material: 'chrome' | 'black' | 'gold'; mirror?: boolean; ...Three.js group props }`.
- Store `ModuleSlot`: `hasPowerHole?: boolean` — optional, defaults to false everywhere it is constructed.

## Testing Decisions

Good tests verify external behavior against a module's public interface — inputs in, observable outputs or side effects out — without testing internal implementation details.

**Store actions** — highest priority:
- `setModuleCount` preserves `hasPowerHole` on existing slots, initializes new slots with `false`.
- `restoreConfig` correctly maps old snapshots (no `hasPowerHole`) to `false` per slot.
- `setDoorHandleMaterial` updates state correctly.
- `setDoorsExtendToFloor` updates state correctly.
- These are pure Zustand store tests — no rendering needed.

**`useCartPrice` hook**:
- Price increases correctly when N modules have `hasPowerHole === true`.
- Price unchanged when no modules have plug holes.
- Prior art: existing price hook tests if present; otherwise render hook with mocked store.

**Carousel component** (if extracted as a standalone component):
- Renders the correct number of visible items.
- Active item has the correct highlighted class.
- Scroll position updates when active item changes programmatically.

## Out of Scope

- Per-module handle type or material overrides (handles are global).
- Partial door extension (e.g. only some doors extended to floor).
- Animated carousel transitions beyond native CSS scroll.
- Handle material affecting order pricing.
- Door extension affecting order pricing.
- Top cabinet door extension to floor.
- Per-module LED strip control (LED remains global).
- More than three handle material options in this iteration.
- Sanity CMS entries for handle material names or images.

## Further Notes

- The `doorHandleId` default is `'23'` (W7845). The `doorHandleMaterial` default is `'chrome'`, preserving exact current visual behavior for all existing configurations.
- The carousel's 3.5-item width is intentional: the half-visible item is a standard mobile UX pattern that signals horizontal scrollability without any explicit "more" indicator.
- The power hole circle mesh should be placed at a consistent height on the back wall regardless of module layout, so placement is predictable across all layout types.
- `powerCableHolesEnabled` is referenced in `KledingkastConfigurator`, `useCartPrice`, and the store. All three must be updated atomically to avoid runtime errors.
