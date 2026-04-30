# feat(wasmachinekast): highlight 3D slot when hovering washer step UI buttons

## What to build

In the washer step (step 2), the user selects a "vak" (slot) from a grid of buttons. Hovering a button gives no visual feedback in the 3D scene, making it hard to understand which physical slot corresponds to which button.

Fix: wire the slot button hover events to the shared `hoveredSlot` store state, and make the 3D slot overlay (`WasmModuleSlotInteraction`) react to that state alongside its existing pointer-hover state.

- **WasherStep slot buttons**: `onMouseEnter` calls `setHoveredSlot(slotIndex)`, `onMouseLeave` calls `setHoveredSlot(null)`.
- **`WasmModuleSlotInteraction`**: reads `hoveredSlot` from the store and combines it with the component's local pointer-hover state (`localHovered || storeHoveredSlot === slotIndex`) when computing the TSL overlay uniforms (`fillAlphaU`, `borderAlphaU`).

The highlight uses the existing green border + semi-transparent fill style. Hover is one-way only (UI → scene); hovering in the 3D scene does not highlight the corresponding UI button.

## Acceptance criteria

- [ ] Hovering a slot button in the washer step causes the corresponding slot in the 3D scene to show the green border highlight
- [ ] Moving the cursor off the slot button removes the highlight from the 3D scene
- [ ] Hovering a slot button while another slot is selected does not affect the selected slot's visual state
- [ ] Direct pointer interaction with the 3D scene (hover over mesh) still works as before
- [ ] No highlight is shown in steps other than step 2 as a result of this change

## Blocked by

None — can start immediately.
