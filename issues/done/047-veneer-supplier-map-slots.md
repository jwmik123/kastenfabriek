# 047 — Optional supplier normal/roughness map slots

## Parent

[prd-veneer-pbr-triplanar.md](./prd-veneer-pbr-triplanar.md)

## Type

AFK

## What to build

Wire the optional `normalPath` and `roughnessPath` fields on the veneer registry through to the triplanar builder and the `MeshPhysicalNodeMaterial`, so that any future supplier-provided PBR map drops in by editing one veneer record. No-op for the user today — all five veneers leave both fields undefined — but the pipeline is ready.

End-to-end scope:

- Loader path: when a veneer's `normalPath` is defined, load it alongside the color texture and pass it to the triplanar builder; when undefined, fall back to the luminance-bump helper from slice 1.
- Same for `roughnessPath` → `roughnessNode` on the material; when undefined, the material uses a constant `roughness` (kept on the per-veneer record or seeded as a default).
- Triplanar builder gains optional `normalTexture` and `roughnessTexture` parameters. When present, it samples them with the same triplanar projection and blend weights as the color, and emits real `normalNode` / `roughnessNode`. When absent, it emits the luminance-bump normal and a constant roughness as before.
- Verification harness: drop a placeholder grayscale-bump or constant-blue normal map into `public/materials/` for one veneer in dev, point that veneer's `normalPath` at it, confirm the material switches from luminance-derived bump to the real normal map without code changes elsewhere. Do not commit the placeholder.

This slice does not source or commit any real supplier maps; that is out of scope for this PRD entirely.

## Acceptance criteria

- [ ] Veneer registry's `normalPath` and `roughnessPath` fields are honored by the loader.
- [ ] Triplanar builder accepts optional `normalTexture` and `roughnessTexture` and samples them with the same three projections + blend as the color texture.
- [ ] When `normalPath` is defined, `normalNode` comes from the real normal map; when undefined, `normalNode` falls back to the luminance-bump helper.
- [ ] When `roughnessPath` is defined, `roughnessNode` comes from the real roughness map; when undefined, the material uses a constant per-veneer roughness.
- [ ] All five existing veneers continue to render identically to the end of slice 2 (both fields stay undefined; no visual change).
- [ ] Manual verification in dev: temporarily wiring a placeholder normal map into one veneer flips that veneer to real-normal-map sampling end-to-end. Placeholder is reverted before merge.
- [ ] Existing tests still pass.

## Blocked by

- Blocked by #045
- Recommended after #046 to avoid registry-shape conflicts; not strictly required.
