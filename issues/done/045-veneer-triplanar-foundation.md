# 045 — Triplanar foundation: vertical grain everywhere

## Parent

[prd-veneer-pbr-triplanar.md](./prd-veneer-pbr-triplanar.md)

## Type

AFK

## What to build

Replace the flat color-map path in `ClosetMaterial` with a triplanar projection in TSL, sampled in wardrobe-root local space, applied unconditionally to every mesh that uses `ClosetMaterial`. After this slice, the wood grain runs vertically on every front-facing vertical surface and front-to-back on every horizontal surface, at a consistent physical density across the whole wardrobe — regardless of GLB UVs.

End-to-end scope:

- Wrap the children of `ClosetMaterialProvider` in a new `<WardrobeRootGroup>` that captures its `matrixWorld` per frame and exposes `matrixWorldInverse` as a `mat4` uniform via context (`useWardrobeInverse()`).
- Build a deep, pure triplanar node builder that takes a loaded color texture, the wardrobe-inverse uniform, and a global default tile size (`tileU = 0.6 m`, `tileV = 1.8 m`), and returns `{ colorNode, normalNode, anisotropyTangentNode }`. Three projections: X-facing → `(p.z/tileU, p.y/tileV)`, Z-facing → `(p.x/tileU, p.y/tileV)`, Y-facing → `(p.x/tileU, p.z/tileV)`. Blend by `pow(abs(normalWorld), 4)` normalized.
- Add a luminance-bump TSL helper that derives a normal perturbation from luminance derivatives of the sampled color, scaled by a default `bumpScale` constant. Used as `normalNode` until real normal maps land in slice 3.
- Delete `applyBasePropsStandard`. Collapse the dual `MeshStandardMaterial` / `MeshStandardNodeMaterial` paths in both the JSX `ClosetMaterial` component and the `useClosetMaterialInstance` hook into a single `MeshPhysicalNodeMaterial` path. The `useNodeMaterial` flag goes away as a material-type switch; the warmth conditional remains, deciding only whether to attach the `emissiveNode`.
- Anisotropy tangent set per-projection so the streak runs along grain V on every face: world-Y for X/Z faces, world-Z for Y faces. Use a single global `anisotropy = 0.5` for now (per-veneer values arrive in slice 2).
- Extract the projection-selection math (dominant axis + emitted UV per axis) as a plain TypeScript function so it can be unit-tested without a TSL runtime.

Slice 2 will introduce per-veneer parameters; slice 3 will wire optional normal/roughness map slots. This slice intentionally uses one global value for every tunable knob.

## Acceptance criteria

- [ ] `<WardrobeRootGroup>` wraps `ClosetMaterialProvider` children; `useWardrobeInverse()` returns a `mat4` uniform that updates each frame from the group's `matrixWorldInverse`.
- [ ] Triplanar builder is a pure function returning `{ colorNode, normalNode, anisotropyTangentNode }`; takes texture, wardrobe-inverse uniform, `tileU`, `tileV` as inputs.
- [ ] Projection-selection math is exported as a plain TS function and covered by unit tests under `app/(configurator)/kledingkast/__tests__/` matching the style of `resolveElementPositions.test.ts`. Tests assert: axis-aligned X/Y/Z normals each select the correct projection; near-45° normals blend (no single dominant); the emitted UV equals `position / tile` per axis.
- [ ] Luminance-bump helper exists and feeds `normalNode` whenever no normal map is present.
- [ ] `applyBasePropsStandard` is removed. `ClosetMaterial` component and `useClosetMaterialInstance` hook both unconditionally produce a `MeshPhysicalNodeMaterial`.
- [ ] Strip-warmth still works on interior `binnenkant` panels with strips on — `emissiveNode` attaches additively over the triplanar `colorNode`/`normalNode`.
- [ ] Visual smoke check in dev: vertical grain on corpus walls (front-facing), diagonal back walls, internal shelf front edges, SplitModule's six sub-meshes, FlatSec filler panel, and OnderstelPlinth. Front-to-back grain on shelf tops and plinth top.
- [ ] Existing tests under `app/(configurator)/kledingkast/__tests__/` still pass.
- [ ] Chrome and glass materials are untouched. Door handles untouched. Light-strip emissive instances untouched.

## Blocked by

None — can start immediately.
