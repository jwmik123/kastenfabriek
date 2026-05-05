# 046 — Per-veneer physical character

## Parent

[prd-veneer-pbr-triplanar.md](./prd-veneer-pbr-triplanar.md)

## Type

HITL — per-veneer tile sizes and physical-material parameters need to be eye-tuned in the running configurator. The slice ships with seeded defaults; final values are picked by hand against the live render.

## What to build

Replace the global tile size and global physical-material parameters from slice 1 with a per-veneer registry that drives every fineer's surface character independently. After this slice, Fineline antraciet looks visibly different from Vicenza eik licht in tile density, sheen, clearcoat, and anisotropic streak — not just color.

End-to-end scope:

- Introduce a single veneer registry as the canonical source of truth, replacing `TEXTURE_PATHS` and `TEXTURE_IDS` in `ClosetMaterial`. Each entry: `{ id, label, colorPath, normalPath?, roughnessPath?, tileU, tileV, anisotropy, anisotropyRotation, clearcoat, clearcoatRoughness, sheen, bumpScale }`. The optional `normalPath` / `roughnessPath` fields exist in the schema now but are unused until slice 3.
- Thread per-veneer values through the triplanar builder and the `MeshPhysicalNodeMaterial` instance: `tileU`/`tileV` go into projection scaling; `anisotropy`, `anisotropyRotation`, `clearcoat`, `clearcoatRoughness`, `sheen` go onto the material; `bumpScale` goes into the luminance-bump helper.
- Seed initial values for all five veneers: `tileU = 0.6 m`, `tileV = 1.8 m`, `anisotropy = 0.5`, `anisotropyRotation = 0`, `clearcoat = 0.3`, `clearcoatRoughness = 0.5`, `sheen = 0.1`, `bumpScale = 0.02`. Then tune each veneer by eye in dev — the HITL part of this slice.
- Add a registry test under `app/(configurator)/kledingkast/__tests__/` asserting: every declared id has all required fields populated; declared `colorPath` files exist on disk; `tileU`/`tileV` are positive finite numbers; `anisotropy`, `clearcoat`, `clearcoatRoughness`, `sheen` are in `[0, 1]`.

The veneer-picker UI is not touched — it consumes the same id list it does today, now sourced from the registry instead of `TEXTURE_IDS`.

## Acceptance criteria

- [ ] Veneer registry module exists as the single source of truth; `TEXTURE_PATHS`/`TEXTURE_IDS` are gone.
- [ ] All five veneers (`h1199-thermo-eik`, `h1714-lincoln-notelaar`, `h3158-vicenza-eik-grijs`, `h3165-vicenza-eik-licht`, `h3190-fineline-antraciet`) have full physical-parameter records.
- [ ] Triplanar builder reads `tileU`/`tileV` per veneer; material reads `anisotropy`, `anisotropyRotation`, `clearcoat`, `clearcoatRoughness`, `sheen` per veneer; luminance-bump reads `bumpScale` per veneer.
- [ ] Registry test passes: shape, on-disk path existence, value-range assertions.
- [ ] Each of the five veneers has been eye-tuned in dev — final values committed reflect the tuned look, not the seeded defaults. (Capture before/after screenshots in the PR description.)
- [ ] Visual: switching veneers in the picker visibly changes tile density, sheen, and grain streak in addition to color.
- [ ] Strip-warmth interior glow still works unchanged.
- [ ] Existing tests still pass; the new registry test is added.

## Blocked by

- Blocked by #045
