'use client'

import { useMemo } from 'react'
import type { FillZoneConfig } from './moduleLayouts'
import { SHELF_THICKNESS } from './moduleLayouts'
import ClosetMaterial from '../../_shared/materials/ClosetMaterial'

interface FillZoneProps {
  config: FillZoneConfig
  startY: number  // bottom of fill zone (meters, relative to module origin)
  endY: number    // top of fill zone
  width: number   // shelf width
  depth: number   // shelf depth
  centerX: number // X center of shelves within the module group
  centerZ: number // Z center of shelves within the module group
  hasDoor: boolean
}

export default function FillZone({
  config,
  startY,
  endY,
  width,
  depth,
  centerX,
  centerZ,
  hasDoor,
}: FillZoneProps) {
  const shelfPositions = useMemo(() => {
    if (config.type !== 'shelves') return []

    const zoneHeight = endY - startY
    if (zoneHeight <= SHELF_THICKNESS * 2) return []

    const positions: number[] = []
    const firstIndex = Math.round(startY / config.spacing) + 1
    let y = firstIndex * config.spacing
    while (y + SHELF_THICKNESS < endY) {
      positions.push(y)
      y += config.spacing
    }

    if (positions.length > 0) {
      const lastY = positions[positions.length - 1]
      const gapAbove = endY - (lastY + SHELF_THICKNESS /2)
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
          <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
        </mesh>
      ))}
    </>
  )
}
