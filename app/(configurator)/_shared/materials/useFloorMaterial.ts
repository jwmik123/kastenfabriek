'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { useConfiguratorStore } from '../store/context'
import { getFloor, type FloorOption } from './floors'
import { createWoodFloorMaterial } from '../shaders/woodFloor'

export function createFloorMaterial(floor: FloorOption): THREE.Material {
  if ((floor.kind === 'herringbone' || floor.kind === 'planks') && floor.palette) {
    return createWoodFloorMaterial({
      pattern: floor.kind,
      palette: floor.palette,
      roughness: floor.roughness,
      plankWidth: floor.plankWidth,
      ratio: floor.plankRatio,
    })
  }
  return new THREE.MeshStandardMaterial({
    color: floor.color,
    roughness: floor.roughness,
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
