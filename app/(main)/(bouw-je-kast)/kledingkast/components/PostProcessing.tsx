'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three/webgpu'
import { pass, mrt, output, normalView, toneMapping } from 'three/tsl'
import { ao } from 'three/addons/tsl/display/GTAONode.js'
import { useThree, useFrame } from '@react-three/fiber'

export default function PostProcessing() {
  const { gl, scene, camera } = useThree()
  const ppRef = useRef<THREE.PostProcessing | null>(null)

  useEffect(() => {
    if (!(gl as any).isWebGPURenderer) return

    const renderer = gl as unknown as THREE.WebGPURenderer
    const postProcessing = new THREE.PostProcessing(renderer)

    // 1. MRT Setup
    const scenePass = pass(scene, camera)
    scenePass.setMRT(mrt({
      output: output,
      normal: normalView,
    }))

    const scenePassColor = scenePass.getTextureNode('output')
    const scenePassNormal = scenePass.getTextureNode('normal')
    const scenePassDepth = scenePass.getTextureNode('depth')

    // 2. AO Setup
    const aoPass = ao(scenePassDepth, scenePassNormal, camera)

    aoPass.thickness.value = 0.5 
    aoPass.radius.value = 0.15
    aoPass.scale.value = 1.0
    aoPass.distanceFallOff.value = 1.0
    aoPass.resolutionScale = 0.5

    // console.log(aoPass);

    const aoColor = scenePassColor.mul(aoPass.r)

    // 3. Final Output
    postProcessing.outputNode = toneMapping(
      THREE.ACESFilmicToneMapping,
      1.0,
      aoColor
    )

    // postProcessing.outputNode = aoColor;

    ppRef.current = postProcessing

    return () => {
      postProcessing.dispose()
      ppRef.current = null
    }
  }, [gl, scene, camera])

  useFrame(() => {
    ppRef.current?.render()
  }, 1)

  return null
}