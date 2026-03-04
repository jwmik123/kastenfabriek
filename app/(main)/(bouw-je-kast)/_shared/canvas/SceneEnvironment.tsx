'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'

export default function SceneEnvironment() {
  const { scene } = useThree()
  useEffect(() => {
    const loader = new HDRLoader()
    let cancelled = false

    loader.loadAsync('/hdr.hdr').then((envMap) => {
      if (cancelled) {
        envMap.dispose()
        return
      }
      envMap.mapping = THREE.EquirectangularReflectionMapping
      scene.environment = envMap
      scene.environmentRotation = new THREE.Euler(Math.PI / 2, 0, 0)
    })

    return () => {
      cancelled = true
      scene.environment = null
    }
  }, [scene])

  return null
}
