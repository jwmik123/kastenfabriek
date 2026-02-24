'use client'

import { useGLTF } from '@react-three/drei'
import * as THREE from 'three/webgpu'
import { useMemo } from 'react'
import type { ModuleLayoutConfig } from './moduleLayouts'
import { useClosetMaterialInstance } from './ClosetMaterial'

interface SpecialElementProps {
  layout: ModuleLayoutConfig
  targetWidth: number  // desired slot width in meters
  targetDepth: number  // desired module depth in meters
  positionY: number    // Y position of the element's bottom edge
  doorRotation: number // rotation angle for doors (0 = closed)
}

function SpecialElementInner({
  layout,
  targetWidth,
  targetDepth,
  positionY,
  doorRotation,
}: SpecialElementProps) {
  const { scene } = useGLTF(layout.specialElement.glbPath!)

  const scaleZ = targetWidth / layout.specialElement.baseWidth
  const scaleX = targetDepth / layout.specialElement.baseDepth

  const closetMaterial = useClosetMaterialInstance()

  const { clone, offsetX, offsetZ } = useMemo(() => {
    const c = scene.clone(true)
    const fixedDepthMeshes: THREE.Mesh[] = []

    // First pass: scale all geometries, collect non-_ds meshes
    c.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.geometry = mesh.geometry.clone()
        mesh.material = closetMaterial
        mesh.castShadow = true
        mesh.receiveShadow = true

        console.log(`Processing mesh: ${mesh.name}, scalable in depth: ${mesh.name.includes('_ds')}, scalable in width: ${mesh.name.includes('_ws')}`);

        const isDepthScalable = mesh.name.includes('_ds')
        const isWidthScalable = mesh.name.includes('_ws')

        if (isDepthScalable && isWidthScalable) {
          // Scale in both depth (X) and width (Z)
          mesh.geometry.scale(scaleX, 1, scaleZ)
          mesh.position.z *= scaleX
        } else if (isDepthScalable) {
          mesh.geometry.scale(scaleX, 1, 1)
          mesh.position.z *= scaleX
        } else if (isWidthScalable) {
          mesh.geometry.scale(1, 1, scaleZ)
          fixedDepthMeshes.push(mesh)
        } else {
          fixedDepthMeshes.push(mesh)
        }
      }

      if (child.name.includes('Deur')) {
        child.rotation.y = doorRotation
      }
    })
    // Second pass: offset non-_ds meshes so they stay at the front edge
    // The _ds front edge moved forward by this amount:
    const depthGrowth = layout.specialElement.baseDepth * (scaleX - 1)
    // Second pass: reposition non-_ds meshes proportionally in depth,
    // same scaling their positions as _ds meshes do.
    for (const mesh of fixedDepthMeshes) {
      mesh.position.z += depthGrowth
    }

    // Compute offset to align element flush to origin on X and Z
    const box = new THREE.Box3().setFromObject(c)
    const MODULE_WALL = 0.018
    return { clone: c, offsetX: -box.min.x + MODULE_WALL, offsetZ: -box.min.z }
  }, [scene, scaleX, scaleZ, doorRotation, closetMaterial])

  return (
    <primitive object={clone} position={[offsetX, positionY, offsetZ]} rotation={[0, 0, 0]} />
  )
}

export default function SpecialElement(props: SpecialElementProps) {
  if (!props.layout.specialElement.glbPath) return null
  return <SpecialElementInner {...props} />
}