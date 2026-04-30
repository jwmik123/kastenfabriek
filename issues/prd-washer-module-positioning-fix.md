# PRD: Washer Module Positioning Fix

## Problem

Two distinct positioning bugs in the washer module layout vs regular module layouts.

---

## Bug 1 — Washer floats ~11.8cm above floor

### Root cause

`Module.tsx:386` positions every module group at `Y = MODULE_FLOOR_Y = ONDERSTEL_HEIGHT + ONDERSTEL_GAP = 0.108 + 0.010 = 0.118m`.

Regular modules compensate: `anchor: { type: 'bottom' }` resolves to `specialElementY = -0.118`, so drawers/rods land at worldY = 0 (floor).

Washer configs use `anchor: { type: 'fixed', fromBottom: 0 }`, so `specialElementY = 0`. The washer GLB sits at worldY = `MODULE_FLOOR_Y + 0 = 0.118m` — exactly the plinth height above the floor. Visually: washer appears to float on top of the onderstel.

### Fix

In `wasmachinekast/moduleLayoutConfigs.ts`, import `MODULE_FLOOR_Y` from `kledingkast/scene/closetConstants` and set:

```ts
anchor: { type: 'fixed', fromBottom: -MODULE_FLOOR_Y }
```

This gives `specialElementY = -0.118`, so washer worldY = `0.118 + (-0.118) = 0`. Washer sits on floor.

**Fill zone correctness:** `fillAbove.start = fromBottom + seHeight = -0.118 + 0.90 = 0.782`. In module group space (Y = 0.118m), shelves start at worldY = `0.118 + 0.782 = 0.90m` — correct, exactly above washer top. `fillBelow` end is negative (no shelves below), but both washer configs use `type: 'open'` anyway so FillZone returns null regardless.

Applies to: `WASHER_SINGLE_CONFIG` and `WASHER_DOUBLE_CONFIG`.

---

## Bug 2 — Washer drifts toward center as closet depth grows

### Root cause

Washer configs have `centered: true`. In `SpecialElement.tsx`:

```ts
const offsetZ = isCentered
  ? targetDepth / 2 - (box.min.z + box.max.z) / 2
  : -box.min.z
```

`targetDepth = depthOverride = outerDepthCm / 100 - WASHER_REAR_CLEARANCE` grows with closet depth. The washer centers in the growing Z space → drifts away from the front face as depth increases.

Regular modules are not centered. They use `offsetZ = -box.min.z`, then non-`_ds`, non-`Back` meshes receive `mesh.position.z += depthGrowth`. With no `_ds` meshes, the entire washer GLB shifts forward as a rigid body:

- Front face of washer in group space: `box_depth + depthGrowth = moduleDepth`
- World Z: `groupZ + moduleDepth = 0.075 + (depth - 0.10) = depth - 0.025` (closet front)

Washer stays front-flush at every depth, identical behaviour to regular modules.

### Fix

Remove `centered: true` from `WASHER_SINGLE_CONFIG` and `WASHER_DOUBLE_CONFIG`.

No changes needed in `SpecialElement.tsx` — standard logic already handles it correctly.

---

## Architecture decision: keep separate (Path A)

Washer modules share the same rendering stack as regular modules (`Module`, `SpecialElement`, `FillZone`, GLB naming conventions with `_ds`/`_ws` suffixes). After these fixes, implementation is identical at the shared component level.

Washer-specific concerns stay isolated above that level:

| Concern | Where it lives |
|---|---|
| Fixed 68cm slot width | `wasmachinekast/store.ts` |
| `double: true` flag + X mirroring | `WasmachinekastScene.tsx` |
| Door suppression (`hasDoor: false`) | `WasmachinekastScene.tsx` |
| 10cm rear clearance (`depthOverride`) | `WasmachinekastScene.tsx` |
| Washer-specific config registry | `wasmachinekast/moduleLayoutConfigs.ts` |

No unification of stores or scenes needed.

---

## Files changed

| File | Change |
|---|---|
| `wasmachinekast/moduleLayoutConfigs.ts` | Import `MODULE_FLOOR_Y`; set `fromBottom: -MODULE_FLOOR_Y`; remove `centered: true` — for both configs |

No changes to `Module.tsx`, `SpecialElement.tsx`, `WasmachinekastScene.tsx`, or any GLB assets (GLB mesh naming to be verified separately if stretching behaviour is needed).

---

## Out of scope

- GLB mesh naming (`_ds`/`_ws`) — to be verified against actual washer GLB after visual fix is in place
- Double washer X mirroring logic — unchanged, working correctly
- `depthOverride` and `groupZ` calculation — correct as-is
