# PRD: Usable Washer Modules

## Problem Statement

The wasmachinekast configurator has washer module support stubbed out, but it is not usable in practice. The placeholder washer renders at the wrong vertical position — anchored to the scene floor instead of the module floor — and is not horizontally centered in its slot. There is no dedicated step for choosing the washer type and location before configuring the rest of the cabinet, meaning the washer slot has no special status and can be overwritten by the randomizer or manual layout pickers. The single washer module is also too wide (75 cm minimum) relative to a standard EU washing machine (60 cm wide), and there is no stacked double-washer variant. The real `washer.glb` model is available but unused.

## Solution

Introduce a dedicated washer selection step (step 2 in the wizard, before the modules step) where the user picks a washer module type and which cabinet slot it occupies. That slot is then locked for the remainder of the configuration flow — the randomizer and manual layout pickers on the modules step cannot change it. The single washer module width is reduced to 65 cm. A double side-by-side variant (130 cm, two washers) and a stacked vertical variant (65 cm, two washers on top of each other) are added. The washer placeholder is replaced by the real `washer.glb` model, correctly positioned: anchored to the module floor and centered in the slot both horizontally and in depth.

## User Stories

1. As a configurator user, I want a dedicated washer step before I configure other modules, so that the washer position is established before I make other layout decisions.
2. As a configurator user, I want to select a washer module type (single, double side-by-side, or double stacked) in the washer step, so that I can match the correct washer configuration to my situation.
3. As a configurator user, I want unavailable washer types to be visually disabled (greyed out) based on my cabinet width, so that I cannot select a configuration that does not fit.
4. As a configurator user, I want to pick which slot in the cabinet the washer occupies, so that I can choose whether the washer is on the left, right, or middle of the cabinet.
5. As a configurator user, I want the washer slot to be visually locked on the modules step, so that I always know which slot is reserved for the washer.
6. As a configurator user, I want the randomizer on the modules step to leave the washer slot untouched, so that auto-filling does not overwrite my washer configuration.
7. As a configurator user, I want to go back to the washer step and change my washer type or slot, so that I can correct my choice without starting over.
8. As a configurator user, I want the washer selection to reset automatically if I change the cabinet dimensions such that the chosen slot no longer exists, so that I am not left with an invalid configuration.
9. As a configurator user, I want to be returned to the washer step when a reset occurs, so that I am prompted to re-select before continuing.
10. As a configurator user, I want the washer to appear sitting on the module floor (not sunken into the plinth), so that the 3D preview looks realistic.
11. As a configurator user, I want the washer model to be centered horizontally in its slot, so that the preview looks balanced and accurate.
12. As a configurator user, I want the washer model to be centered in depth within the module, so that it does not appear pushed to the back or front.
13. As a configurator user, I want the single washer module to be 65 cm wide, so that a standard 60 cm washing machine fills the slot naturally.
14. As a configurator user, I want the double side-by-side module to be 130 cm wide (one fixed-width slot), so that two standard washing machines fit next to each other.
15. As a configurator user, I want the double stacked module to be 65 cm wide with two washers rendered on top of each other, so that I can stack a washer and dryer vertically.
16. As a configurator user, I want the real washer GLB model rendered as the placeholder (not a grey box), so that the 3D preview looks like an actual washing machine.
17. As a configurator user, I want shelves rendered above the washer zone in all washer module variants, so that the space above the washer is usable storage.
18. As a configurator user, I want the step indicator to show 6 steps (Afmetingen, Wasmachine, Modules, Materiaal, Handgrepen, Accessoires), so that I can see where I am in the configuration flow.
19. As a configurator user, I want to toggle a door on the washer slot from the modules step, so that I can choose whether the washer compartment has a door.
20. As a configurator user, I want the washer type selector to be extensible so that new washer configurations can be added without changing the step UI.

## Implementation Decisions

### Step Wizard
- The wizard grows from 5 to 6 steps: Afmetingen (1) → Wasmachine (2) → Modules (3) → Materiaal (4) → Handgrepen (5) → Accessoires (6).
- All existing step numbers shift by one after the new washer step.
- The store's `nextStep`/`prevStep` max is updated to 6.

### Washer Step UI
- A washer type selector shows all washer module configs as selectable cards. Cards are disabled (greyed out) when the cabinet width is insufficient for that type.
- After selecting a type, a slot grid (same visual pattern as the modules step slot grid) lets the user pick which slot the washer occupies.
- The washer type configs are defined in an array — adding a new type requires only a new entry, no changes to the step component.

### Store Shape
- Two new fields on the wasmachinekast store: `washerSlotIndex: number | null` and `washerLayoutId: number | null`.
- New actions: `setWasherModule(slotIndex, layoutId)` and `clearWasherModule()`.
- `randomFill` skips the slot at `washerSlotIndex`.
- `setModuleCount` (and by extension `setWidth`) checks whether the washer slot index is still valid after the change; if not, it calls `clearWasherModule()` and resets the step to 2.
- Going back to step 2 (navigating to the washer step) implicitly unlocks the washer selection for re-picking.

### Modules Step
- The washer slot is rendered in the slot grid with a locked appearance (non-interactive, distinct visual).
- The layout carousel for the washer slot is hidden — the user cannot change the washer layout from the modules step.
- Door toggle and other non-layout controls remain available for the washer slot.

### Washer Module Configs
- Single washer: `fixedWidth: 65 cm`, `glbPath: '/objects/washer.glb'`, anchor `fixed` at `fromBottom: 0`.
- Double side-by-side: `fixedWidth: 130 cm`, `glbPath: '/objects/washer.glb'`, renders two washer GLB instances side by side, anchor `fixed` at `fromBottom: 0`.
- Double stacked: new config, `fixedWidth: 65 cm`, `glbPath: '/objects/washer.glb'`, renders two washer GLB instances at Y=0 and Y=0.90m, anchor `fixed` at `fromBottom: 0`.
- All washer configs use `{ type: 'fixed', fromBottom: 0 }` as the anchor, replacing the previous `{ type: 'bottom' }`. This is a wasmachinekast-only change and does not affect kledingkast layouts.

### 3D Positioning Fixes
- The washer Y anchor bug is fixed by switching from `{ type: 'bottom' }` (which computed `specialElementY = -MODULE_FLOOR_Y`, sinking the washer to the scene floor) to `{ type: 'fixed', fromBottom: 0 }` (washer bottom at module floor level).
- The GLB centering is fixed in `SpecialElementInner`: `offsetX` is changed from `-box.min.x + MODULE_WALL` (left-aligned) to `MODULE_WALL + targetWidth/2 - (box.min.x + box.max.x)/2` (centered in slot interior). This uses the bounding box center so it works for any model geometry.
- Depth centering: `offsetZ` is similarly updated to center the model in the slot depth.
- The stacked variant renders two primitives from the same cloned scene: one at `positionY`, one at `positionY + WASHER_SLOT_HEIGHT`.

### Validation
- Single washer requires cabinet width ≥ 65 cm (always true in practice).
- Double side-by-side requires cabinet width ≥ 130 cm + at least one other module slot.
- Stacked requires cabinet width ≥ 65 cm (same as single).
- Validation runs at washer step render time; unavailable types are greyed out, not removed.

## Testing Decisions

Good tests verify external behavior (what the store exposes and what the UI renders) — not internal implementation details like how `computeSlotWidthsM` works internally.

### What makes a good test here
- Test store actions through their public interface: call `setWasherModule`, `clearWasherModule`, `setModuleCount`, etc. and assert on the resulting state shape.
- Test that `randomFill` never changes the washer slot.
- Test that reducing module count below the washer slot index triggers a reset.
- Do not test private helpers or Three.js rendering paths.

### Modules to test
- **Wasmachinekast store** — the primary test surface. Extend the existing `store.test.ts` with:
  - `setWasherModule` sets both `washerSlotIndex` and `washerLayoutId`.
  - `clearWasherModule` nulls both fields.
  - `randomFill` preserves the washer slot's `layoutId`.
  - `setModuleCount` to a count that excludes the washer slot index → both washer fields reset to null.
  - `setWidth` that forces a module count reduction → same reset behavior.

### Prior art
- `app/(main)/(bouw-je-kast)/wasmachinekast/__tests__/store.test.ts` — existing store tests follow the pattern of calling store actions directly and asserting on `getState()`. New tests should follow the same pattern.

## Out of Scope

- Pricing for washer modules (prices remain 0 / come from Sanity).
- A real dryer GLB (the stacked variant uses the same `washer.glb` for both positions).
- Scaling the washer GLB to slot dimensions (the GLB renders at native size; the 65 cm slot is sized to fit it).
- Any kledingkast changes — the anchor fix is wasmachinekast-only.
- Cart/checkout integration changes beyond what already exists.
- Mobile layout changes to the washer step.

## Further Notes

- The `washer.glb` bounding box (from its GLTF metadata) is approximately 60 cm wide × 85 cm tall × 53 cm deep. The 65 cm slot gives ~2.5 cm clearance on each side when centered.
- The stacked variant washer zone height is 180 cm (2 × 90 cm slots). At a default cabinet height of 240 cm, this leaves 60 cm of shelf space above — enough for 2–3 shelves.
- The `fixedWidth` mechanism in `computeSlotWidthsM` already handles fixed-width slots correctly; no changes needed there.
- Adding future washer types (e.g. a combination washer-dryer unit) requires only a new entry in the washer configs array and a corresponding `ModuleLayoutConfig` entry — the step UI, store, and scene rendering adapt automatically.
