# Wasmachinekast: split Handgrepen into its own wizard step

## Parent

[prd-wasmachinekast-low-section.md](prd-wasmachinekast-low-section.md)

## What to build

Extract the door handle and handle material pickers out of `MaterialStep` into a new dedicated `HandgrepenStep`. Wizard grows by one step. Independent of the sections feature — can ship on its own.

New step order (after this slice; sections-only steps still added later):

1. Afmetingen
2. Modules
3. Wasmachine
4. Materiaal (handles removed)
5. Handgrepen (new)
6. Accessoires
7. (existing final step)

Step numbering constants and `nextStep` upper bound updated accordingly.

## Acceptance criteria

- [ ] New `HandgrepenStep` component contains the door handle picker and handle material picker, with the same behavior as today.
- [ ] `MaterialStep` no longer contains handle UI; its layout remains coherent (Buitenkant + Binnenkant only in this slice).
- [ ] `StepWizard` shows 7 numbered steps (or whatever the new total is including any existing final step) and routes step indices correctly.
- [ ] Wasmachinekast store's `nextStep` / `prevStep` / `setStep` clamp to the new step count.
- [ ] Handle and handle-material state still applies wardrobe-wide (no per-section variation introduced yet).
- [ ] Existing tests for handle/material validation continue to pass.
- [ ] Kledingkast configurator is untouched.

## Blocked by

None - can start immediately.
