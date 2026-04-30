# PRD: Washer Module Actual Layout

## Problem Statement

The wasmachinekast configurator renders washer modules using a placeholder `washer.glb` model. The first version of the real washer module GLB is now available. Beyond swapping the model, washer modules have fundamentally different spatial requirements: they need their own integrated doors (already in the GLB), they must always have 10 cm of clearance behind them, and their front face must be flush with the outer cabinet corpus and doors — not recessed like a normal module. The stacked washer variant is also no longer part of the product range.

## Solution

Replace the placeholder GLB with the real washer module GLB (`ModuleWasherSingle.glb`). Extend the Module component with a depth override prop so washer modules can be rendered shallower than the cabinet depth and positioned flush with the outer door front face. Remove door rendering for washer slots at the scene level (the GLB contains its own doors). Remove the stacked washer config entirely. Set washer fill zones to open for now.

## User Stories

1. As a configurator user, I want the washer slot to show the real washer module model instead of a placeholder, so that the 3D preview looks like an actual product.
2. As a configurator user, I want the washer module front face to be flush with the cabinet doors, so that the preview looks like a coherent piece of furniture.
3. As a configurator user, I want 10 cm of clearance guaranteed behind every washer module, so that the cabinet accommodates the hoses and connections at the back of a washing machine.
4. As a configurator user, I want the washer module depth to scale with cabinet depth (always cabinet depth minus 10 cm), so that the rear clearance is always exactly 10 cm regardless of how deep I configure the cabinet.
5. As a configurator user, I want the double side-by-side washer module to use the same real GLB rendered twice side by side, so that both washer positions look correct.
6. As a configurator user, I want no extra door rendered on top of the washer slot, so that the washer's own integrated door is not obscured by a duplicate cabinet door.

## Implementation Decisions

### Washer Module Layout Configs
- The stacked washer variant (ID 13) is removed from the layout config array and from the washer IDs set. It is no longer part of the product range.
- The single washer (ID 11) and double side-by-side washer (ID 12) configs are updated to use the new GLB path under a `washermodules/` subdirectory.
- Both configs have fill zones set to `'open'` for now. Fill zones will be revisited in a later iteration once the vertical space allocation above washer modules is defined.
- The `double: true` flag on ID 12 remains; `SpecialElement` already handles rendering two GLB instances side by side.

### Module Component — Depth Override
- The Module component receives an optional `depthOverride` prop.
- When present, the module uses `depthOverride` as its depth instead of the default `cabinetDepth - backWall - insideInset` calculation.
- The module is repositioned in Z so its front face aligns with the outer door front face (the same Z position a normal module door occupies).
- This results in: washer module back face at `cabinetDepth - depthOverride` from the back panel, front face flush with cabinet doors.

### Scene-Level Washer Overrides
- The wasmachinekast scene render loop checks each module's `layoutId`.
- If the layout ID is a washer ID (11 or 12), two overrides are applied:
  1. `hasDoor` is forced to `false` regardless of the slot's store value — the GLB contains integrated doors.
  2. `depthOverride` is passed as `cabinetDepth - 0.10` (10 cm rear clearance).
- No store shape changes are required. Detection is purely based on `layoutId` at render time.

### GLB Asset
- GLB lives at `/public/objects/washermodules/ModuleWasherSingle.glb`.
- Mesh naming follows existing conventions (`_ds` depth scaling, `_ws` width scaling, `Right`/`Middle`/`Back` anchor suffixes) so `SpecialElement` handles scaling automatically.

## Testing Decisions

No tests are written for this implementation. All changes are geometric and visual — GLB path updates, positioning math, and render-time prop overrides. There are no store behavior changes and no new business logic to assert on. Correctness is verified visually in the configurator.

## Out of Scope

- The stacked washer variant (ID 13) — removed entirely, not deferred.
- Fill zone content above/below washer modules — left open, to be defined in a later iteration.
- Washer module door behavior (open/close interaction for the integrated GLB doors) — the GLB doors are visual only for now.
- Any kledingkast changes — the depth override prop is additive and does not affect wardrobe module rendering.
- Pricing changes for washer modules.

## Further Notes

- The `depthOverride` prop is intentionally generic — it can be reused for any future module type that needs a non-standard depth.
- The 10 cm rear clearance value (`0.10 m`) should be defined as a named constant rather than an inline literal.
- The `double: true` rendering path in `SpecialElement` already works correctly with the new GLB, assuming the GLB follows the existing mesh naming conventions.
