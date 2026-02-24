'use client'

import { useGLTF } from '@react-three/drei'
import * as THREE from 'three/webgpu'
import { useMemo } from 'react'
import type { ModuleLayoutConfig } from './moduleLayouts'
import { useClosetMaterialInstance } from './ClosetMaterial'

// All nodes in module GLBs carry a -90° Y rotation.
// After that rotation: local X → world Z (depth), local Z → world X (width).
// So sceneSize.x = WIDTH, sceneSize.z = DEPTH.
//
// Mesh name suffixes drive scaling:
//   _ds  → geometry.scale(depthScale, 1, 1)   stretches local X → world Z (depth)
//   _ws  → geometry.scale(1, 1, widthScale)   stretches local Z → world X (width)
//
// Mesh name tokens drive width positioning:
//   Right (no _ws) → mesh.position.x += widthGrowth   clamps to right edge
//   Left  (or none) → no adjustment                    stays at left edge

const MODULE_WALL = 0.018

interface SpecialElementProps {
  layout: ModuleLayoutConfig
  targetWidth: number  // slot width in meters
  targetDepth: number  // module depth in meters
  positionY: number    // Y of the element's bottom in module-group space
  doorRotation: number // door open angle in radians
}

function SpecialElementInner({
  layout,
  targetWidth,
  targetDepth,
  positionY,
  doorRotation,
}: SpecialElementProps) {
  const { scene } = useGLTF(layout.specialElement.glbPath!)
  const closetMaterial = useClosetMaterialInstance()

  // Original world-space dimensions of the GLB (width = X, depth = Z)
  const originalSize = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    return new THREE.Vector3(
      box.max.x - box.min.x,  // width
      box.max.y - box.min.y,  // height
      box.max.z - box.min.z,  // depth
    )
  }, [scene])

  const { clone, offsetX, offsetZ } = useMemo(() => {
    const widthScale  = targetWidth  / originalSize.x
    const depthScale  = targetDepth  / originalSize.z
    const widthGrowth = targetWidth  - originalSize.x
    const depthGrowth = targetDepth  - originalSize.z

    const c = scene.clone(true)

    c.traverse((child: THREE.Object3D) => {
      // Door rotation
      if (child.name.includes('Deur')) {
        child.rotation.y = doorRotation
      }

      if (!(child as THREE.Mesh).isMesh) return
      const mesh = child as THREE.Mesh

      mesh.geometry = mesh.geometry.clone()
      mesh.material = closetMaterial
      mesh.castShadow = true
      mesh.receiveShadow = true

      const hasDS   = mesh.name.includes('_ds')
      const hasWS   = mesh.name.includes('_ws')
      const isRight = mesh.name.includes('Right')
      const isBack  = mesh.name.includes('Back')

      // --- Geometry scaling ---
      if (hasDS && hasWS) {
        mesh.geometry.scale(depthScale, 1, widthScale)
      } else if (hasDS) {
        mesh.geometry.scale(depthScale, 1, 1)
      } else if (hasWS) {
        mesh.geometry.scale(1, 1, widthScale)
      }
      // no flags → fixed size, no stretch

      // --- Width positioning ---
      // Right non-_ws: shift world-X to maintain distance from right edge.
      if (isRight && !hasWS) {
        mesh.position.x += widthGrowth
      }

      // --- Depth positioning ---
      // _ws-only (no _ds): front-anchored — maintain distance from the front face.
      // Analogous to Right meshes being anchored to the right edge.
      if (!hasDS && !isBack) {
        mesh.position.z += depthGrowth
      }
    })

    // Align the element: left edge at MODULE_WALL, back edge at Z=0
    const box = new THREE.Box3().setFromObject(c)
    return {
      clone:   c,
      offsetX: -box.min.x + MODULE_WALL,
      offsetZ: -box.min.z,
    }
  }, [scene, originalSize, targetWidth, targetDepth, doorRotation, closetMaterial])

  return (
    <primitive object={clone} position={[offsetX, positionY, offsetZ]} rotation={[0, 0, 0]} />
  )
}

export default function SpecialElement(props: SpecialElementProps) {
  if (!props.layout.specialElement.glbPath) return null
  return <SpecialElementInner {...props} />
}
