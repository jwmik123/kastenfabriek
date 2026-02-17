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
    let y = startY + config.spacing
    while (y < endY - SHELF_THICKNESS) {
      positions.push(y)
      y += config.spacing
    }
    return positions
  }, [config, startY, endY])

  if (config.type === 'open' || shelfPositions.length === 0) return null

  return (
    <>
      {shelfPositions.map((y, i) => (
        <mesh key={i} position={[centerX, y + SHELF_THICKNESS / 2, centerZ]}>
          <boxGeometry args={[width, SHELF_THICKNESS, depth]} />
          <ClosetMaterial />
        </mesh>
      ))}
    </>
  )
}
