# PRD — Door Handles step: paginated grid + per-handle materials + multi-mesh handles

## Problem Statement

The "Handgrepen" step in both configurators (kledingkast and wasmachinekast) currently presents handles in a horizontal carousel slider. As the catalog grows, the slider gets long, slow to scan, and hides options behind horizontal scrolling. Customers cannot quickly compare options or jump back to a previously seen handle.

The same step also offers three finish options (Chrome, Zwart, Goud) applied globally. Every handle accepts every finish — but in reality the catalog is moving toward more nuanced offerings: more metal finishes (rose-gold, silver, old-silver, gray-blue, gray, white) and a new family of leather-bodied handles where only the metal knob is selectable while the leather body colour is fixed by product. The current data model can express none of this — the schema has no way to constrain finishes per handle, and the renderer only paints a single material across a single mesh.

## Solution

Replace the slider with a paginated 3×2 grid (6 cells per page) navigated by previous/next arrows and a dot indicator. The grid jumps automatically to the page containing the customer's currently selected handle, keeps "Push-to-open" as the final cell, and disables arrows at the ends instead of wrapping.

Replace the global finish picker with a per-handle finish picker. The Sanity `handle` document gains an `allowedMaterials` array (drawn from a fixed list of nine metal finishes) which gates which finishes appear in the UI for each handle. Finishes are rendered as colour swatches rather than text buttons, scaling fluidly to however many finishes a given handle allows.

Add support for multi-material handles. The `handle` document gains an optional `bodyColor` field referring to one of four named leather colours. When set, the handle's GLB is treated as multi-mesh: child meshes whose names contain `knob` receive the customer-selected metal; all other children receive the leather material. Single-mesh handles (no `bodyColor`) keep today's behaviour.

Lift the duplicated step into a shared component used by both configurators, delete the now-unused `Carousel`, and enforce a store invariant that the selected finish is always valid for the selected handle.

## User Stories

1. As a customer, I want to see all handle options laid out in a clean 3×2 grid, so that I can scan and compare them at a glance instead of scrolling sideways.
2. As a customer, I want to step through pages of handles using next/previous arrows, so that I can browse the full catalog without horizontal scrolling.
3. As a customer, I want a dot indicator showing my position across pages, so that I always know how many pages of handles exist and which one I am on.
4. As a customer, when I revisit the handle step after picking a handle, I want to land directly on the page containing my selection, so that I do not have to hunt for it.
5. As a customer, I want the previous arrow disabled on the first page and the next arrow disabled on the last page, so that the navigation never feels disorienting.
6. As a customer, I want "Push-to-open" to appear as the last cell of the grid, so that it is consistently positioned and discoverable as a no-handle alternative.
7. As a customer, when the last page is partially filled, I want the remaining cells to be left-aligned with empty space on the right, so that handle thumbnails stay the same size on every page.
8. As a customer, I want to see only the finishes that are actually available for the handle I have selected, so that I am not offered a finish that does not exist as a real product.
9. As a customer, I want to pick a metal finish from a row of colour swatches, so that I can see what each finish looks like at a glance instead of reading text labels.
10. As a customer, when I hover or focus a swatch, I want the finish name announced, so that I can still identify finishes if the colours look similar.
11. As a customer, when I switch from one handle to another, I want my finish choice to carry over if the new handle allows it, so that I do not have to re-pick a finish I have already chosen.
12. As a customer, when I switch to a handle that does not allow my current finish, I want the configurator to silently fall back to the first allowed finish, so that the preview never shows an invalid combination.
13. As a customer, when I select a leather-bodied handle, I want only the knob to change as I switch finishes, so that the body color stays consistent with the product I selected.
14. As a customer, when I select Push-to-open, I want the finish picker to disappear, so that the UI does not pretend there is a finish to choose.
15. As a customer, when I share or restore a configurator URL, I want the saved finish to remain valid relative to the saved handle, so that I never see a corrected-after-the-fact finish surprise me on reopen.
16. As a content editor, I want to mark which metal finishes a handle supports in Sanity, so that I can constrain the customer's choices without touching code.
17. As a content editor, I want a checkbox-style grid of finish names in the Sanity Studio, so that picking allowed finishes is fast and unambiguous.
18. As a content editor, I want leaving `allowedMaterials` empty to mean "all finishes allowed", so that handles I have not curated yet still work for customers.
19. As a content editor, I want to assign one of the four named leather colours (skincolor pink, beige, light gray, black) to a handle's body, so that I can model leather variants without code changes.
20. As a content editor, I want leather body to be a discrete enum rather than a free hex value, so that I cannot accidentally enter an off-palette colour.
21. As a developer, I want the metal finishes to be a single named registry in code (id, label, swatch colour, PBR config), so that adding a new metal is a one-place change.
22. As a developer, I want the leather colours to be a single named registry in code (id, label, hex), so that the four colours are defined once and reused by both the Sanity options list and the renderer.
23. As a developer, I want the door-handles step extracted to a shared component used by both configurators, so that future changes do not have to be applied twice.
24. As a developer, I want `Carousel` and its test removed once the grid replaces it, so that there is no dead code to maintain.
25. As a developer, I want a pure utility that computes pagination (`pages`, `initialPageIndex`) from items + perPage + selectedId, so that the step component stays a thin shell and pagination logic is unit-testable.
26. As a developer, I want a pure utility that resolves a valid finish given a current finish and an allowed list, so that the store invariant logic is unit-testable in isolation.
27. As a developer, I want the store to enforce `(handleId, doorHandleMaterial)` consistency on `setDoorHandleId`, `setDoorHandleMaterial`, and `setPricingData`, so that no other code path needs to remember to validate.
28. As a developer, I want both stores (kledingkast and wasmachinekast) to behave identically for handle-material validation, so that the two configurators can never diverge on this rule.
29. As a developer, I want multi-mesh detection to be driven by a GLB mesh-naming convention (`knob` substring), so that authoring a new multi-material handle requires no per-handle code wiring.
30. As a developer, I want handles without a `bodyColor` to render exactly as they do today, so that this change is backward-compatible for the existing single-mesh catalog.
31. As a developer, I want the same price across all finishes for a given handle, so that pricing remains as it is today and no engine changes are required.

## Implementation Decisions

**Lift to shared**
- Both configurator step files (`(configurator)/kledingkast/steps/DoorHandlesStep.tsx` and `(configurator)/wasmachinekast/steps/DoorHandlesStep.tsx`) collapse into one shared component under `_shared/steps/`, parameterized by the configurator's store hook.
- The `Carousel` component (and its test) is removed; only the two step files reference it today.

**Grid layout**
- Fixed 3×2 grid (six cells per page), no responsive breakpoint changes.
- Push-to-open is rendered as the final item in the grid (after handles sorted by id), not as a separate widget.
- Navigation uses left/right arrow buttons and a dot indicator showing the current page among the total.
- Arrows disable at the first and last page; navigation does not wrap.
- On step mount and whenever the selected handle changes externally, the grid jumps to the page containing the selected item.
- Partial last page: items left-aligned within the 3-column track; empty cells stay empty (no placeholders, no centering, no stretching).
- Page transitions are instant (no animation).
- No keyboard arrow-key bindings — clicking the on-screen arrows is the only navigation gesture.

**Per-handle material model**
- The store keeps a single `doorHandleMaterial` field (not a per-handle map). Selecting a handle that does not allow the current finish triggers a fallback to the first allowed finish.
- A pure resolver utility (`validateHandleMaterial(currentMaterial, allowedMaterials)`) returns a valid finish id; called by `setDoorHandleId`, `setDoorHandleMaterial`, and `setPricingData` so the store invariant `(handleId, doorHandleMaterial)` always holds when pricing data is loaded.
- Empty/missing `allowedMaterials` is treated as "all metals allowed".
- When a handle allows exactly one finish, the swatch row still renders, with the single swatch shown selected; this signals the constraint is intentional rather than a UI bug.
- When the handle is Push-to-open, the entire finish section is hidden (current behaviour).

**Material registries (code)**
- A new `_shared/constants/handleMaterials.ts` exports two named registries:
  - `METALS` — nine entries: `chrome`, `black`, `gold`, `rose-gold`, `silver`, `old-silver`, `gray-blue`, `gray`, `white`. Each entry carries the id, Dutch label, swatch hex (used for the UI swatch tint), and the PBR config used to build a `MeshPhysicalMaterial`.
  - `LEATHERS` — four entries: `leather-pink`, `leather-beige`, `leather-light-gray`, `leather-black`. Each entry carries id, label, and hex (used for both the swatch and a `MeshStandardMaterial` with low metalness, mid-high roughness).
- Type unions `HandleMaterial` and `LeatherColor` are exported from this module; replace the inline `'chrome'|'black'|'gold'` union currently used in stores and step files.

**Sanity schema (`handle` document)**
- New field `allowedMaterials`: array of strings, with `options.list` enumerating the nine metal ids and `layout: 'grid'`. Validation: `Rule.unique()`. Not required (empty = all allowed).
- New field `bodyColor`: single string with `options.list` enumerating the four leather ids. Optional. Presence indicates a multi-mesh handle.
- The GROQ projection in `lib/configurator/queries.ts` adds both fields to the `handles` selection.
- `HandleType` in `types/configurator-pricing.ts` gains `allowedMaterials?: HandleMaterial[]` and `bodyColor?: LeatherColor`.

**Multi-mesh rendering (`Handles.jsx`)**
- The handle factory inspects the resolved GLB node:
  - If the node has child meshes whose names contain `knob`, those meshes receive the variable metal material; all other children of the same node receive the leather material defined by `bodyColor`.
  - Otherwise (single mesh, no children, or `bodyColor` absent), the entire geometry receives the variable metal material — today's behaviour.
- The metal material registry is built once and memoised; the leather material is built per-render keyed on `bodyColor` (cheap — solid colour, no textures).
- Pricing remains identical across finishes; nothing changes in the pricing engine.

**Material selector UI**
- The text-button row is replaced with a swatch row: small circles tinted with the material's swatch hex, wrapped using `flex-wrap`, selected state indicated by an outline ring, and `aria-label` providing the finish name. Hover/focus surfaces the name visibly (e.g. tooltip or under-grid label).
- Per-handle, only swatches present in `allowedMaterials` are rendered (or all nine if the field is empty).

**Store invariant scope**
- Apply the validation in `setDoorHandleId`, `setDoorHandleMaterial`, and `setPricingData` (the snapshot/hydration path effectively flows through `setPricingData` and the existing snapshot loader). Both stores receive the same logic; both configurators import the same resolver.

## Testing Decisions

A good test exercises external behaviour, not implementation details. For pure utilities, test the function's input/output contract; for the store, test the public actions and the resulting state, not which internal helpers ran. Avoid asserting on DOM structure for the step component — its behaviour is a thin composition over tested utilities.

**Unit-tested modules**
- `computeHandlePages(items, perPage, selectedId)` — assert page partitioning at boundary sizes (0, 1, 6, 7, 13, 14 items), assert `initialPageIndex` for selected items at start, middle, last full page, and partial last page, and assert behaviour when `selectedId` is missing from items.
- `validateHandleMaterial(currentMaterial, allowedMaterials)` — assert pass-through when current is in allowed, fallback to first allowed when current is not, and behaviour when allowed is empty/undefined (all metals allowed → current passes through, default fallback otherwise).
- Store invariant tests for both `kledingkast/__tests__/store.test.ts` and `wasmachinekast/__tests__/store.test.ts`:
  - Selecting a handle that disallows the current material rewrites material to the first allowed.
  - Setting a material disallowed by the current handle rewrites to the first allowed.
  - Loading `pricingData` after a hydrated snapshot with an invalid combination corrects the material.
  - Push-to-open does not interfere with material validation (no allowed list to check).

**Skipped**
- React Testing Library tests on the step component itself — the component is a thin shell; behaviour is covered by the pagination util and the store invariant.
- Sanity schema tests — no schema-test framework exists in the repo today; introducing one is out of scope for this PRD.

**Prior art**
- `kledingkast/__tests__/store.test.ts` already includes `doorHandleMaterial` defaulting and snapshot restoration tests; new invariant tests follow the same shape (build a snapshot, drive an action, assert public state).
- `wasmachinekast/__tests__/store.test.ts` mirrors the kledingkast pattern.
- `app/(configurator)/kledingkast/scene/__tests__/computePopoverPlacement.test.ts` is the local prior art for pure-util tests (recent slice 1 of the popover refactor).

## Out of Scope

- Pricing differentiation per finish — same price across all finishes for now.
- Per-handle pricing of the leather body — leather is a presentation property of the handle doc, not a separate priced component.
- Validation/correction of `doorHandleId` itself when restoring snapshots — only `doorHandleMaterial` is validated against `allowedMaterials`. A missing or removed handle id behaves as it does today.
- Authoring tooling for GLB mesh-naming conventions — this PRD assumes that when multi-mesh handles ship, the GLB authors follow the `knob` substring convention. No automation enforces this.
- Keyboard arrow-key navigation on the grid.
- Animated page transitions, swipe gestures, or a mobile-specific grid layout.
- Editor-defined hex colours for leather — the four leather options are a fixed code+schema enum.
- Sanity migration script — existing handle docs ship with `allowedMaterials` empty (all allowed) and no `bodyColor`, which already matches today's runtime behaviour.

## Further Notes

- Once shipped, adding a new metal finish is a two-place change (code registry + Sanity `options.list`); adding a new leather colour is the same. Adding a new multi-material handle is content-only (upload a GLB whose body/knob meshes follow the naming convention, set `bodyColor` and `allowedMaterials` in Studio).
- The `LEATHERS` registry intentionally namespaces leather ids with a `leather-` prefix while metals stay unprefixed. The two registries live in separate Sanity fields, so the only clash (`black` metal vs `leather-black`) is unambiguous in practice.
- Push-to-open continues to be synthesized in the step component from the existing `accessories` entry; it is not a `handle` document and gains no Sanity fields.
- PBR tuning of the six new metal materials (rose-gold, silver, old-silver, gray-blue, gray, white) is an implementation-time concern. Initial values can copy the existing chrome/black/gold templates and be iterated visually during review.
