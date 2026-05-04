# 037 — Tour theming polish + design review

## Parent

[032-configurator-guided-tour.md](./032-configurator-guided-tour.md)

## What to build

Polish the tour's visual presentation to match the site's design language (`bg-background/90 backdrop-blur-sm`, brand typography, button styles consistent with the rest of the configurator). This is a HITL slice: review the styled tour against the design and decide whether reactour's theming hooks are sufficient, or whether to fall back to a custom overlay implementation as flagged in the PRD.

Also pass over mobile-specific details: copy still reads correctly on small screens, step cards remain readable and well-positioned at narrow breakpoints, spotlight cutouts on the toolbar/Volgende button resolve correctly for the mobile DOM tree.

## Acceptance criteria

- [ ] Tour step card visually matches site design language (background, blur, typography, button styles)
- [ ] "Volgende" / "Sla over" / "Aan de slag" buttons styled consistently with existing configurator buttons
- [ ] Mobile breakpoint reviewed: card readable at narrow widths, no overflow, spotlight selectors resolve to mobile DOM elements correctly
- [ ] Design sign-off recorded (in PR description or comment)
- [ ] If reactour theming proves insufficient, custom overlay fallback implemented and reactour removed; otherwise reactour retained with justification noted
- [ ] No regressions in tour functionality from #033–#036 after theming changes

## Blocked by

- Blocked by #036
