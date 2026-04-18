'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'

export default function SceneEnvironment() {
  const { gl, scene } = useThree()

  useEffect(() => {
    const loader = new HDRLoader()
    let cancelled = false
    let envMap: THREE.Texture | null = null

    loader.loadAsync('/hdr.hdr').then((texture) => {
      if (cancelled) {
        texture.dispose()
        return
      }
      texture.mapping = THREE.EquirectangularReflectionMapping

      const pmrem = new THREE.PMREMGenerator(gl as any)
      pmrem.compileEquirectangularShader()
      envMap = pmrem.fromEquirectangular(texture).texture

      scene.environment = envMap
      scene.environmentRotation = new THREE.Euler(Math.PI / 2, 0, 0)

      texture.dispose()
      pmrem.dispose()
    })

    // Delayed audit — fires 5s after mount to confirm env is set post-load
    const auditTimer = setTimeout(() => {
      const r = gl as any
      const s = scene as any
      console.log('BRIGHTNESS AUDIT (post-load)', {
        toneMapping: r.toneMapping,
        toneMappingExposure: r.toneMappingExposure,
        environmentIntensity: s.environmentIntensity,
        hasEnvironment: !!scene.environment,
        envMapping: scene.environment?.mapping,
        envIsRenderTargetTexture: (scene.environment as any)?.isRenderTargetTexture,
        directionalLights: scene.children
          .filter((c: any) => c.isDirectionalLight)
          .map((c: any) => ({ intensity: c.intensity })),
      })
    }, 5000)

    return () => {
      cancelled = true
      clearTimeout(auditTimer)
      if (envMap) envMap.dispose()
      scene.environment = null
    }
  }, [gl, scene])

  return null
}
