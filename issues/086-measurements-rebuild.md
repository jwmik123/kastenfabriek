# PRD — Rebuild measurement overlays (kledingkast + wasmachinekast)

## Problem Statement

When a customer turns on measurements in the configurator, the dimension lines they see are incomplete and, in some layouts, wrong:

- **Kledingkast**: A module with a hanging rail (roede) shows no measurement to that rail, so the customer can't tell how high the rail sits or how much hanging space they get. The closet's depth is never shown. When a side or back slope (schuinte) is configured, the sloped edges carry no measurements at all.
- **Wasmachinekast**: Module widths don't show up at all in the washer/section layouts, and depth is never shown. In the dual-section layouts (low-left / low-right) the measurement geometry doesn't even line up with the rendered cabinet, because the overlay assumes a single full-width cabinet centered at the origin while the scene actually draws one corpus per section at its own X offset.

These overlays were built early in the project's life against a simpler scene and have drifted out of sync with how corpuses, modules, sections, and slopes are now rendered.

## Solution

Rebuild both measurement overlays on top of a single, pure **measurement spec builder** per configurator, plus one shared render shell. The builder turns the current store/scene configuration into a flat list of measurement specs (two endpoints + offset + label) using the same geometry the scene already uses, so every line lands exactly on the rendered cabinet. New measurements added:

- **Kledingkast**: rail (roede) measurements per module, closet depth, and slope (schuinte) measurements for left/right/back diagonals — in addition to the existing total width, total height, and per-module widths.
- **Wasmachinekast**: per-section module widths that match the rendered sections in every layout (high-only, low-only, low-left, low-right), plus depth.

The rail measurement follows the customer's mental model:
- Rail in the **upper half** of the module → measure from the corpus top (roof) down to the rail.
- Rail in the **lower half** → measure from the floor up to the rail's top side.

## User Stories

1. As a customer configuring a kledingkast, I want to see how high a hanging rail sits, so that I know whether my long coats will fit.
2. As a customer with a rail near the top of a module, I want the measurement drawn from the closet top down to the rail, so that I can read the hanging clearance directly.
3. As a customer with a rail in the lower half of a module (e.g. a double-rail layout), I want the measurement drawn from the floor up to the rail's top side, so that I understand the lower hanging zone.
4. As a customer with a double-rail module, I want each rail's height shown, so that I can judge both hanging zones.
5. As a customer, I want to see the closet's depth as a measurement, so that I can confirm it fits my room and my clothes.
6. As a customer who configured a left or right slope, I want the sloped edge measured, so that I can verify the slope matches my ceiling.
7. As a customer with a back slope, I want the slope measured, so that I understand the usable depth at the slope.
8. As a customer, I want the slope's start height and horizontal reach shown, so that I can match it to my room's geometry.
9. As a customer configuring a wasmachinekast, I want to see each module's width, so that I can confirm my washer and dryer fit.
10. As a customer using a washer layout, I want module widths shown for that layout too, so that I can verify the washer bay is wide enough.
11. As a customer using a low-left or low-right wasmachinekast, I want the module-width lines to sit on the actual modules of each section, so that the numbers are trustworthy.
12. As a customer using a low-only wasmachinekast, I want module widths and depth shown, so that I can plan the worktop area.
13. As a customer, I want the wasmachinekast depth shown, so that I can confirm it clears my plumbing.
14. As a customer, I want the total width and total height to keep working exactly as before, so that nothing I already relied on regresses.
15. As a customer, I want every measurement label to track the cabinet as I orbit the camera, so that the numbers stay readable from any angle.
16. As a customer, I want measurements that point away from the camera to hide, so that the overlay doesn't clutter the view.
17. As a developer, I want the spec-building geometry to be a pure function, so that I can unit-test rail and slope math without a WebGPU canvas.
18. As a developer, I want the projector/overlay render shell shared between both configurators, so that a fix to label tracking applies everywhere at once.
19. As a developer, I want the wasm spec builder to walk the same per-section X offsets as the scene, so that geometry can't drift again.
20. As a developer, I want rail positions derived from the existing anchor math, so that rail measurements and rail rendering can never disagree.

## Implementation Decisions

**Modules built/modified** (approved: pure builders + shared render shell):

- **Pure spec builders** (new, deep modules, no THREE/React imports):
  - `buildKledingkastSpecs(config)` → `MeasurementSpec[]`. Emits total width, total height, depth, per-module clear widths, rail (roede) measurements, and slope (schuinte) measurements.
  - `buildWasmSpecs(config)` → `MeasurementSpec[]`. Iterates the resolved sections in scene X-order (high-only / low-only / low-left / low-right), emitting per-section total width, per-module widths, height, and a single shared depth line.
  - Helper `resolveRodMeasurements(layout, roofY)` → rail top Y values plus an upper/lower-half flag. Rail top Y is derived purely from the element anchor, reusing the same rules as `resolveElementPositions`: `fromTop d` → `roofY - d`; `bboxTopAt d` → `d`; `midpoint refIndex` → `refTop / 2`. No GLB bbox load is required. Applies to layouts with rail elements (ids 3, 5, 6, 7). Upper/lower-half decided by comparing rail top against `roofY / 2`; upper → spec from `roofY` down to rail top, lower → spec from floor (0) up to rail top.
  - Helper `diagonalSegments(diagParams)` → endpoint coordinates for left / right / back slope edges, derived from `leftDiagStartHeight` / `leftDiagTopWidth` / `mainHeight` (and the back-diagonal equivalents). Produces the slope edge plus its start-height and horizontal-reach measurements.
  - Per-module `roofY` is computed with the existing `getDiagModuleWallHeight` / diagonal helpers so rail measurements stay correct under a slope.

- **Shared render shell** (extracted from the two duplicated implementations):
  - One `MeasurementProjector` (inside `<Canvas>`, projects spec endpoints to screen space each frame) and one `MeasurementsOverlay` (outside `<Canvas>`, RAF-driven direct DOM mutation for lines, ticks, labels). Parameterized by `specs` and the relevant `showMeasurements` store flag. Replaces the near-identical copies in both files.

- **Rewire**: `Measurements.tsx` and `WasmMeasurements.tsx` reduce to thin layers that read their store, call their builder, and mount the shared shell. The public layer exports (`MeasurementProjectorLayer`, `MeasurementsOverlayLayer`, and the Wasm equivalents) keep their current names and props so the canvases ([KledingkastCanvas.tsx](app/(configurator)/kledingkast/scene/KledingkastCanvas.tsx), [WasmachinekastCanvas.tsx](app/(configurator)/wasmachinekast/scene/WasmachinekastCanvas.tsx)) are untouched.

**Interfaces / contracts:**

- `MeasurementSpec` stays the carrier between builder and shell: an id, two endpoints, an offset direction + distance, and a centimetre label. Endpoints are plain numeric coordinates in the builder layer; the shell converts to `THREE.Vector3` for projection. This keeps the builder free of THREE so it is unit-testable.
- Depth is a spec whose two endpoints differ on the Z (depth) axis, drawn at a cabinet side, labelled with the store depth in cm.
- Wasm builder consumes the same resolved-section model the scene uses (high section from top-level fields, low section from `lowSection`, layout-driven X offsets), so a single source of truth governs both render and measurement.

**Decisions:**

- Vocabulary: customer-facing label concept is the **rail** (roede); internal slope terms remain `diagonalSide` etc. per CONTEXT.md (avoid "diagonal" in any customer-visible copy — measurement labels are numeric cm only, so no Dutch/English copy decision is forced here).
- No store/schema changes. No Sanity changes. Pure presentation rebuild driven off existing state.

## Testing Decisions

A good test here asserts **external behaviour** — the numbers and endpoints a builder produces for a given configuration — not the internal projection/DOM plumbing. Tests run as plain vitest unit tests with no canvas, following the prior art in [slotWidths.test.ts](app/(configurator)/_shared/store/__tests__/slotWidths.test.ts) and [computeModuleCapY.test.ts](app/(configurator)/kledingkast/scene/__tests__/computeModuleCapY.test.ts) (pure-function `describe`/`it` over geometry helpers).

Modules to test (approved):

- **`resolveRodMeasurements`** — for each rail-bearing layout (ids 3, 5, 6, 7): correct rail top Y from its anchor, correct upper/lower-half classification, and the resulting spec orientation (roof→rail vs floor→rail). Cover the double-rail midpoint case and a rail under a reduced `roofY` (slope) value.
- **`diagonalSegments`** — left, right, both, and back slope: correct start-height and top-width endpoints, and the empty result when no slope is configured.

Not unit-tested (per selection): the full `buildKledingkastSpecs` / `buildWasmSpecs` aggregate output and the render shell. These are exercised through the two tested helpers plus manual verification in the running configurator.

## Out of Scope

- The shared Projector/Overlay render mechanics (projection math, RAF DOM updates, tick rendering) are reorganised but not redesigned — same visual behaviour.
- No new measurement *types* beyond those listed (rail, depth, slope for kledingkast; per-section module width + depth for wasm). No drawer/shelf-spacing measurements.
- No styling overhaul of labels/lines/ticks beyond what's needed to place the new specs.
- Kledingkast does not gain section concepts; wasmachinekast does not gain slopes (per CONTEXT.md).
- No store, Sanity, or pricing changes.

## Further Notes

- Root cause of the wasm "missing module widths": the current builder centers a single full-width section at the origin, while the scene draws per-section corpuses at computed X offsets ([WasmachinekastScene.tsx:535-551](app/(configurator)/wasmachinekast/scene/WasmachinekastScene.tsx#L535-L551)). The rebuilt wasm builder must mirror that section resolution exactly.
- Rail-top Y being anchor-derivable (no runtime GLB bbox) is what makes `resolveRodMeasurements` a pure, testable function — keep it that way; don't reach into loaded GLB bounding boxes.
- The configurator layout keeps the Footer (see project memory) — unrelated to this work but noted so the overlay's absolute positioning is validated against the real page chrome.
