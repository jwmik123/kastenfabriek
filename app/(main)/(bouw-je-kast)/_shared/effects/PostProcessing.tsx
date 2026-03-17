'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three/webgpu'
import {
  pass, mrt, output, diffuseColor, normalView,
  directionToColor, colorToDirection, add, vec4,
} from 'three/tsl'
import { ssgi } from 'three/addons/tsl/display/SSGINode.js'
import { UnsignedByteType } from 'three'
import { useThree, useFrame } from '@react-three/fiber'

export default function PostProcessing() {
  const { gl, scene, camera } = useThree()
  const ppRef = useRef<THREE.PostProcessing | null>(null)

  useEffect(() => {
    if (!(gl as any).isWebGPURenderer) return

    const renderer = gl as unknown as THREE.WebGPURenderer

    // 1. MRT — no velocity needed without TRAA
    const scenePass = pass(scene, camera)
    scenePass.setMRT(mrt({
      output,
      diffuseColor,
      normal: directionToColor(normalView),
    }))

    scenePass.getTexture('normal').type = UnsignedByteType
    scenePass.getTexture('diffuseColor').type = UnsignedByteType

    const scenePassColor   = scenePass.getTextureNode('output')
    const scenePassDepth   = scenePass.getTextureNode('depth')
    const scenePassDiffuse = scenePass.getTextureNode('diffuseColor')
    const scenePassNormal  = scenePass.getTextureNode('normal')

    // 2. Normal decode
    const sceneNormal = {
      sample: (uv: unknown) => colorToDirection((scenePassNormal as any).sample(uv)),
    }

    // 3. SSGI — 1×6 spp, temporal filtering accumulates quality over frames
    const giPass = ssgi(
      scenePassColor,
      scenePassDepth,
      sceneNormal as any,
      camera as THREE.PerspectiveCamera,
    )
    giPass.sliceCount.value             = 1
    giPass.stepCount.value              = 6
    giPass.radius.value                 = 0.25
    giPass.expFactor.value              = 1.2
    giPass.thickness.value              = 0.15
    giPass.backfaceLighting.value       = 0.1
    giPass.aoIntensity.value            = 1.0
    giPass.giIntensity.value            = 0.3
    giPass.useLinearThickness.value     = true
    giPass.useScreenSpaceSampling.value = true
    giPass.useTemporalFiltering         = true

    // 4. Composite
    const gi = giPass.rgb
    const ao = giPass.a

    const finalOutput = vec4(
      add(scenePassColor.rgb.mul(ao), scenePassDiffuse.rgb.mul(gi)),
      scenePassColor.a,
    )

    const postProcessing = new THREE.PostProcessing(renderer)
    postProcessing.outputNode = finalOutput
    ppRef.current = postProcessing

    return () => {
      postProcessing.dispose()
      ppRef.current = null
    }
  }, [gl, scene, camera])

  useFrame(() => {
    const pp = ppRef.current
    if (!pp) return
    ;(gl as unknown as THREE.WebGPURenderer).setClearAlpha(0)
    pp.render()
  }, 1)

  return null
}
