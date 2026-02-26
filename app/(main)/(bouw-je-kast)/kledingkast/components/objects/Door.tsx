'use client'

import { useRef, useEffect, useMemo } from 'react'
import gsap from 'gsap'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import ClosetMaterial from '../ClosetMaterial'
import { Model as HingeModel } from './Hinge'

const DOOR_DEPTH = 0.018        // 10mm door panel thickness
const MODULE_WALL = 0.018       // side panel thickness — hinges sit at the inner face
const HINGE_EDGE_OFFSET = 0.20  // 15cm from top/bottom edge to outer hinge
const HINGE_PAIR_SPACING = 0.45 // 30cm between the two hinges within each pair

interface DoorProps {
  moduleHeight: number
  slotW: number
  moduleDepth: number
  doorsOpen: boolean
}

const BEVEL_RADIUS = 0.003  // 3mm bevel on all edges
const BEVEL_SEGMENTS = 3

export default function Door({ moduleHeight, slotW, moduleDepth, doorsOpen }: DoorProps) {
  const pivotRef = useRef<any>(null)
  const posRef = useRef<any>(null)

  const doorGeometry = useMemo(
    () => new RoundedBoxGeometry(slotW, moduleHeight, DOOR_DEPTH, BEVEL_SEGMENTS, BEVEL_RADIUS),
    [slotW, moduleHeight],
  )

  // Four hinge Y positions: bottom outer, bottom inner, top inner, top outer
  const hingeYs = [
    HINGE_EDGE_OFFSET,
    HINGE_EDGE_OFFSET + HINGE_PAIR_SPACING,
    moduleHeight - HINGE_EDGE_OFFSET - HINGE_PAIR_SPACING,
    moduleHeight - HINGE_EDGE_OFFSET,
  ]

  useEffect(() => {
    if (!pivotRef.current || !posRef.current) return
    gsap.to(pivotRef.current.rotation, {
      y: doorsOpen ? -Math.PI * 0.555 : 0,
      duration: 0.6,
      ease: 'power2.inOut',
    })
    gsap.to(posRef.current.position, {
      x: doorsOpen ? 0.005 : 0,
      z: doorsOpen ? -0.0275 : 0,
      duration: 0.6,
      ease: 'power2.inOut',
    })
  }, [doorsOpen])

  return (
    <>
      {/* Door panel — rotates with pivot, inner group handles position offset */}
      <group ref={pivotRef} position={[0, 0, moduleDepth]}>
        <group ref={posRef}>
          <mesh position={[slotW / 2, moduleHeight / 2, DOOR_DEPTH / 2]} castShadow receiveShadow>
            <primitive object={doorGeometry} attach="geometry" />
            <ClosetMaterial />
          </mesh>
        </group>
      </group>

      {/* Hinges — fixed to module interior, animate via their own GLB animation */}
      {hingeYs.map((y, i) => (
        <HingeModel key={i} position={[MODULE_WALL+0.01, y, moduleDepth - 0.03]} rotation={[0, 0, 0]} doorsOpen={doorsOpen} />
      ))}
    </>
  )
}
