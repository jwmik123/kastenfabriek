# PRD — Wood-Veneer PBR Material with Triplanar Vertical-Grain Mapping

## Problem Statement

The five wood-fineer materials in the kledingkast configurator (Thermo eik, Lincoln notelaar, Vicenza eik grijs, Vicenza eik licht, Fineline antraciet) currently render as a flat color JPG on a `MeshStandardMaterial` with a constant `roughness=0.7`. The result reads as "wallpaper on a board" — there is no clearcoat, no sheen, no anisotropy, no surface relief, and the texture density and grain direction are determined by whatever UVs the GLB exporter happened to produce.

The visible consequences:

1. **Grain direction is inconsistent.** On corpus front-facing walls, on diagonal back-module walls, on the front edges of internal shelves, on the SplitModule sub-meshes, on the FlatSec filler panel, and on the OnderstelPlinth, the grain ends up running in arbitrary directions because each mesh's UVs were authored independently. Real veneered furniture has grain running vertically on every vertical front-facing surface; the configurator does not.
2. **Texture density is inconsistent.** A 60 cm-wide panel and a 240 cm-tall corpus side display the same number of texture repeats, so the grain reads at very different physical scales depending on which mesh the user looks at.
3. **It does not look like wood.** Lacquered/oiled veneer has a soft sheen, a faint clearcoat highlight, and a directional anisotropic streak along the grain. None of that is present today, so even the best photograph reads as a printout rather than a physical board.

These three problems compound: even if we authored correct UVs in Blender for every existing GLB, new GLBs would re-introduce the inconsistency, and the underlying material would still look flat. We need a runtime system that makes "vertical grain at consistent world-space density on a physically plausible wood surface" the default, regardless of GLB UVs.

## Solution

Replace the flat `MeshStandardMaterial` color-map with a `MeshPhysicalNodeMaterial` driven by a **triplanar projection** in TSL, sampled in **wardrobe-root local space**, with per-veneer physical-material parameters.

- All meshes that currently use `ClosetMaterial` (corpus walls, doors, shelves, GLB sub-meshes routed via `useClosetMaterialInstance`, structural kink shelves, top cabinet, plinth, FlatSec filler) go through the new node-material path always — there is no longer a "standard" branch that triplanar bypasses.
- Triplanar projects the texture along three world-axis-aligned planes and blends by the surface normal. The projection orientation is chosen so that **vertical front-facing surfaces (X- or Z-facing) get grain along world-Y**, and **horizontal Y-facing surfaces get grain along world-Z** (front-to-back, the conventional orientation for a real wooden plank top).
- Sampling happens in a frame anchored to a new wardrobe-root `<group>` so that, if the wardrobe is ever translated or rotated as a whole, the veneer stays glued to the furniture rather than swimming through it.
- Each of the five veneers gets its own physical parameters — clearcoat, clearcoat roughness, sheen, anisotropy, anisotropy rotation, bump scale — plus its own `tileU` and `tileV` in meters so the grain reads at the right physical scale per material.
- Where the supplier provides real normal/roughness maps in the future, they slot into optional fields on the veneer record. Until then, a luminance-derived bump node fakes surface relief from the existing color JPG.
- The existing TSL strip-warmth shader continues to work — it attaches to `emissiveNode` and is fully orthogonal to the triplanar `colorNode` / `normalNode` wiring.

User-facing result: every veneer reads as a physical wood surface with continuous, vertically-grained planks across the entire wardrobe, at a consistent physical density, regardless of which GLB or which mesh the surface comes from.

## User Stories

1. As a customer browsing the configurator, I want the wood textures on my wardrobe to look like real wood with depth and sheen, so that I can trust what I will receive.
2. As a customer, I want the wood grain on every front-facing vertical surface to run vertically, so that the wardrobe looks intentionally crafted rather than randomly textured.
3. As a customer, I want the grain on a horizontal shelf top to run front-to-back, so that the shelf reads as a real wooden plank when I peek through an open door.
4. As a customer, I want adjacent panels (corpus side, door, plinth) to share a continuous grain pattern, so that the wardrobe looks like one assembled piece of furniture rather than a collage of unrelated boards.
5. As a customer, I want a 60 cm-wide door and a 240 cm-tall corpus side to show grain at the same physical density, so that scale reads correctly across the whole piece.
6. As a customer, I want the diagonal back-module walls to receive vertical grain at the same density as the rest of the corpus, so that the diagonal does not stand out as a different material.
7. As a customer, I want the SplitModule's six sub-meshes (rod, middle, shelves, fixed metal pieces) to display the wood texture with vertical grain on their vertical faces, so that the split fixture looks integrated with the rest of the closet.
8. As a customer, I want the FlatSec filler panel to share grain orientation and density with the surrounding corpus, so that it reads as part of the closet rather than a patch.
9. As a customer, I want the OnderstelPlinth to display the wood texture with grain orientation matching real plinth construction, so that the foot of the wardrobe looks finished.
10. As a customer enabling the light strips, I want the warm interior glow to continue working over the new wood material, so that the lighting feature is unaffected by the material upgrade.
11. As a customer choosing different veneers, I want each fineer to have its own surface character — Fineline antraciet should look different in sheen and grain density from Vicenza eik licht — so that my material choice has a meaningful visual consequence.
12. As a customer toggling between veneers in the picker, I want the change to be instant and the texture to keep its consistent vertical orientation, so that the selection feels tight.
13. As a customer viewing the wardrobe with chrome accessories or glass doors, I want those materials to remain unchanged, so that only the wood surfaces are affected by this work.
14. As a developer adding a new module GLB, I want the wood material to apply correctly without authoring any UVs in Blender, so that I do not have to re-export GLBs to fit the configurator's UV conventions.
15. As a developer integrating supplier-provided PBR maps later, I want to drop normal- and roughness-map paths into the veneer record without changing any rendering code, so that we can upgrade visual fidelity incrementally.
16. As a developer tuning a veneer, I want a single per-veneer record to control tile size, anisotropy, clearcoat, and sheen, so that I can iterate on look without touching shader code.
17. As a developer verifying triplanar logic, I want the projection-selection math to be unit-testable as a plain function, so that I can assert the correct UV is emitted for a given position and normal without running a TSL graph.
18. As a developer maintaining the warmth feature, I want the strip-warmth `emissiveNode` to remain a separate concern from the base color/normal wiring, so that future changes to either do not entangle the other.
19. As a developer, I want all veneer-related state to live behind a single `ClosetMaterialProvider` plus a wardrobe-root `<group>`, so that the rendering tree continues to have a clear single point of material configuration.
20. As a developer reviewing the change, I want the work split into reviewable slices that each ship a concrete improvement, so that I can land them independently and roll back if any one slice regresses.

## Implementation Decisions

### Material strategy

- The `applyBasePropsStandard` path in `ClosetMaterial` is **removed**. All closet-material meshes use a `MeshPhysicalNodeMaterial` always.
- The material is hybrid PBR: color comes from the existing JPG, surface relief comes from a luminance-derived bump node when no normal map is present, and physical-material parameters (clearcoat, clearcoat roughness, sheen, anisotropy, anisotropy rotation, bump scale) come from per-veneer fields.
- Optional `normalPath` and `roughnessPath` fields on each veneer are wired into the material now, even though all five veneers have them undefined today. When supplier maps arrive, dropping the paths in is the only change needed.

### Veneer registry

- A new module owns the canonical list of veneers. Each entry: `{ id, label, colorPath, normalPath?, roughnessPath?, tileU (meters), tileV (meters), anisotropy, anisotropyRotation, clearcoat, clearcoatRoughness, sheen, bumpScale }`.
- The `TEXTURE_PATHS` and `TEXTURE_IDS` constants currently in `ClosetMaterial` collapse into this registry.
- Default tile sizes seed at `0.6 m × 1.8 m` per veneer; per-veneer tuning happens by eye in the dev environment after the first slice is in.

### Triplanar projection

- Implemented in TSL as a deep, pure builder that accepts the loaded color texture, optional normal/roughness textures, the per-veneer parameter record, and a `mat4` uniform carrying the wardrobe-root inverse-world matrix; returns `{ colorNode, normalNode, roughnessNode, anisotropyTangentNode }` for the caller to attach to the material.
- Three projections sample in wardrobe-local space:
  - **X-facing**: `uv = (p.z / tileU, p.y / tileV)` → grain V along world-Y.
  - **Z-facing**: `uv = (p.x / tileU, p.y / tileV)` → grain V along world-Y.
  - **Y-facing**: `uv = (p.x / tileU, p.z / tileV)` → grain V along world-Z.
- Blend weights are `pow(abs(normalWorld), k)` normalized, with `k ≈ 4` to keep the seam between projections tight without becoming brittle on near-45° surfaces (the diagonal back walls).
- Anisotropy tangent is set per-projection so the streak runs along grain V on every face: world-Y for X/Z faces, world-Z for Y faces.

### Wardrobe-root frame

- A new `<WardrobeRootGroup>` component wraps the children of `ClosetMaterialProvider`. It captures its `matrixWorld` per frame and exposes `matrixWorldInverse` as a `mat4` uniform via context (a `useWardrobeInverse()` hook).
- The triplanar builder reads this uniform and multiplies `positionWorld` by it before the projection step. Today the matrix is identity, so behavior matches "world-space triplanar"; when the wardrobe ever sits under a transform, the grain stays glued.

### Luminance-bump helper

- A small TSL helper derives a normal perturbation from the luminance derivatives of the sampled color, scaled by per-veneer `bumpScale`. Used only when `normalPath` is undefined for the veneer.
- When `normalPath` is defined, the real normal map replaces the luminance bump; the triplanar builder handles both cases transparently.

### Warmth coexistence

- The strip-warmth feature continues to attach via `emissiveNode`. The triplanar builder owns `colorNode` and `normalNode`; warmth is purely additive emissive. No conflict, no shared state.
- The existing `useNodeMaterial` flag is gone — the material is always a node material — but the warmth conditional on `lightStripsEnabled && variant === 'binnenkant' && hasWarmthContext` remains, just deciding whether to attach the warmth `emissiveNode`.

### Out-of-scope materials

- Chrome (`chromeMaterial`) and glass (`glassMaterial`) are not touched. They keep their current `MeshPhysicalMaterial` definitions.
- The light-strip emissive instances are not affected.
- Door handles and any non-`ClosetMaterial` materials in the scene are untouched.

### Slicing

- **Slice 1** — wardrobe-root group + uniform plumbing + triplanar builder replacing the existing color-only paths. No physical-material parameter changes yet beyond what the existing material had. Visual change: grain becomes vertical and consistent across all surfaces; no clearcoat/sheen yet.
- **Slice 2** — veneer registry with per-veneer physical parameters (clearcoat, sheen, anisotropy, anisotropy rotation, bump scale, tileU, tileV) plus the luminance-bump helper. Visual change: each veneer gets its physical character; surface relief appears.
- **Slice 3** — optional `normalPath` / `roughnessPath` slots wired through the triplanar builder. No-op until supplier ships maps.

## Testing Decisions

A good test here verifies external behavior of a deep, pure interface — not the shape of a TSL node graph or the precise output of a fragment shader. Two of the new modules have such interfaces; the others are either mechanical wiring or shader math best verified visually.

### Modules under test

- **Veneer registry.** Every declared veneer id has all required fields populated; declared color/normal/roughness paths point at files that exist on disk; tile sizes are positive finite numbers; anisotropy is in `[0, 1]`. This is the single source of truth for the entire wood-material system, so a malformed entry should fail loudly at test time.
- **Triplanar projection-selection math.** The UV-selection logic — "given a position in wardrobe-local space and a world-space normal, which projection dominates and what `(u, v)` does it emit?" — is extracted as a plain TypeScript function so the test does not need a TSL runtime. Tests assert the dominant axis is picked correctly for representative normals (axis-aligned, near-45°, the diagonal back-wall normal) and that the emitted UV matches the expected `position / tile` per axis.

### Modules not under test

- **Luminance-bump helper.** TSL derivative math is best verified visually; a unit test would assert against an opaque node graph and break on every TSL refactor without catching real bugs.
- **WardrobeRoot context / `<WardrobeRootGroup>`.** Mechanical React wiring; integration territory.
- **ClosetMaterial refactor itself.** It becomes a thin shell wiring the veneer registry, the triplanar builder, the wardrobe-root uniform, and the warmth `emissiveNode`. Behavior is the composition of its dependencies; testing the shell would mostly assert that it calls its parts.

### Prior art

- The existing tests under `app/(configurator)/kledingkast/__tests__/` (e.g. `resolveElementPositions.test.ts`) are the model: pure-function tests over plain TS modules with no React or three.js runtime. The triplanar projection-selection test follows the same pattern.
- The veneer-registry shape test follows the style of the configurator's other "registry" assertions (layout list, material list) — fixture iteration with structural assertions.

## Out of Scope

- Authoring or sourcing real normal/roughness/anisotropy maps from the veneer supplier. The system has slots for them; obtaining the assets is a separate effort.
- Changes to the chrome and glass materials.
- Changes to the door-handle material or to the light-strip emissive instances.
- Re-authoring or re-exporting any GLB. The triplanar approach is explicitly designed so that GLB UVs become irrelevant for surfaces using `ClosetMaterial`.
- Changes to the light-strip warmth shader beyond ensuring it continues to coexist with the new node-material wiring.
- Any change to the veneer picker UI, the material color list, or the `MATERIAL_COLORS` fallback for non-veneer materials.
- A "wood-grain rotation per panel" customization. The system enforces vertical grain on vertical front-facing surfaces; per-panel rotation is not exposed.
- Texture-tile **unit conversion**. All tile values are authored directly in meters, matching the configurator's existing world-unit convention.

## Further Notes

- The single knob that will need dev-environment tuning is per-veneer `tileU` / `tileV`. Defaults of `0.6 m × 1.8 m` are starting points; expect to adjust each veneer once the first slice lands and the material is visible in context.
- Triplanar is a per-fragment cost increase: three texture taps where there used to be one, plus a normal-derived blend. On the closet-material set this is well within budget on any reasonable WebGPU target, and is unconditionally applied (no toggle), but worth noting if the GPU profile ever changes.
- The blend exponent `k` (initially `4`) controls how sharp the seam is between projections on near-45° surfaces. The diagonal back walls are the worst case and the natural surface to tune against.
- This work intentionally does not introduce a "wood material engine" abstraction. The triplanar builder, the veneer registry, the luminance-bump helper, and the wardrobe-root group are four small modules with narrow contracts; they compose to make `ClosetMaterial` thinner, not fatter.
