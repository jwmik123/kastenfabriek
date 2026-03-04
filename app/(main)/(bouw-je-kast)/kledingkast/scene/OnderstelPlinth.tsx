'use client'

import { useEffect, useMemo, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three/webgpu'
import { useClosetStore } from '../store'
import { useClosetMaterialInstance } from '../../_shared/materials/ClosetMaterial'

const WALL = 0.018
const ONDERSTEL_FRONT_INSET = 0.089

export default function OnderstelPlinth() {
  const width = useClosetStore((s) => s.width) / 100
  const depth = useClosetStore((s) => s.depth) / 100
  const { scene } = useGLTF('/objects/onderstel.glb')
  const material = useClosetMaterialInstance()

  const innerW = width - WALL * 2
  const innerD = depth - WALL - ONDERSTEL_FRONT_INSET

  const [{ clone, originalBox }] = useState(() => {
    const c = scene.clone(true)
    const b = new THREE.Box3().setFromObject(c)
    return { clone: c, originalBox: b }
  })

  const { scaleX, scaleZ, pX, pY, pZ } = useMemo(() => {
    const sx = innerW / (originalBox.max.x - originalBox.min.x)
    const sz = innerD / (originalBox.max.z - originalBox.min.z)
    const cx = (originalBox.min.x + originalBox.max.x) / 2
    return {
      scaleX: sx,
      scaleZ: sz,
      pX: -cx * sx,
      pY: -originalBox.min.y,
      pZ: WALL - originalBox.min.z * sz,
    }
  }, [originalBox, innerW, innerD])

  useEffect(() => {
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.material = material
      }
    })
  }, [clone, material])

  return (
    <primitive
      object={clone}
      scale={[scaleX, 1, scaleZ]}
      position={[pX, pY, pZ]}
    />
  )
}
