# PRD: Finishing Touches — 36mm zijpanelen, keukenstijl lage-kast fronten, push-to-open, mobile footer

## Problem Statement

The configurator is nearly production-ready, but five finishing issues remain from client review:

1. **36mm zijpanelen** exist as an option on the kledingkast but carry a placeholder price, and the wasmachinekast has no side-panel thickness option at all. The client wants 36mm offered as an aesthetic upgrade ("robuustere uitstraling") at a €175 meerprijs for the extra material and edge banding. Constructively 36mm adds nothing over 18mm — it must be presented as a look, not a structural upgrade.
2. **Lage kast interiors hide behind doors.** Module layouts (drawers, vakken) of the low section currently render behind a full door, but the low section is a visible front — like a kitchen base cabinet, the drawers themselves should be the front, with no door in front of them.
3. **Fronts don't reach the floor consistently.** Doors and drawer fronts should be able to extend down to 2 cm above the floor — including the drawer under the washer in the high-section washer layouts. Drawers get a handle option, but oriented horizontally, centered on the front, with the same edge offset the door handle has from the side.
4. **Handles appear where they shouldn't (wasmachinekast).** The door above the washer and all high-section doors currently render the selected handle. All high doors of the wasmachinekast must be push-to-open — no handle. Handle choice remains relevant only for the low-section drawer fronts. The kledingkast keeps its existing handle selection unchanged.
5. **Mobile wizard leaks scroll.** On mobile the configurator container is sized to the small viewport (svh) inside a body sized to the large viewport (vh), producing white space below the Vorige/Volgende buttons and letting the whole page scroll past them. The buttons must always sit at the bottom of the screen on mobile; only the step content may scroll.

## Solution

Five targeted changes, unified where they overlap by one new deep module — the **front policy**:

1. **36mm zijpanelen on both products.** The wasmachinekast gains the same 18/36mm side-panel choice the kledingkast already has (applied to both section corpuses; shared thickness for the whole kast). Price becomes €175 flat per kast for 36mm, on both products, editable in Sanity via the existing `side-panels-36mm` accessory. UI copy presents it as an aesthetic upgrade.
2. **Kitchen-style low section.** Low-section modules with drawer layouts render visible drawer fronts flush with the door plane — no door in front. Low-section modules without drawers (planken/vakken) keep a kitchen-cabinet style deurtje. The washer module in the low section stays open as today.
3. **Fronts to 2 cm above floor.** The existing doors-extend-to-floor behavior extends to drawer fronts, including the baked-in drawer under the washer in high-section washer layouts. Washer GLBs adopt an `_extend` mesh naming convention: meshes whose name ends in `_extend` are stretched by the scene so their bottom edge lands 2 cm above the floor.
4. **Push-to-open high doors (wasmachinekast).** All high-section doors and the above-washer door are always greeploos/push-to-open: no handle mesh, and the handle picker in the wasmachinekast flow applies only to low-section drawer fronts. Drawer handles render horizontally, centered on the front, with the same 5.5 cm edge offset as the door handle.
5. **Mobile footer pinned.** The configurator route caps the page at the small/dynamic viewport height with overflow hidden, so the wizard footer with Vorige/Volgende is always at the screen bottom and only the step content scrolls.

## User Stories

1. As a customer, I want to choose 36mm zijpanelen on my kledingkast, so that my kast has a more robust appearance.
2. As a customer, I want to choose 36mm zijpanelen on my wasmachinekast, so that both products offer the same robust look.
3. As a customer, I want to see a clear €175 meerprijs when I select 36mm zijpanelen, so that I understand the cost before ordering.
4. As a customer, I want the 36mm option described as an aesthetic upgrade, so that I don't wrongly assume it is structurally stronger.
5. As a shop owner, I want the 36mm meerprijs editable in Sanity, so that I can adjust it without a code change.
6. As a customer, I want the 36mm choice reflected in the 3D scene on both products, so that what I see matches what I get.
7. As a customer configuring a wasmachinekast with both sections, I want one side-panel thickness for the whole kast, so that the sections look consistent.
8. As a customer, I want low-section drawer modules to show their drawer fronts directly (no door in front), so that the kast looks like a kitchen base cabinet.
9. As a customer, I want low-section drawer fronts flush with the plane of the doors, so that the front reads as one surface.
10. As a customer, I want low-section modules without drawers to keep a kitchen-style deurtje, so that closed storage stays available.
11. As a customer, I want the low-section washer bay to stay open, so that the washer remains accessible and visible.
12. As a customer, I want doors and drawer fronts to extend down to 2 cm above the floor, so that the plinth is hidden behind a continuous front.
13. As a customer, I want the drawer under the washer in a high-section washer layout to also extend to 2 cm above the floor, so that the washer column matches the neighboring fronts.
14. As a customer, I want a handle option on drawer fronts, so that I can open drawers without push-to-open.
15. As a customer, I want drawer handles placed horizontally and centered on the front, so that they look intentional and symmetric.
16. As a customer, I want the drawer handle's edge offset to match the door handle's side offset, so that all handles align visually.
17. As a customer, I want no handle on the door above the washer, so that the front stays clean.
18. As a customer, I want all high wasmachinekast doors to be push-to-open, so that the tall fronts are uninterrupted.
19. As a customer configuring a wasmachinekast, I want the handle step to apply only to low-section drawer fronts, so that I'm not choosing handles for doors that won't have them.
20. As a customer configuring a kledingkast, I want my existing handle choice to keep working exactly as before, so that nothing regresses.
21. As a customer, I want push-to-open pricing applied automatically to high wasmachinekast doors, so that the quote is correct without extra steps.
22. As a mobile customer, I want the Vorige/Volgende buttons fixed at the bottom of my screen, so that I can always navigate between steps.
23. As a mobile customer, I want only the step content to scroll (not the whole page), so that the header, canvas, and footer stay in place.
24. As a mobile customer, I want no white space below the navigation buttons, so that the configurator fills my screen exactly.
25. As a developer, I want a single pure front-policy function deciding door/drawer-front/handle/bottom-edge per module, so that these rules are testable in isolation and consistent across both products.
26. As a developer, I want an `_extend` mesh naming convention in washer GLBs, so that fronts baked into GLBs can be stretched to the floor without new models.

## Implementation Decisions

- **Front policy (new deep module).** A pure function that, given a module context (product, section type, layout kind, washer flags, extend-to-floor setting, selected handle), returns the front plan: whether a door renders, whether drawer fronts render, handle presence/orientation/placement, and the bottom edge (default plinth-top vs 2 cm above floor). Both product scenes consume this instead of scattering conditionals. This is the module under test.
- **36mm zijpanelen.** The wasmachinekast store gains the same side-panel thickness state the kledingkast has; the value feeds the shared corpus/module geometry parameters for both section corpuses (replacing the hardcoded 18mm). Pricing reuses the existing `side-panels-36mm` accessory on both products; its seeded price changes to €175. No new Sanity schema field. The kledingkast's existing constraint (36mm unavailable with schuinte) is kledingkast-only; wasmachinekast has no slopes so no constraint applies.
- **Low-section fronts.** Drawer layouts in the low section render their fronts flush with the door plane using the same depth-offset mechanism the high-section washer layouts already use; the door is suppressed for those modules by the front policy. Non-drawer low layouts keep a door. The per-module door toggle remains for door-bearing modules only.
- **`_extend` mesh convention.** Washer GLB meshes whose front should reach the floor are renamed with an `_extend` suffix (asset change, coordinated with the 3D artist/client). The scene detects the suffix and stretches those meshes so their bottom edge sits 2 cm above the scene floor when the extend-to-floor setting is active. Convention applies to the under-washer drawer in the high-section washer layouts first; future GLBs can adopt it freely.
- **Drawer handle placement.** Horizontal orientation, centered horizontally on the drawer front, vertically centered, with the same 5.5 cm edge-offset constant used for door handles. Reuses the existing handle GLB set rotated 90°; the handle-fit math gains a drawer variant.
- **Push-to-open (wasmachinekast only).** The front policy forces `handle = none` for all high-section doors and the above-washer door regardless of the selected handle. The wasmachinekast handle step is scoped to low-section drawer fronts and hidden when the configuration has none. Pricing: high doors always priced as push-to-open; selected handle priced only against drawer fronts. Kledingkast handle flow unchanged.
- **Mobile viewport.** The configurator route constrains the page to the small/dynamic viewport height with overflow hidden so the body can never exceed the configurator container; the wizard footer stays pinned by the existing flex layout and only the step ScrollArea scrolls. Applies to both products.

## Testing Decisions

- Good tests assert **external behavior**: given a module context, the front plan output — not which components render or how meshes are named internally.
- **Module under test: front policy** (per user decision). Cases: low drawer module → drawer fronts, no door, horizontal handle; low plank/vak module → door; low washer module → open; high door (wasm) → door, no handle; above-washer door → no handle; extend-to-floor on/off → bottom edge 2 cm vs plinth-top; kledingkast door → handle honored (regression guard).
- Prior art: existing Vitest pure-module tests in the wasmachinekast section suite (layout transitions, module layout configs) — same style, no rendering, plain input → output assertions.
- No tests for handle-mesh placement, 36mm pricing, or the mobile CSS fix (visual/manual QA instead).

## Out of Scope

- Per-door or per-module handle selection (handle choice stays global per kast).
- Structural changes for 36mm (client confirmed no constructive value; geometry thickness + price only).
- Slope support with 36mm on the kledingkast (existing lock stays).
- Push-to-open for the kledingkast (explicitly keeps its handle flow).
- New drawer GLB models beyond renaming/stretching existing meshes via `_extend`.
- Werkblad thickness pricing (18/36mm werkblad remains price-neutral).
- Any change to the desktop wizard layout.

## Further Notes

- The €175 covers extra material and kantenband; marketing copy should mention the robust look and may note that construction is equivalent to 18mm.
- The `_extend` GLB rename requires an asset-pipeline pass over the washer GLBs — flag which meshes were renamed in the implementation PR so the client can mirror the convention in future exports.
- Mobile fix should be verified on iOS Safari with the browser toolbar both visible and collapsed (the svh/vh mismatch only shows with the toolbar visible).
