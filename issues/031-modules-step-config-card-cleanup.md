---
title: "ModulesStep cleanup: remove config card from both panels"
labels: [configurator, cleanup]
---

## What to build

Now that bay editing lives in the canvas `ModulePopover`, remove the "config card" section from both `ModulesStep` components — the block that renders deur/dubbele toggles and the layout carousel when `selectedSlot !== null`. Retain: slot grid (clicking sets `selectedSlot`, which triggers the canvas popover), "Deuren tot de vloer" toggle, module count stepper. The diagonal constraint calculations in kledingkast `ModulesStep` are retained as they are consumed by `ModulePopover`.

## Acceptance criteria

- [ ] Kledingkast `ModulesStep`: config card block (deur toggle, dubbele toggle, layout carousel) removed
- [ ] Wasmachinekast `ModulesStep`: config card block removed
- [ ] Slot grid remains and still sets `selectedSlot` on click (popover appears in canvas)
- [ ] "Deuren tot de vloer" toggle remains in both panels
- [ ] Module count stepper remains in both panels
- [ ] Kledingkast diagonal constraint calculations (`isUnderDiagonal`, `canBeDouble`, `selectedSlotEffectiveHeightM`) remain in scope and are not deleted
- [ ] No orphaned imports after removal
- [ ] No TypeScript errors

## Blocked by

- Blocked by #029 (kledingkast popover must handle the editing before removing the panel controls)
- Blocked by #030 (wasmachinekast popover must handle the editing before removing the panel controls)
