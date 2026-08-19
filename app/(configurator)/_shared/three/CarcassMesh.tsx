'use client'

import { useMemo, type ReactNode } from 'react'
import type * as THREE from 'three/webgpu'
import { useClosetMaterialInstance } from '../materials/ClosetMaterial'

/** BoxGeometry material slot facing +Z — the side a panel turns to the room. */
export const BOX_FRONT_SLOT = 4
/** BoxGeometry slot count. */
export const BOX_SLOTS = 6
/**
 * ExtrudeGeometry material slot 0 covers both lid faces. For a panel extruded
 * along +Z that is the front edge plus the back edge; the back one sits against
 * the corpus back and never shows, so painting slot 0 paints the visible edge.
 */
export const EXTRUDE_FRONT_SLOT = 0
/** ExtrudeGeometry slot count: 0 = lids, 1 = extruded sides. */
export const EXTRUDE_SLOTS = 2

interface CarcassMeshProps {
  /** Pre-built geometry. Omit and pass a geometry element as children instead. */
  geometry?: THREE.BufferGeometry
  position?: [number, number, number]
  /** Interior colour for the panel body. */
  insideFinish: boolean
  /**
   * Set when nothing covers this module's opening (a washer niche): the panel's
   * front edge then takes the buitenkant colour, the way edge banding does on a
   * real carcass. The panel's inner faces stay in the interior colour.
   */
  frontEdgeExposed: boolean
  /** Material slot whose faces look out into the room. */
  frontSlot: number
  /** Material slots the geometry declares. */
  slots: number
  children?: ReactNode
}

/**
 * Carcass panel (side wall, roof, floor, shelf) that can carry a different
 * colour on the single face turned towards the room.
 *
 * Lives in its own component because the material hooks must run inside the
 * module's <ModuleMaterialOverrideProvider>, which Module renders around its
 * own subtree — a hook in Module's body would read the section's colours
 * instead of the module's own.
 */
export default function CarcassMesh({
  geometry,
  position,
  insideFinish,
  frontEdgeExposed,
  frontSlot,
  slots,
  children,
}: CarcassMeshProps) {
  const bodyMaterial = useClosetMaterialInstance(insideFinish ? 'binnenkant' : 'buitenkant')
  const frontMaterial = useClosetMaterialInstance('buitenkant')

  const material = useMemo(() => {
    // Nothing to split when the panel is already one colour throughout.
    if (!frontEdgeExposed || !insideFinish) return bodyMaterial
    return Array.from({ length: slots }, (_, i) => (i === frontSlot ? frontMaterial : bodyMaterial))
  }, [frontEdgeExposed, insideFinish, slots, frontSlot, bodyMaterial, frontMaterial])

  return (
    <mesh geometry={geometry} position={position} material={material} castShadow receiveShadow>
      {children}
    </mesh>
  )
}
