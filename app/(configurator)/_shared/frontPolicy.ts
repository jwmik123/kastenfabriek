/**
 * Front policy — the single decision point for what renders in front of a
 * module: a door, visible drawer fronts (kitchen-style, low section), a door
 * above a washer, and which handle (if any) each front carries.
 *
 * Pure: no three.js, no store access. Both product scenes derive their
 * rendering from the returned plan instead of scattering conditionals.
 *
 * Rules (client decisions, PRD "finishing touches"):
 * - Kledingkast is unchanged: doors follow the per-module toggle and carry the
 *   selected door handle.
 * - Wasmachinekast doors (high section AND lage-kast deurtjes) carry the
 *   selected door handle. Only the door above the washer (and the top
 *   cabinet, which never has handles) is push-to-open.
 * - Low-section-specific layouts (lage kast 20/21/22, `lowFronts` on their
 *   config) show their GLB fronts directly — no door in front. Those fronts
 *   carry the separate DRAWER handle choice (horizontal), which defaults to
 *   'none' (push-to-open). Shared layouts (e.g. Drawers + shelves) keep a
 *   normal deurtje in the low section.
 * - Washer modules: high section gets a push-to-open door above the washer
 *   only; low section stays open.
 */

export type FrontPolicyContext = {
  product: 'kledingkast' | 'wasmachinekast'
  /** Section hosting the module. Kledingkast modules are always 'high'. */
  sectionKind: 'high' | 'low'
  /** The per-module door toggle (ModuleSlot.hasDoor). */
  hasDoorSetting: boolean
  /** True when the module hosts a washer/dryer layout. */
  isWasher: boolean
  /** True when the layout renders kitchen-style fronts (config `lowFronts`). */
  layoutHasLowFronts: boolean
  /** Global doors-extend-to-floor setting. */
  doorsExtendToFloor: boolean
  /** The customer's DOOR handle choice ('none' = greeploos). */
  selectedHandleId: string
  /**
   * The customer's DRAWER handle choice for lage-kast fronts ('none' =
   * push-to-open, the default). Ignored for the kledingkast.
   */
  selectedDrawerHandleId?: string
}

export type FrontPlan = {
  /** Render a full-height front door. */
  showDoor: boolean
  /** Render a door covering only the open zone above the module content. */
  showWasherDoorAbove: boolean
  /** Render the layout's drawer fronts flush with the door plane (no door). */
  showDrawerFronts: boolean
  /** Handle on door(s); 'none' = push-to-open, no handle mesh. */
  doorHandleId: string
  /** Handle on drawer fronts (horizontal); null when no drawer fronts show. */
  drawerHandleId: string | null
  /** Bottom edge of fronts: resting on the plinth top, or 2 cm above floor. */
  bottom: 'plinth' | 'floor'
}

export function resolveFrontPlan(ctx: FrontPolicyContext): FrontPlan {
  const bottom = ctx.doorsExtendToFloor ? 'floor' : 'plinth'

  if (ctx.product === 'kledingkast') {
    return {
      showDoor: ctx.hasDoorSetting,
      showWasherDoorAbove: false,
      showDrawerFronts: false,
      doorHandleId: ctx.selectedHandleId,
      drawerHandleId: null,
      bottom,
    }
  }

  // Washer modules: only the door above the washer, always push-to-open.
  if (ctx.isWasher) {
    return {
      showDoor: false,
      showWasherDoorAbove: ctx.sectionKind === 'high',
      showDrawerFronts: false,
      doorHandleId: 'none',
      drawerHandleId: null,
      bottom,
    }
  }

  // Kitchen-style fronts: no door; separate drawer-handle choice.
  if (ctx.sectionKind === 'low' && ctx.layoutHasLowFronts) {
    return {
      showDoor: false,
      showWasherDoorAbove: false,
      showDrawerFronts: true,
      doorHandleId: 'none',
      drawerHandleId: ctx.selectedDrawerHandleId ?? 'none',
      bottom,
    }
  }

  // Regular doors (high section and lage-kast deurtjes): selected handle.
  return {
    showDoor: ctx.hasDoorSetting,
    showWasherDoorAbove: false,
    showDrawerFronts: false,
    doorHandleId: ctx.selectedHandleId,
    drawerHandleId: null,
    bottom,
  }
}
