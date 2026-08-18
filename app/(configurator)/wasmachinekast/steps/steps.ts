/**
 * Step numbers for the wasmachinekast wizard. Several components key off the
 * current step (the module popover, the per-module material panel, the scene's
 * click handling), so the numbers live here instead of scattered literals.
 */
export const STEP = {
  layout: 1,
  dimensions: 2,
  modules: 3,
  material: 4,
  handles: 5,
  accessories: 6,
} as const

export const STEP_COUNT = 6
