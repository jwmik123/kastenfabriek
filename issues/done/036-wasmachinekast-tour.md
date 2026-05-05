# 036 — Wasmachinekast tour config + tracker integration

## Parent

[032-configurator-guided-tour.md](./032-configurator-guided-tour.md)

## What to build

Replicate the four-step tour on the wasmachinekast configurator using the shared infrastructure built in #033–#035. This means a `tourSteps` config entry for wasmachinekast, mounting `TourProvider` into the wasmachinekast configurator subtree, and integrating `MeshScreenTracker` into `WasmachinekastCanvas` to track a wasmachinekast module for step 3.

No new infrastructure — only configuration and per-configurator wiring. Validates that the shared tour system genuinely supports multiple configurator types without duplication.

## Acceptance criteria

- [ ] `tourSteps` config exists for wasmachinekast alongside the kledingkast config
- [ ] `TourProvider` wraps the wasmachinekast configurator subtree with autostart + storage gating
- [ ] `MeshScreenTracker` integrated into `WasmachinekastCanvas` to track the chosen module mesh for step 3
- [ ] Help button in the wasmachinekast `CanvasToolbar` (already shared from #033) replays the tour
- [ ] Full four-step tour plays end-to-end on wasmachinekast
- [ ] Storage flag is shared across configurators: dismissing the tour on kledingkast also prevents autostart on wasmachinekast (and vice versa)
- [ ] No new tour-infrastructure modules introduced — only config + wiring

## Blocked by

- Blocked by #035
