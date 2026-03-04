'use client'

import { useRef, useEffect, useMemo } from 'react'
import gsap from 'gsap'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import ClosetMaterial from '../materials/ClosetMaterial'
import { Model as HingeModel } from './Hinge'
import { HandleByType } from './Handles'

const DOOR_DEPTH = 0.018        // 10mm door panel thickness
const MODULE_WALL = 0.018       // side panel thickness — hinges sit at the inner face
const HINGE_EDGE_OFFSET = 0.20  // 15cm from top/bottom edge to outer hinge
const HINGE_PAIR_SPACING = 0.45 // 30cm between the two hinges within each pair
const SPACE_AROUND_DOORS = 0.001 // 5mm gap between doors and between doors and module walls when closed

interface DoorProps {
  moduleHeight: number
  slotW: number
  moduleDepth: number
  doorsOpen: boolean
  doorHandleId: string
  mirror?: boolean
}

const BEVEL_RADIUS = 0.003  // 3mm bevel on all edges
const BEVEL_SEGMENTS = 3

export default function Door({ moduleHeight, slotW, moduleDepth, doorsOpen, doorHandleId, mirror = false }: DoorProps) {
  const pivotRef = useRef<any>(null)
  const posRef = useRef<any>(null)

  const doorGeometry = useMemo(
    () => new RoundedBoxGeometry(slotW - 2 * SPACE_AROUND_DOORS, moduleHeight - 2 * SPACE_AROUND_DOORS, DOOR_DEPTH, BEVEL_SEGMENTS, BEVEL_RADIUS),
    [slotW, moduleHeight],
  )

  // Four hinge Y positions: bottom outer, bottom inner, top inner, top outer
  const hingeYs = [
    HINGE_EDGE_OFFSET,
    HINGE_EDGE_OFFSET + HINGE_PAIR_SPACING,
    moduleHeight - HINGE_EDGE_OFFSET - HINGE_PAIR_SPACING,
    moduleHeight - HINGE_EDGE_OFFSET,
  ]

  // Mirror: pivot on right edge, panel hangs left, opens to the right
  const pivotX  = mirror ? slotW : 0
  const panelX  = mirror ? -slotW / 2 : slotW / 2
  const handleX = mirror ? 0.055 - slotW : slotW - 0.055
  const hingeX  = mirror ? slotW - MODULE_WALL - 0.01 : MODULE_WALL + 0.01

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
      {/* Door panel — rotates with pivot, inner group handles position offset */}
      <group ref={pivotRef} position={[pivotX, 0, moduleDepth]}>
        <group ref={posRef}>
          <mesh position={[panelX, moduleHeight / 2, DOOR_DEPTH / 2]} castShadow receiveShadow>
            <primitive object={doorGeometry} attach="geometry" />
            <ClosetMaterial />
          </mesh>

          {/* Handle — mounted on door front face, opposite the hinges */}
          {doorHandleId !== 'none' && (
            <HandleByType
              id={doorHandleId}
              position={[handleX, moduleHeight / 2, -DOOR_DEPTH/2]}
            />
          )}
        </group>
      </group>

      {/* Hinges — fixed to module interior, animate via their own GLB animation */}
      {hingeYs.map((y, i) => (
        <HingeModel key={i} position={[hingeX, y, moduleDepth - 0.03]} rotation={[0, 0, 0]} doorsOpen={doorsOpen} />
      ))}
    </>
  )
}
