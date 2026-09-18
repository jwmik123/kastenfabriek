'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { useConfiguratorStore } from '../store/context'
import { getFloor, type FloorOption } from './floors'
import { createWoodFloorMaterial } from '../shaders/woodFloor'
import { createPlankFloorMaterial } from '../shaders/plankFloor'

export function createFloorMaterial(floor: FloorOption): THREE.Material {
  // Planks are matt oiled oak: the relief comes from the normal map, not from gloss.
  const roughness = floor.kind === 'planks' ? 0.8 : floor.roughness
  if (floor.kind === 'planks') {
    return createPlankFloorMaterial({ tint: floor.color, roughness })
  }
  if (floor.kind === 'herringbone' && floor.palette) {
    return createWoodFloorMaterial({
      pattern: floor.kind,
      palette: floor.palette,
      roughness,
      plankWidth: floor.plankWidth,
      ratio: floor.plankRatio,
    })
  }
  return new THREE.MeshStandardMaterial({
    color: floor.color,
    roughness,
    metalness: 0,
  })
}

/**
 * Material for the room floor, driven by the store's `floorId`.
 * A new material is created per finish and the previous one disposed; the
 * mesh should be keyed on `material.uuid` so WebGPU rebuilds its render
 * object instead of reusing a cached one.
 */
export function useFloorMaterial(): THREE.Material {
  const floorId = useConfiguratorStore((s) => s.floorId)
  const material = useMemo(() => createFloorMaterial(getFloor(floorId)), [floorId])
  useEffect(() => () => material.dispose(), [material])
  return material
}
