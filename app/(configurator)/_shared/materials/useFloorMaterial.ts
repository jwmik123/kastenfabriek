'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { useConfiguratorStore } from '../store/context'
import { getFloor, type FloorOption } from './floors'
import { createWoodFloorMaterial } from '../shaders/woodFloor'
import { createPlankFloorMaterial } from '../shaders/plankFloor'

/** Satin finish: the registry's roughness is the raw surface; a lacquered room floor has a slight sheen. */
const FLOOR_SHEEN = 0.62

export function createFloorMaterial(floor: FloorOption): THREE.Material {
  const roughness = floor.roughness * FLOOR_SHEEN
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
