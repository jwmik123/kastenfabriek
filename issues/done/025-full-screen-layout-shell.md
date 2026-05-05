---
title: "Full-screen layout shell (both configurators)"
labels: [configurator, layout]
---

## What to build

Update `KledingkastConfigurator` and `WasmachinekastConfigurator` to use a full-screen shell. The top-level wrapper becomes `flex flex-col h-[100dvh]`. `ConfiguratorTopBar` is the first child (64px). Below it: a `flex flex-1 min-h-0` row with a canvas column (`flex-1 min-w-0`) and a panel column (`w-full lg:w-[420px] shrink-0`). Remove `pt-24` from the panel. Mobile `MobileSheet` is unchanged.

## Acceptance criteria

- [ ] Both configurators render `ConfiguratorTopBar` at the top with their respective step arrays
- [ ] Kledingkast passes a 5-step array; wasmachinekast passes a 6-step array (including "Wasmachine" at position 2)
- [ ] Canvas column takes remaining horizontal space (`flex-1 min-w-0`)
- [ ] Panel column is fluid on `< lg`, fixed `420px` on `lg+`
- [ ] No `pt-24` or nav-offset padding on the panel
- [ ] The layout fills the full viewport height (`100dvh`) with no overflow
- [ ] `MobileSheet` in both configurators is visually and functionally unchanged
- [ ] Both configurators build without TypeScript errors

## Blocked by

- Blocked by #023 (route group must exist first)
- Blocked by #024 (ConfiguratorTopBar must exist)
