## Parent PRD

`issues/prd-wizard-redesign.md`

## What to build

Build a reusable horizontal-scroll carousel component that shows 3.5 items per view using CSS scroll snap. This component will be used by both the module layout selector and the handle selector.

- Each item occupies `calc(100% / 3.5)` of the container width.
- `scroll-snap-type: x mandatory` on the container; `scroll-snap-align: start` on each item.
- The component accepts: an array of items, a render prop for each item, and an `activeId` prop.
- The active item receives a highlighted visual treatment (caller controls the content; the carousel controls the scroll container and snap behavior).
- No external carousel library — CSS scroll snap only.

## Acceptance criteria

- [ ] Carousel renders all passed items in a single horizontal scrollable row.
- [ ] Exactly 3.5 items are visible without scrolling on a standard sidebar width.
- [ ] The half-visible 4th item is not cut off abruptly — it signals there is more content.
- [ ] Scrolling snaps cleanly to item boundaries.
- [ ] Component accepts arbitrary item content via render prop or children pattern.
- [ ] No horizontal overflow bleeds outside the wizard panel.

## Blocked by

None — can start immediately.

## User stories addressed

- User story 2 (3.5 layouts visible at once)
- User story 3 (swipe/scroll through layouts)
- User story 4 (active item highlighted)
- User story 6 (3.5 handle options visible at once)
