## What to build

Washer modules must sit flush with the outer cabinet door front face, with exactly 10 cm of clearance behind them. They must not render a duplicate cabinet door (the GLB contains integrated doors). This slice adds a depth override mechanism to the Module component and applies washer-specific overrides in the WasmachinekastScene.

## Acceptance criteria

- [ ] Module component accepts an optional `depthOverride` prop; when present it overrides the default depth calculation
- [ ] Washer module depth is `cabinetDepth - 0.10 m` (10 cm rear clearance constant, named — not inline)
- [ ] Washer module front face is flush with the cabinet door front face in the 3D scene
- [ ] No cabinet door is rendered on washer slots (layout IDs 11 and 12) regardless of the slot's `hasDoor` store value
- [ ] Overrides are applied by checking `layoutId` in the WasmachinekastScene render loop — no store shape changes
- [ ] Both single (ID 11) and double side-by-side (ID 12) washer slots apply the same overrides correctly

## Blocked by

- Blocked by #021
