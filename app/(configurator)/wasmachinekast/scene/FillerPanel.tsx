'use client'

import ClosetMaterial from '../../_shared/materials/ClosetMaterial'

/** Same board as a door, so the panel sits in the exact same plane. */
const DOOR_DEPTH = 0.018
/** Doors keep this gap to their neighbours; the panel keeps it to the doors. */
const SPACE = 0.001
/** Carcass board thickness, as in Module. */
const MODULE_WALL = 0.018
/** A module's floor stops this far short of its front, as in Module. */
const MODULE_INSIDE_INSET = 0.010

/**
 * Afwerkpaneel: a blind front closing off the strip of a section that holds
 * nothing but machines and is too narrow for another module. It is a door
 * panel without hinges — same thickness, same plane, same bottom and top edge
 * as the doors beside it, in the cabinet's outside material.
 *
 * Positioned in section-local coordinates: `xLeft` is the panel's left edge,
 * `yBottom`/`yTop` its vertical extent, and `zBack` the plane the doors' back
 * faces sit on (the panel extends one DOOR_DEPTH forward from there).
 *
 * Behind a door sits a module with its own floor; behind the panel there is no
 * module, so `floor` puts the same board there. Without it the strip above the
 * plinth and the plinth recess look straight into the cabinet.
 */
export default function FillerPanel({
  xLeft,
  widthM,
  yBottom,
  yTop,
  zBack,
  floor,
}: {
  xLeft: number
  widthM: number
  yBottom: number
  yTop: number
  zBack: number
  /** Blind floor board: its top face height and the section-local z it starts at. */
  floor?: { y: number; zStart: number }
}) {
  const w = widthM - 2 * SPACE
  const h = yTop - yBottom - 2 * SPACE
  if (w <= 0 || h <= 0) return null
  const floorDepth = floor ? zBack - floor.zStart : 0
  return (
    <>
      <mesh
        position={[xLeft + widthM / 2, yBottom + SPACE + h / 2, zBack + DOOR_DEPTH / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[w, h, DOOR_DEPTH]} />
        <ClosetMaterial />
      </mesh>
      {floor && floorDepth > MODULE_INSIDE_INSET && (
        <mesh
          position={[
            xLeft + widthM / 2,
            floor.y + MODULE_WALL / 2,
            floor.zStart + (floorDepth - MODULE_INSIDE_INSET) / 2,
          ]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[widthM, MODULE_WALL, floorDepth]} />
          <ClosetMaterial variant="binnenkant" />
        </mesh>
      )}
    </>
  )
}
