'use client'

import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import ClosetMaterial from '../../../_shared/materials/ClosetMaterial'
import { Model as HingeModel } from '../../../_shared/objects/Hinge'
import { HandleByType } from '../../../_shared/objects/Handles'

const DOOR_DEPTH = 0.018
const MODULE_WALL = 0.018
const HINGE_EDGE_OFFSET = 0.20
const HINGE_PAIR_SPACING = 0.45
const SPACE = 0.001

interface DoorProps {
  moduleHeight: number  // overall height cap (min of leftH/rightH) — used for handle positioning
  slotW: number
  moduleDepth: number
  doorsOpen: boolean
  doorHandleId: string
  mirror?: boolean
  // Per-edge heights for diagonal shape. When equal → plain rectangle.
  leftH: number
  rightH: number
}

/**
 * Build the 2D door face shape in the XY plane.
 * Origin is bottom-left of the door slot.
 * leftH and rightH define the height at each vertical edge.
 */
function buildDoorShape(slotW: number, leftH: number, rightH: number): THREE.Shape {
  const shape = new THREE.Shape()
  const w = slotW - 2 * SPACE
  const hL = leftH  - 2 * SPACE
  const hR = rightH - 2 * SPACE

  shape.moveTo(SPACE, SPACE)
  shape.lineTo(SPACE + w, SPACE)
  shape.lineTo(SPACE + w, SPACE + hR)
  shape.lineTo(SPACE,     SPACE + hL)
  shape.closePath()

  return shape
}

export default function Door({
  slotW,
  moduleDepth,
  doorsOpen,
  doorHandleId,
  mirror = false,
  leftH,
  rightH,
}: DoorProps) {
  const pivotRef = useRef<any>(null)
  const posRef   = useRef<any>(null)

  const doorGeometry = useMemo(() => {
    const shape = buildDoorShape(slotW, leftH, rightH)
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: DOOR_DEPTH,
      bevelEnabled: false,
    })
    // Center horizontally and in Z so the mesh can be positioned the same
    // way as the original RoundedBoxGeometry (pivot at door edge, panel offset by ±slotW/2).
    geo.translate(-slotW / 2, 0, -DOOR_DEPTH / 2)
    return geo
  }, [slotW, leftH, rightH])

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
  // Same offset as the original RoundedBoxGeometry setup:
  // non-mirror: panel hangs right from pivot at X=0; mirror: panel hangs left from pivot at X=slotW
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
          {/* Door panel — mirrors original RoundedBoxGeometry positioning */}
          <mesh position={[panelX, 0, DOOR_DEPTH / 2]} castShadow receiveShadow>
            <primitive object={doorGeometry} attach="geometry" />
            <ClosetMaterial />
          </mesh>

          {/* Handle */}
          {doorHandleId !== 'none' && (
            <HandleByType
              id={doorHandleId}
              mirror={mirror}
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
