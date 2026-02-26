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
// Mesh name tokens drive positioning:
//   Right  (no _ws) → mesh.position.x += widthGrowth      clamps to right edge
//   Middle (no _ws) → mesh.position.x += widthGrowth / 2  stays centered in width
//   Back            → back-anchored, suppresses front-anchor shift
//   Left / none     → left-anchored / front-anchored

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

  const { clone, offsetX, offsetZ } = useMemo(() => {
    // Capture original bounding box BEFORE any modifications.
    // We use originalBox.min for alignment so that front-anchored mesh
    // position shifts (which go negative when scaling down) don't corrupt
    // the back-wall anchor. _ds and Back meshes never move in Z, so
    // originalBox.min.z is always the correct Z=0 reference.
    const originalBox = new THREE.Box3().setFromObject(scene)
    const originalWidth = originalBox.max.x - originalBox.min.x
    const originalDepth = originalBox.max.z - originalBox.min.z

    const widthScale  = targetWidth / originalWidth
    const depthScale  = targetDepth / originalDepth
    const widthGrowth = targetWidth - originalWidth
    const depthGrowth = targetDepth - originalDepth

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

      const hasDS    = mesh.name.includes('_ds')
      const hasWS    = mesh.name.includes('_ws')
      const isRight  = mesh.name.includes('Right')
      const isMiddle = mesh.name.includes('Middle')
      const isBack   = mesh.name.includes('Back')

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
      // Middle non-_ws: shift by half widthGrowth to stay centered.
      if (isRight && !hasWS) {
        mesh.position.x += widthGrowth
      } else if (isMiddle && !hasWS) {
        mesh.position.x += widthGrowth / 2
      }

      // --- Depth positioning ---
      // Non-_ds, non-Back: front-anchored — maintain distance from the front face.
      if (!hasDS && !isBack) {
        mesh.position.z += depthGrowth
      }
    })

    return {
      clone:   c,
      // Use originalBox.min for both axes — these anchors are stable because:
      //   X: Left/_ws meshes never shift in X → original min.x is always the left edge
      //   Z: _ds/Back meshes never shift in Z → original min.z is always the back edge
      offsetX: -originalBox.min.x + MODULE_WALL,
      offsetZ: -originalBox.min.z,
    }
  }, [scene, targetWidth, targetDepth, doorRotation, closetMaterial])

  return (
    <primitive object={clone} position={[offsetX, positionY, offsetZ]} rotation={[0, 0, 0]} />
  )
}

export default function SpecialElement(props: SpecialElementProps) {
  if (!props.layout.specialElement.glbPath) return null
  return <SpecialElementInner {...props} />
}
