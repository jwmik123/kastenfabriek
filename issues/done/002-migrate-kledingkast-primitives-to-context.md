# 002 — Migrate kledingkast primitives to context

## Parent PRD

`issues/prd-wasmachinekast-configurator.md`

## What to build

Move the shared 3D primitives out of the kledingkast folder into `_shared/three/` and replace all direct `useClosetStore` calls inside them with `useConfiguratorStore` from the context introduced in `001-base-configurator-interface-and-context.md`.

Files to move:
- `kledingkast/scene/Module.tsx` → `_shared/three/Module.tsx`
- `kledingkast/scene/ClosetCorpus.tsx` → `_shared/three/ClosetCorpus.tsx`
- `kledingkast/scene/FillZone.tsx` → `_shared/three/FillZone.tsx`
- `kledingkast/scene/SpecialElement.tsx` → `_shared/three/SpecialElement.tsx`

Inside each moved file, replace `useClosetStore(selector)` with `useConfiguratorStore(selector)`. The `diagParams` prop on `Module` continues to be passed from the scene compositor — no change to that interface.

Wrap the kledingkast scene/page in a `ConfiguratorStoreContext.Provider` that injects the kledingkast Zustand store. Update all import paths in `kledingkast/scene/ClosetScene.tsx` and anywhere else that references the moved files.

The kledingkast configurator must be visually and behaviourally identical after this change. All existing kledingkast tests must pass.

## Acceptance criteria

- [ ] `Module`, `ClosetCorpus`, `FillZone`, `SpecialElement` live in `_shared/three/`
- [ ] No `useClosetStore` calls remain inside the moved files
- [ ] Kledingkast wraps its store in `ConfiguratorStoreContext.Provider`
- [ ] Kledingkast configurator renders and behaves identically to before (manual smoke test)
- [ ] All existing kledingkast tests pass
- [ ] No duplicate copies of the moved files remain in `kledingkast/scene/`

## Blocked by

- `issues/001-base-configurator-interface-and-context.md`

## User stories addressed

- User story 22 (enables all future configurators to reuse primitives)
