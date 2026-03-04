'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useClosetStore } from '../store'
import ClosetMaterial from '../../_shared/materials/ClosetMaterial'

const WALL = 0.018
const DOOR_DEPTH = 0.018
const SPACE = 0.001
const CLOSET_INSIDE_INSET = 0.025

// Push-to-open door: no handle, no hinges
function TopDoor({ moduleH, slotW, moduleDepth, doorsOpen, mirror = false }: {
  moduleH: number
  slotW: number
  moduleDepth: number
  doorsOpen: boolean
  mirror?: boolean
}) {
  const pivotRef = useRef<any>(null)
  const posRef = useRef<any>(null)

  const pivotX = mirror ? slotW : 0
  const panelX = mirror ? -slotW / 2 : slotW / 2

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
    <group ref={pivotRef} position={[pivotX, 0, moduleDepth]}>
      <group ref={posRef}>
        <mesh position={[panelX, moduleH / 2, DOOR_DEPTH / 2]} castShadow receiveShadow>
          <boxGeometry args={[slotW - 2 * SPACE, moduleH - 2 * SPACE, DOOR_DEPTH]} />
          <ClosetMaterial />
        </mesh>
      </group>
    </group>
  )
}

export default function TopCabinet() {
  const needsTop = useClosetStore((s) => s.needsTopCabinet())
  const topH = useClosetStore((s) => s.topCabinetHeight()) / 100
  const mainH = useClosetStore((s) => s.mainHeight()) / 100
  const width = useClosetStore((s) => s.width) / 100
  const depth = useClosetStore((s) => s.depth) / 100
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const doorsOpen = useClosetStore((s) => s.doorsOpen)

  if (!needsTop) return null

  const innerW = width - WALL * 2
  const slotW = innerW / moduleCount
  const moduleDepth = depth - WALL - CLOSET_INSIDE_INSET
  const startX = -innerW / 2

  // Interior ceiling: top face must be strictly below the outer corpus top panel bottom face.
  // Outer top panel bottom face = mainH + topH - WALL (world Y).
  // Placing ceiling center at topH - 2*WALL - WALL/2 puts its top face at mainH + topH - 2*WALL,
  // giving a clean WALL-width gap and eliminating coplanar z-fighting.
  const ceilY = topH - WALL - WALL / 2

  return (
    // Same Z origin as main modules (WALL) so geometry aligns flush
    <group position={[0, mainH, WALL]}>
      {Array.from({ length: moduleCount }, (_, i) => {
        const x = startX + i * slotW
        const isLast = i === moduleCount - 1
        const mirror = i % 2 === 1 || isLast

        return (
          <group key={i} position={[x, 0, 0]}>
            {/* Back wall — height capped at ceilY to avoid clipping the outer corpus top panel */}
            <mesh position={[slotW / 2, ceilY / 2, WALL / 2]} castShadow receiveShadow>
              <boxGeometry args={[slotW, ceilY, WALL]} />
              <ClosetMaterial variant="binnenkant" />
            </mesh>

            {/* Left wall */}
            <mesh position={[WALL / 2, ceilY / 2, moduleDepth / 2]} castShadow receiveShadow>
              <boxGeometry args={[WALL, ceilY, moduleDepth]} />
              <ClosetMaterial variant="binnenkant" />
            </mesh>

            {/* Right wall */}
            <mesh position={[slotW - WALL / 2, ceilY / 2, moduleDepth / 2]} castShadow receiveShadow>
              <boxGeometry args={[WALL, ceilY, moduleDepth]} />
              <ClosetMaterial variant="binnenkant" />
            </mesh>

            {/* Floor */}
            <mesh position={[slotW / 2, WALL / 2, moduleDepth / 2]} castShadow receiveShadow>
              <boxGeometry args={[slotW, WALL, moduleDepth]} />
              <ClosetMaterial variant="binnenkant" />
            </mesh>

            {/* Ceiling (inset one WALL to avoid z-fighting with outer corpus top) */}
            <mesh position={[slotW / 2, ceilY, moduleDepth / 2]} castShadow receiveShadow>
              <boxGeometry args={[slotW, WALL, moduleDepth]} />
              <ClosetMaterial variant="binnenkant" />
            </mesh>

            {/* Middle shelf */}
            <mesh position={[slotW / 2, topH / 2, moduleDepth / 2]} castShadow receiveShadow>
              <boxGeometry args={[slotW, WALL, moduleDepth]} />
              <ClosetMaterial variant="binnenkant" />
            </mesh>

            {/* Push-to-open door */}
            <TopDoor
              moduleH={topH}
              slotW={slotW}
              moduleDepth={moduleDepth}
              doorsOpen={doorsOpen}
              mirror={mirror}
            />
          </group>
        )
      })}
    </group>
  )
}
