---
title: "ConfiguratorTopBar shared component + tests"
labels: [configurator, ui]
---

## What to build

Build a new shared `ConfiguratorTopBar` component in `app/(configurator)/_shared/components/ConfiguratorTopBar.tsx`. It accepts a step array, current step number, and a step-change callback, and renders: brand logo + product name (left), step breadcrumbs with connector lines (centre), and heart/cart/user icon buttons (right). Step bubble states: todo (hollow, muted), current (filled dark), done (filled green with checkmark). Clicking a done bubble calls `onStep`; clicking current or todo does nothing. Height: 64px fixed with a bottom border.

## Acceptance criteria

- [ ] Component accepts `steps: { label: string; number: number }[]`, `currentStep: number`, `onStep: (n: number) => void`
- [ ] Done steps (number < currentStep) show a checkmark and call `onStep(n)` on click
- [ ] Current step bubble is visually distinct (filled dark); click does not call `onStep`
- [ ] Todo steps (number > currentStep) are hollow/muted; click does not call `onStep`
- [ ] Connector lines render between bubbles
- [ ] Component is 64px tall with a `border-bottom`
- [ ] Tests: given `currentStep = 3` and 5 steps, steps 1–2 show checkmark, step 3 is current, steps 4–5 are todo
- [ ] Tests: clicking a done step calls `onStep` with correct number; clicking current/todo does not call `onStep`
- [ ] Tests use `renderToStaticMarkup` pattern matching existing `kledingkast/__tests__/` tests

## Blocked by

None — can start immediately.
