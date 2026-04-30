---
title: "ModulePopover — wasmachinekast canvas bay popover"
labels: [configurator, canvas, wasmachinekast]
---

## What to build

Add a `ModulePopover` to `WasmachinekastCanvas` following the same pattern established in #029. The wasmachinekast version must guard against opening the popover for washer-locked slots — the click handler checks `isWasherSlot` (or equivalent store flag) and returns early. No diagonal constraint filtering needed. Otherwise the popover offers the same controls: layout picker, deur toggle, dubbele module toggle (where applicable), covered slot message.

## Acceptance criteria

- [ ] Popover renders only when modules step is active and a non-washer slot is selected
- [ ] Clicking a washer-locked slot does not open the popover (guard at click handler level)
- [ ] Layout picker, deur toggle, and dubbele module toggle work for eligible slots
- [ ] Covered slot message renders for the second half of a double module
- [ ] Close on outside click or Escape key
- [ ] No TypeScript errors

## Blocked by

- Blocked by #029 (establishes the ModulePopover pattern to follow)
