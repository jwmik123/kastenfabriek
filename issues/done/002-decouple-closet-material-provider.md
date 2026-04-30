# fix(wasmachinekast): decouple ClosetMaterialProvider from kledingkast store

## What to build

`ClosetMaterialProvider` currently reads `buitenkantMaterialId` and `binnenkantMaterialId` directly from the kledingkast store. Because the wasmachinekast scene wraps itself in this same provider, material selections in the wasmachinekast configurator have no effect — the 3D closet always renders in the default white finish.

Fix: change `ClosetMaterialProvider` to accept `buitenkantMaterialId` and `binnenkantMaterialId` as explicit props. The kledingkast scene passes values from its own store (no behaviour change). The wasmachinekast scene passes values from the wasmachinekast store. Per-module material overrides (`ModuleMaterialOverrideProvider`) are unaffected.

## Acceptance criteria

- [ ] Changing the exterior material in the wasmachinekast material step updates the 3D closet panels in real time
- [ ] Changing the interior material in the wasmachinekast material step updates the 3D interior panels in real time
- [ ] The kledingkast configurator material behaviour is unchanged (no regression)
- [ ] Per-module material overrides still take precedence over global material in both configurators
- [ ] The light-strip warmth node path (interior panels with strips enabled) still renders correctly in both configurators

## Blocked by

None — can start immediately.
