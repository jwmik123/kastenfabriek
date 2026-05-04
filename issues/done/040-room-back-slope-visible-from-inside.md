# 040 — Room back-slope visible from inside the closet

## Parent

[038-back-diagonal-corpus-and-room-fixes.md](./038-back-diagonal-corpus-and-room-fixes.md)

## What to build

When the kledingkast back-diagonal is enabled, the room's back-diagonal slope panel is invisible from inside the closet. Looking up-and-back, the area above the kink height reads as empty, breaking the sense of enclosure.

Root cause: the slope panel geometry in `RoomWalls` is built with a triangle winding whose surface normal points up-and-back, away from the room interior. With the project's `FrontSide` material, the panel is only visible from outside.

Fix: flip the triangle index order so the surface normal points down-and-forward into the room interior. No change to the back room wall rectangle, the side-diag side-wall builder, the ceiling, the floor, or the corpus back wall.

## Acceptance criteria

- [ ] With back-diagonal on in `ingebouwd` placement, the back-diagonal slope panel is visible when looking up-and-back from inside the closet.
- [ ] With back-diagonal on in `vrijstaand` placement, the slope panel is visible across the full extended scene width.
- [ ] No regression to side-diagonal room walls, ceiling, floor, or back wall rectangle.
- [ ] No regression to no-diagonal room rendering.

## Blocked by

None - can start immediately
