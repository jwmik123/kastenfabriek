# 053 — Lift door-handles step + paginated 3×2 grid replaces Carousel

## Parent

PRD: [issues/prd-doorhandles-grid-and-materials.md](./prd-doorhandles-grid-and-materials.md)

## What to build

Replace the horizontal `Carousel` slider in the door-handles step with a paginated 3×2 grid (six cells per page, navigated by previous/next arrow buttons and a dot indicator). At the same time, collapse the two near-identical step files (`(configurator)/kledingkast/steps/DoorHandlesStep.tsx` and `(configurator)/wasmachinekast/steps/DoorHandlesStep.tsx`) into a single shared component under `_shared/steps/`, parameterized by the configurator's store hook so each configurator imports the same implementation.

Material picker behaviour is unchanged in this slice — the existing three text-button finish row (Chrome / Zwart / Goud) stays globally applied. Per-handle gating, swatch UI, and new finishes ship in later slices.

`Carousel` and its test are deleted once the lifted step is wired up; they have no other consumers.

## Acceptance criteria

- [ ] A single shared step component (e.g. `_shared/steps/DoorHandlesStep.tsx`) is consumed by both `KledingkastConfigurator` and `WasmachinekastConfigurator`; the per-configurator step files are removed (or become 1-line re-exports if framework routing requires their existence)
- [ ] Grid renders exactly six cells per page (3 columns × 2 rows) with fixed cell sizing; no responsive breakpoint changes
- [ ] Push-to-open is the final cell of the grid (handles sorted by id, push-to-open appended)
- [ ] Previous/next arrow buttons advance the page; the previous arrow is disabled on page 1; the next arrow is disabled on the last page; navigation never wraps
- [ ] A dot indicator below the grid shows the current page among the total
- [ ] On step mount and whenever `doorHandleId` changes externally, the grid jumps to the page containing the selected item; uses `computeHandlePages` from issue 051
- [ ] Partial last page renders left-aligned within the 3-column track; trailing cells stay empty (no placeholders, no centering, no stretching)
- [ ] Page transitions are instant (no animation)
- [ ] No keyboard arrow-key bindings on the grid
- [ ] `kledingkast/components/Carousel.tsx` and `kledingkast/__tests__/Carousel.test.tsx` are deleted; no remaining imports of `Carousel`
- [ ] Material picker continues to render today's three text buttons applied globally; no per-handle filtering yet
- [ ] Verified manually in both configurators: arrows + dots + reopen-to-selected-page work end-to-end

## Blocked by

- Blocked by #051
