'use client'

import { useGLTF } from '@react-three/drei'
import * as THREE from 'three/webgpu'
import { useMemo } from 'react'
import type { ModuleLayoutConfig } from './moduleLayouts'

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

  const scaleZ = targetWidth * layout.specialElement.baseWidth
  const scaleX = targetDepth * layout.specialElement.baseDepth

  const clone = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.geometry = mesh.geometry.clone()
        // Scale X and Z only — never scale Y
        mesh.geometry.scale(scaleX, 1, scaleZ)
        mesh.position.x *= scaleX
        mesh.position.z *= scaleZ
      }

      if (child.name.includes('Deur')) {
        child.rotation.y = doorRotation
      }
    })
    return c
  }, [scene, scaleX, scaleZ, doorRotation])

  return (
    <primitive object={clone} position={[0, positionY, 0]} rotation={[0,0,0]} />
  )
}

export default function SpecialElement(props: SpecialElementProps) {
  // If there's no GLB, render nothing
  if (!props.layout.specialElement.glbPath) return null
  return <SpecialElementInner {...props} />
}
