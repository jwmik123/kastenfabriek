---
title: "ModulePopover — kledingkast canvas bay popover + tests"
labels: [configurator, canvas, kledingkast]
---

## What to build

Add a `ModulePopover` HTML overlay inside `KledingkastCanvas`'s `relative` wrapper, rendered alongside the existing toolbar and price panel overlays. The popover appears only when the active step is the modules step AND `selectedSlot !== null`. Position it with `absolute` + horizontal offset based on `selectedSlot / moduleCount`. Content: bay number badge + "Vak N instellen" header + close button; layout picker (thumbnail grid, active layout highlighted); "Deur" toggle; "Dubbele module" toggle (hidden when slot cannot be doubled); "covered slot" message when the slot is the second half of a double. Filter available layouts by `selectedSlotEffectiveHeightM` (reuse/reference the diagonal constraint logic already in `ModulesStep`). Close on outside click or Escape key.

## Acceptance criteria

- [ ] Popover renders only when modules step is active and a slot is selected
- [ ] Popover is an HTML overlay (not a Three.js object), positioned approximately above the selected bay
- [ ] Bay number badge and "Vak N instellen" header display correctly
- [ ] Layout picker shows available layouts as thumbnails; selected layout is highlighted; clicking a layout updates the store
- [ ] "Deur" toggle updates door state for the slot
- [ ] "Dubbele module" toggle updates double-module state; hidden when `canBeDouble` is false for the slot
- [ ] Covered slot (second half of double): shows message only, no controls rendered
- [ ] Layouts incompatible with `selectedSlotEffectiveHeightM` (diagonal constraint) do not appear in the picker
- [ ] Clicking outside the popover closes it (deselects slot)
- [ ] Pressing Escape closes the popover
- [ ] Tests (mocked `useClosetStore`): normal slot → layout picker, deur toggle, dubbele toggle all render
- [ ] Tests: covered slot → only covered message renders
- [ ] Tests: diagonal-constrained slot → incompatible layouts absent from picker

## Blocked by

- Blocked by #025 (canvas container structure is established by the full-screen layout)
