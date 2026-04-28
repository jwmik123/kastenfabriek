## Parent PRD

`issues/prd-wizard-redesign.md`

## What to build

Replace the 4-column layout grid inside the selected-slot config card in `ModulesStep` with the shared carousel component. Each carousel item shows the layout SVG icon. The selected layout is highlighted. Selecting a layout calls `setModuleLayout` as before.

## Acceptance criteria

- [ ] The layout grid (`grid-cols-4`) is replaced by the carousel for the selected slot.
- [ ] All available layouts (filtered by effective slot height) are shown in the carousel.
- [ ] 3.5 layout items are visible at once; scrolling reveals more.
- [ ] Tapping a layout item selects it and highlights it.
- [ ] The previously active layout scrolls into view when the slot config card opens.
- [ ] Diagonal/height-filtered layouts still work correctly — only layouts that fit the slot are rendered.
- [ ] No regression in the double-module or covered-slot flows.

## Blocked by

- Blocked by `issues/009-shared-carousel-component.md`

## User stories addressed

- User story 1 (layouts in a carousel with more visual space)
- User story 2 (3.5 layouts visible)
- User story 3 (scroll through layouts)
- User story 4 (active layout highlighted)
