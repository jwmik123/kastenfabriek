---
title: "Step header (STEP_META) in both StepWizards"
labels: [configurator, ui]
---

## What to build

Add a `STEP_META` constant to each configurator's `StepWizard` that maps step number → `{ eyebrow: string; title: string; subtitle: string }`. Render a step header above the scrollable step content area (outside the scroll container). The eyebrow uses brand green with uppercase tracking. The title uses the serif typeface (Cormorant Garamond) at a larger size. The subtitle is small and muted.

## Acceptance criteria

- [ ] `STEP_META` defined in kledingkast `StepWizard` for all 5 steps
- [ ] `STEP_META` defined in wasmachinekast `StepWizard` for all 6 steps
- [ ] Header renders above the scroll container — does not scroll with step content
- [ ] Eyebrow label uses brand green color and uppercase tracking
- [ ] Title renders in the serif typeface at a visually larger size than body text
- [ ] Subtitle renders in a muted, small style
- [ ] Active step's header updates when navigating between steps
- [ ] No layout shift or overflow issues with the panel at 420px width

## Blocked by

- Blocked by #025 (full-screen layout must exist so the panel is correctly sized)
