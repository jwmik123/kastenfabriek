# 051 — `computeHandlePages` pure util + unit tests

## Parent

PRD: [issues/prd-doorhandles-grid-and-materials.md](./prd-doorhandles-grid-and-materials.md)

## What to build

A pure pagination utility for the door-handles grid step. Given a flat list of grid items (handles plus the synthesized push-to-open item), a fixed page size, and the currently selected item id, it returns the items partitioned into pages and the index of the page containing the selected item.

This slice is foundation only — no UI consumer in this issue. The util ships with full unit-test coverage so the pagination contract is locked before the grid step is built on top of it.

## Acceptance criteria

- [ ] `computeHandlePages` exists as a pure function exported from a shared utils location consumable by the lifted shared step (e.g. `_shared/utils/`)
- [ ] Signature accepts: an items array (each item with at least an `id`), a `perPage` number, and a `selectedId` (string)
- [ ] Returns `{ pages: Item[][], initialPageIndex: number }`
- [ ] `pages` is the items chunked into arrays of length `perPage`; the last page may be shorter
- [ ] `initialPageIndex` is the index of the page containing the item whose `id === selectedId`
- [ ] When `selectedId` does not match any item, `initialPageIndex` is `0`
- [ ] When the items array is empty, `pages` is `[]` and `initialPageIndex` is `0`
- [ ] Unit tests cover boundary item counts (0, 1, 6, 7, 13, 14) at `perPage = 6`, including: selected on first full page, middle page, last full page, partial last page, and selected id missing from list
- [ ] Tests follow the style of existing pure-function tests (e.g. `computePopoverPlacement.test.ts`)
- [ ] No changes to the existing `Carousel`, step files, stores, or schema in this issue

## Blocked by

None - can start immediately.
