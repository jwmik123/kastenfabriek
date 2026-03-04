'use client'

import { useMemo } from 'react'
import type { FillZoneConfig } from './moduleLayouts'
import { SHELF_THICKNESS } from './moduleLayouts'
import ClosetMaterial from './ClosetMaterial'

interface FillZoneProps {
  config: FillZoneConfig
  startY: number  // bottom of fill zone (meters, relative to module origin)
  endY: number    // top of fill zone
  width: number   // shelf width
  depth: number   // shelf depth
  centerX: number // X center of shelves within the module group
  centerZ: number // Z center of shelves within the module group
}

export default function FillZone({
  config,
  startY,
  endY,
  width,
  depth,
  centerX,
  centerZ,
}: FillZoneProps) {
  const shelfPositions = useMemo(() => {
    if (config.type !== 'shelves') return []

    const zoneHeight = endY - startY
    if (zoneHeight <= SHELF_THICKNESS * 2) return []

    const positions: number[] = []
    // Snap to global grid anchored at Y=0 so shelves align across modules.
    // Math.round ensures the gap above the special element is always ≥ spacing/2 (never tiny).
    const firstIndex = Math.round(startY / config.spacing) + 1
    let y = firstIndex * config.spacing
    while (y + SHELF_THICKNESS < endY) {
      positions.push(y)
      y += config.spacing
    }

    // Remove the last shelf if the gap above it is less than one spacing
    if (positions.length > 0) {
      const lastY = positions[positions.length - 1]
      const gapAbove = endY - (lastY + SHELF_THICKNESS)
      if (gapAbove < config.spacing) {
        positions.pop()
      }
    }

    return positions
  }, [config, startY, endY])

  if (config.type === 'open' || shelfPositions.length === 0) return null

  return (
    <>
      {shelfPositions.map((y, i) => (
        <mesh key={i} position={[centerX, y + SHELF_THICKNESS / 2, centerZ]} castShadow receiveShadow>
          <boxGeometry args={[width, SHELF_THICKNESS, depth]} />
          <ClosetMaterial />
        </mesh>
      ))}
    </>
  )
}
