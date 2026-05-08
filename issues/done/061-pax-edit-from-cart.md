## Parent PRD

`issues/prd-pax-doors-product.md`

## What to build

Wire the pencil "edit" affordance on PAX cart lines so it links to the PDP with `?edit=<cartItemId>`, which pre-fills width/height/material/qty from the existing cart line and updates the same line on save (mirrors the closet flow).

See PRD § Implementation Decisions → "Routing & pages".

## Acceptance criteria

- [ ] Pencil icon on PAX cart lines links to `/producten/<productSlug>?edit=<cartItemId>`
- [ ] PDP reads the `edit` param, locates the cart line (DB for authed, localStorage for anon), and pre-fills width/height/material/qty
- [ ] Save updates the same cart line id rather than creating a new line
- [ ] If the edit id no longer exists, PDP falls back to fresh state (no error)
- [ ] Edit followed by changing material to one that already matches another line does NOT silently merge — line identity is preserved on edit (out-of-scope for v1: explicit merge confirmation)

## Blocked by

- Blocked by `issues/060-cart-polymorphism-pax-add-to-cart.md`

## User stories addressed

- User story 13
