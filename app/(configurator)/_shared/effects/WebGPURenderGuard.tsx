'use client'

import { useEffect } from 'react'
import * as THREE from 'three/webgpu'
import { useThree } from '@react-three/fiber'

/**
 * Patches renderer.render() with a try-catch to suppress the
 * "Cannot read properties of undefined (reading 'version')" crash that
 * occurs when React 18 concurrent mode adds new geometry to the scene
 * mid-frame before WebGPU has initialized its GPU buffers.
 * The next frame renders correctly once buffers are ready.
 */
export default function WebGPURenderGuard() {
  const { gl } = useThree()

  useEffect(() => {
    if (!(gl as any).isWebGPURenderer) return

    const renderer = gl as unknown as THREE.WebGPURenderer
    const origRender = renderer.render.bind(renderer)
    ;(renderer as any).render = (...args: Parameters<typeof origRender>) => {
      try { return origRender(...args) } catch { /* skip frame — buffers not ready */ }
    }

    return () => {
      renderer.render = origRender
    }
  }, [gl])

  return null
}
