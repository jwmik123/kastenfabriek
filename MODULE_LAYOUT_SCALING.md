# Module Layout Scaling — How It Works

Each closet module can be filled with a **special element**: a `.glb` file that represents
a functional unit (drawer stack, hanging rod, shelving, etc.). The element must always
fill the exact **width** and **depth** of its module slot — these change as the user
resizes the closet.

`SpecialElement.tsx` handles all the per-mesh scaling and positioning at runtime.
No changes to geometry data are written back; everything happens on a cloned scene.

---

## Coordinate system

All nodes in module GLBs are exported with a **−90 ° Y rotation**.
After that rotation the axes map like this:

```
GLB local X  →  world Z  (= closet depth, front-to-back)
GLB local Y  →  world Y  (= height, unchanged)
GLB local Z  →  world X  (= closet width, left-to-right)
```

Therefore the world-space bounding box gives:

```
sceneSize.x = WIDTH   (world X)
sceneSize.z = DEPTH   (world Z)
```

---

## Mesh naming conventions

The Blender artist names each mesh using the tokens below.
**Tokens can be combined** (e.g. `DrawerBottom_ds_ws`, `DrawerRight_ds`).

### Geometry scaling

| Token | Effect |
|-------|--------|
| `_ds` | Geometry stretches in **depth** — `geometry.scale(depthScale, 1, 1)` — local X grows → world Z fills the module depth |
| `_ws` | Geometry stretches in **width** — `geometry.scale(1, 1, widthScale)` — local Z grows → world X fills the module width |
| both  | Geometry stretches in **both** — `geometry.scale(depthScale, 1, widthScale)` |
| neither | Fixed size, no geometry change |

### Depth positioning (world Z)

| Token | Behaviour |
|-------|-----------|
| `Back` | **Back-anchored** — stays at its original distance from the back wall. Distance from back is preserved when depth changes. |
| *(no `_ds`, no `Back`)* | **Front-anchored** — `mesh.position.z += depthGrowth`. Distance from the front face is preserved. |
| `_ds` | No position shift — the geometry scale already places it correctly. |

### Width positioning (world X)

| Token | Behaviour |
|-------|-----------|
| `Right` (no `_ws`) | **Right-anchored** — `mesh.position.x += widthGrowth`. Distance from the right edge is preserved. |
| `Left` / no token | **Left-anchored** — stays at original world-X position (no shift). |
| `_ws` | No position shift — the geometry scale already fills the width from the left. |

---

## Quick reference — common mesh types

| Use case | Name example | Tokens | What happens |
|----------|-------------|--------|--------------|
| Full-depth side panel (left) | `DrawerLeft_ds` | `_ds`, `Left` | Stretches in depth, stays at left edge |
| Full-depth side panel (right) | `DrawerRight_ds` | `_ds`, `Right` | Stretches in depth, shifts to right edge |
| Full-width back panel | `DrawerBack_ws` | `_ws`, `Back` | Stretches in width, stays at back wall |
| Full-width + full-depth (bottom/shelf) | `DrawerBottom_ds_ws` | `_ds`, `_ws` | Stretches in both |
| Front-face decoration / drawer face | `DrawerFront_ws` | `_ws` | Stretches in width, shifts to front face |
| Hanging rod | `Rod_ws` | `_ws` | Stretches in width, shifts to front face |
| Fixed-size left panel | `DrawerFixedLeft` | `Left` | No scale, stays at left |
| Fixed-size right panel | `DrawerFixedRight` | `Right` | No scale, shifts to right edge |

---

## Origin convention

Every mesh **origin must be at its bottom-back-left corner**.
Geometry extends in the **positive** local X (depth) and negative local Z (width) directions.
This ensures geometry scaling always grows toward the front and toward the right.

---

## Alignment

After all per-mesh transforms are applied, a final bounding box is computed and the
whole element is placed so that:

- **Left edge** lands at `MODULE_WALL` (18 mm) inside the module's left wall.
- **Back edge** aligns with `Z = 0` in module-group space (the closet back wall).
- **Vertical position** is controlled by `positionY` from `computeModulePositions()`
  in `moduleLayouts.ts` (bottom / top / fixed anchor).

The `targetWidth` passed in is `slotW − 2 × MODULE_WALL` (inner width between the two
module side panels), so the element never overlaps the structural walls.

---

## Adding a new module layout

1. Model the element in Blender. Origin of every mesh = bottom-back-left.
2. Apply the naming tokens above to each mesh.
3. Export as `.glb` into `public/objects/`.
4. Add an entry to `MODULE_LAYOUTS` in `moduleLayouts.ts`:
   - Set `glbPath` to the file path.
   - Set `height` to match the GLB's designed height (drives fill-zone placement).
   - Choose an `anchor` (`bottom` / `top` / `fixed`).
5. Done — `SpecialElement` handles scaling automatically at runtime.
