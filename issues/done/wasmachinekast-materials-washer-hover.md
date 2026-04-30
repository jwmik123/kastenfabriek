# fix(wasmachinekast): materials, single-washer enforcement, and 3D hover feedback

## Problem Statement

The wasmachinekast configurator has three broken or missing UX behaviours:

1. **Materials are not applied to the closet.** Selecting a material in the material step has no visible effect on the 3D scene — the closet always renders with the default white finish.
2. **Multiple washing machines can appear simultaneously.** When a user goes back to the washer selection step (step 2) and picks a different slot, the previous washer remains visible in the 3D scene instead of being replaced.
3. **No visual feedback in the 3D scene when hovering slot buttons.** The step UI has slot buttons the user can hover to select a "vak" (slot), but the corresponding slot in the 3D scene does not react — making the relationship between UI and scene invisible.

## Solution

1. **Materials**: decouple the material context provider from the kledingkast store so it can be driven by any configurator's state, then wire the wasmachinekast store's material IDs into it.
2. **Single-washer enforcement**: when the user navigates back to the washer step, clear the previously assigned washer module (both the tracking state and the slot's layout assignment) so picking a new slot always results in exactly one washer.
3. **3D hover feedback**: propagate hover events from the step UI slot buttons into the shared hover state, and make the 3D slot overlay react to that state — so hovering a button highlights the corresponding slot in the scene.

## User Stories

1. As a configurator user, I want material selections to immediately appear on the 3D closet, so that I can evaluate finishes before purchasing.
2. As a configurator user, I want the exterior material I choose to be reflected on all closet panels, so that the preview matches the final product.
3. As a configurator user, I want the interior material I choose to be reflected on interior panels, so that I can see the full combination.
4. As a configurator user, I want per-module material overrides to still work after the material provider is refactored, so that my customisation is not regressed.
5. As a configurator user, I want to go back to the washer step and change my washer choice, so that I can reconsider after seeing the module layout.
6. As a configurator user, I want changing the washer slot to automatically remove the old washer, so that I never end up with two washing machines in the closet.
7. As a configurator user, I want navigating back to the washer step via the "Vorige" button to clear the previous selection, so that I start fresh without leftover state.
8. As a configurator user, I want navigating back to the washer step via the step indicator to clear the previous selection, so that both navigation paths behave consistently.
9. As a configurator user, I want to hover a slot button in the washer step UI and see the corresponding slot highlighted in the 3D scene, so that I understand which physical slot I am about to assign the washer to.
10. As a configurator user, I want the 3D slot highlight to disappear when I stop hovering the slot button, so that the scene does not show stale feedback.
11. As a configurator user, I want the hover highlight in the 3D scene to use the same visual style (green border + semi-transparent fill) as the existing pointer-hover highlight, so that the interaction feels consistent.

## Implementation Decisions

### Module 1 — Material context provider (decoupled from kledingkast store)

The `ClosetMaterialProvider` component currently reads `buitenkantMaterialId` and `binnenkantMaterialId` directly from the kledingkast store. It must be changed to accept these as explicit props instead, making it store-agnostic.

- The kledingkast scene passes its own store's values (existing behaviour, no regression).
- The wasmachinekast scene passes values from the wasmachinekast store.
- The `useClosetMaterialInstance` hook used by the onderstel plinth already sits inside the provider, so it will receive the correct values automatically once the provider is wired correctly.
- Per-module material override mechanism (`ModuleMaterialOverrideProvider`) is unchanged.

### Module 2 — `clearWasherModule` store action

`clearWasherModule` currently only resets the `washerSlotIndex` and `washerLayoutId` tracking fields. It must also clear `layoutId` and `fixedWidth` on the module at the old `washerSlotIndex` within the `modules` array.

The action reads `washerSlotIndex` from current state before resetting it, and conditionally maps over `modules` to null out the old slot — identical in structure to the clearing step already present in `setWasherModule`.

This is the single change needed to prevent multiple washers: once the slot's own `layoutId` is cleared, `setWasherModule` can safely skip its guard check and still produce a clean result.

No change to `StepWizard` call sites — they already call `clearWasherModule` at the right moments (Vorige from step 3, and step-indicator click targeting step 2).

### Module 3 — Slot hover: UI → 3D (one-way)

Two small changes:

**WasherStep slot buttons**: add `onMouseEnter` → `setHoveredSlot(slotIndex)` and `onMouseLeave` → `setHoveredSlot(null)`. The `setHoveredSlot` action already exists in the store.

**`WasmModuleSlotInteraction`**: the component already calls `setHoveredSlot` on pointer events and reads `selectedSlot` from the store. It must additionally read `hoveredSlot` from the store and combine it with its local pointer-hover state when computing the TSL uniform values. The combined signal `localHovered || storeHoveredSlot === slotIndex` drives `fillAlphaU` and `borderAlphaU`.

Bidirectional hover (3D → UI button) is out of scope.

## Testing Decisions

**What makes a good test here**: test the store action's external behaviour — what state does `modules` have after calling the action — not internal Zustand implementation details.

**Prior art**: `wasmachinekast/__tests__/store.test.ts` — existing tests call store actions directly via `useWasmachinekastStore.getState().<action>()` and assert on the resulting state shape.

**Tests to add for `clearWasherModule`**:
- After `setWasherModule(slot, layoutId)` followed by `clearWasherModule()`, the module at `slot` has `layoutId: null` and `fixedWidth: undefined`.
- After `clearWasherModule()`, `washerSlotIndex` is null and `washerLayoutId` is null (already tested; verify it still passes).
- After `setWasherModule(0, id)` → `clearWasherModule()` → `setWasherModule(1, id)`, only slot 1 has a non-null `layoutId` and slot 0 has `layoutId: null` (regression test for the double-washer bug).

No new tests for `ClosetMaterialProvider` (React context wiring, tested visually) or the hover interaction (purely visual, no meaningful state assertion beyond `hoveredSlot`).

## Out of Scope

- Bidirectional hover (3D scene → UI slot button highlight)
- Any changes to how the washer 3D models are loaded or scaled
- Changes to material texture assets or the list of available materials
- Step navigation flow beyond the two existing `clearWasherModule` call sites

## Further Notes

The `clearWasherModule` bug is the only reason multiple washers can appear. Once fixed, `setWasherModule`'s internal guard (`washerSlotIndex !== null && washerSlotIndex !== slotIndex`) becomes a secondary defence — it does not need to be changed.

The material provider refactor should be verified in both configurators (kledingkast and wasmachinekast) to ensure no regression in texture or solid-colour rendering, including the light-strip warmth node path.
