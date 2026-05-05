'use client'

import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import ClosetMaterial from '../materials/ClosetMaterial'
import { Model as HingeModel } from './Hinge'
import { HandleByType } from './Handles'
import type { HandleMaterial, LeatherColor } from '../constants/handleMaterials'
import { trapShape, trapGeo } from '@/utils/debugGeometry'

const DOOR_DEPTH = 0.018
const MODULE_WALL = 0.018
const HINGE_EDGE_OFFSET = 0.20
const HINGE_PAIR_SPACING = 0.45
const SPACE = 0.001
// MODULE_FLOOR_Y = ONDERSTEL_HEIGHT (0.108) + ONDERSTEL_GAP (0.010)
const MODULE_FLOOR_Y = 0.118

interface DoorProps {
  moduleHeight: number  // min(leftH, rightH) — used for handle positioning
  slotW: number
  moduleDepth: number
  doorsOpen: boolean
  doorHandleId: string
  doorHandleMaterial?: HandleMaterial
  doorHandleBodyColor?: LeatherColor
  doorHandleMeshId?: string
  mirror?: boolean
  extendToFloor?: boolean
  /**
   * Ceiling profile in door-local coordinates: x runs 0..slotW, y is the
   * ceiling height at that x. Must include both endpoints; may include kink
   * points where the diagonal transitions to flat, so the door top edge
   * follows the actual ceiling profile rather than interpolating straight.
   */
  topProfile: Array<{ x: number; y: number }>
}

/**
 * Build the 2D door face shape in the XY plane.
 * Bottom edge is flat at bottomY; top edge follows topProfile (may have kink points).
 */
function buildDoorShape(slotW: number, topProfile: Array<{ x: number; y: number }>, bottomY: number): THREE.Shape {
  const shape = new THREE.Shape()
  const w = slotW - 2 * SPACE

  // Bottom edge: left → right
  shape.moveTo(SPACE, bottomY)
  shape.lineTo(SPACE + w, bottomY)

  // Top edge: right → left through profile points
  for (let i = topProfile.length - 1; i >= 0; i--) {
    const dx = SPACE + (topProfile[i].x / slotW) * w
    const dy = topProfile[i].y - SPACE
    shape.lineTo(dx, dy)
  }

  shape.closePath()
  return shape
}

export default function Door({
  slotW,
  moduleDepth,
  doorsOpen,
  doorHandleId,
  doorHandleMaterial = 'chrome',
  doorHandleBodyColor,
  doorHandleMeshId,
  mirror = false,
  extendToFloor = false,
  topProfile,
}: DoorProps) {
  const pivotRef = useRef<any>(null)
  const posRef   = useRef<any>(null)

  const leftH  = topProfile[0].y
  const rightH = topProfile[topProfile.length - 1].y

  // Module group origin sits at world y = MODULE_FLOOR_Y (bottom of the floor
  // panel). Default door bottom ends at the bottom of the panel (door-local
  // y = SPACE). extendToFloor drops the bottom to world y = 0.02 (2 cm above
  // the scene floor) → door-local 0.02 - MODULE_FLOOR_Y.
  const bottomY = extendToFloor ? 0.02 - MODULE_FLOOR_Y : SPACE

  const doorGeometry = useMemo(() => {
    const shape = buildDoorShape(slotW, topProfile, bottomY)
    const geo = new THREE.ExtrudeGeometry(trapShape(shape, `Door-slotW${slotW.toFixed(3)}`), {
      depth: DOOR_DEPTH,
      bevelEnabled: false,
    })
    geo.translate(-slotW / 2, 0, -DOOR_DEPTH / 2)
    return trapGeo(geo, `Door-geo-slotW${slotW.toFixed(3)}`)
  // topProfile is a memoized array from Module — reference is stable between renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotW, topProfile, bottomY])

  // Hinge Y positions — clamped to the height at the hinge's edge (left hinges → leftH, right → rightH)
  const hingeEdgeH = mirror ? rightH : leftH
  const hingeYs = useMemo(() => {
    const maxH = hingeEdgeH - SPACE
    const candidates = [
      HINGE_EDGE_OFFSET,
      HINGE_EDGE_OFFSET + HINGE_PAIR_SPACING,
      hingeEdgeH - HINGE_EDGE_OFFSET - HINGE_PAIR_SPACING,
      hingeEdgeH - HINGE_EDGE_OFFSET,
    ]
    return candidates.filter((y) => y > 0 && y < maxH)
  }, [hingeEdgeH])

  const pivotX  = mirror ? slotW : 0
  const panelX  = mirror ? -slotW / 2 : slotW / 2
  const handleX = mirror ? 0.055 - slotW : slotW - 0.055
  const hingeX  = mirror ? slotW - MODULE_WALL - 0.01 : MODULE_WALL + 0.01
  const handleY = 0.9

  useEffect(() => {
    if (!pivotRef.current || !posRef.current) return
    gsap.to(pivotRef.current.rotation, {
      y: doorsOpen ? (mirror ? Math.PI * 0.475 : -Math.PI * 0.475) : 0,
      duration: 0.6,
      ease: 'power2.inOut',
    })
    gsap.to(posRef.current.position, {
      x: doorsOpen ? (mirror ? -0.005 : 0.005) : 0,
      z: doorsOpen ? -0.025 : 0,
      duration: 0.6,
      ease: 'power2.inOut',
    })
  }, [doorsOpen, mirror])

  return (
    <>
      <group ref={pivotRef} position={[pivotX, 0, moduleDepth]}>
        <group ref={posRef}>
          <mesh position={[panelX, 0, DOOR_DEPTH / 2]} castShadow receiveShadow>
            <primitive object={doorGeometry} attach="geometry" />
            <ClosetMaterial />
          </mesh>

          {doorHandleId !== 'none' && (
            <HandleByType
              id={doorHandleId}
              meshId={doorHandleMeshId}
              mirror={mirror}
              material={doorHandleMaterial}
              bodyColor={doorHandleBodyColor}
              position={[handleX, handleY, -DOOR_DEPTH / 2]}
            />
          )}
        </group>
      </group>

      {/* Hinges */}
      {hingeYs.map((y, i) => (
        <HingeModel key={i} position={[hingeX, y, moduleDepth - 0.03]} rotation={[0, 0, 0]} doorsOpen={doorsOpen} />
      ))}
    </>
  )
}
