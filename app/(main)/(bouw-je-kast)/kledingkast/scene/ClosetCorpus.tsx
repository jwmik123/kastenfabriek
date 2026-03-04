'use client'

import { useClosetStore } from '../store'
import ClosetMaterial from '../../_shared/materials/ClosetMaterial'

const WALL = 0.018
// Side walls always extend 15mm above the corpus top panel to prevent doors hitting the ceiling
const SIDE_WALL_EXTRA = 0.015

export default function ClosetCorpus() {
  const width = useClosetStore((s) => s.width) / 100
  const height = useClosetStore((s) => s.height) / 100
  const depth = useClosetStore((s) => s.depth) / 100
  const mainH = useClosetStore((s) => s.mainHeight()) / 100
  const needsTop = useClosetStore((s) => s.needsTopCabinet())

  // Top panel sits 15mm below the side wall tops — side walls define total outer height
  const topPanelY = height - SIDE_WALL_EXTRA
  const backPanel = height - SIDE_WALL_EXTRA

  return (
    // Bottom-anchored group (y=0 at floor) for clean absolute positioning
    <group position={[0, 0, depth / 2]}>
      {/* Back wall */}
      <mesh position={[0, backPanel / 2, -depth / 2 + WALL / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, backPanel, WALL]} />
        <ClosetMaterial />
      </mesh>

      {/* Left wall — outer height, extends 15mm above top panel */}
      <mesh position={[-width / 2 + WALL / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL, height, depth]} />
        <ClosetMaterial />
      </mesh>

      {/* Right wall — outer height, extends 15mm above top panel */}
      <mesh position={[width / 2 - WALL / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL, height, depth]} />
        <ClosetMaterial />
      </mesh>

      {/* Outer top panel — 15mm below side wall tops */}
      <mesh position={[0, topPanelY - WALL / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, WALL, depth]} />
        <ClosetMaterial />
      </mesh>

      {/* Separator panel between main closet and top cabinet.
          Bottom face aligns exactly with module roof top face (mainH - WALL),
          top face aligns exactly with top cabinet floor bottom face (mainH). */}
      {needsTop && (
        <mesh position={[0, mainH - WALL / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, WALL, depth]} />
          <ClosetMaterial />
        </mesh>
      )}
    </group>
  )
}
