'use client'

import { useMemo } from 'react'
import type { FillZoneConfig } from '../../kledingkast/scene/moduleLayouts'
import {
  SHELF_THICKNESS,
  computeShelfPositions,
} from '../../kledingkast/scene/moduleLayouts'
import ClosetMaterial from '../materials/ClosetMaterial'

interface FillZoneProps {
  config: FillZoneConfig
  startY: number  // bottom of fill zone (meters, relative to module origin)
  endY: number    // top of fill zone
  width: number   // shelf width
  depth: number   // shelf depth
  centerX: number // X center of shelves within the module group
  centerZ: number // Z center of shelves within the module group
  hasDoor: boolean
  fillToTop?: boolean // skip gap-above check, fill right up to the ceiling
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
  fillToTop = false,
}: FillZoneProps) {
  const shelfPositions = useMemo(
    () => computeShelfPositions(config, startY, endY, fillToTop),
    [config, startY, endY, fillToTop],
  )

  if (shelfPositions.length === 0) return null

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
