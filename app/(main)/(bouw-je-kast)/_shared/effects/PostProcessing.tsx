'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three/webgpu'
import {
  pass, mrt, output, diffuseColor, normalView,
  directionToColor, colorToDirection, add, vec4,
} from 'three/tsl'
import { ssgi } from 'three/addons/tsl/display/SSGINode.js'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import { UnsignedByteType } from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { useClosetStore } from '../../kledingkast/store'

export default function PostProcessing() {
  const { gl, scene, camera } = useThree()
  const ppRef             = useRef<THREE.PostProcessing | null>(null)
  const giIntensityRef    = useRef<{ value: number } | null>(null)
  const bloomStrengthRef  = useRef<{ value: number } | null>(null)
  const lightStripsEnabled = useClosetStore((s) => s.lightStripsEnabled)
  const doorsOpen          = useClosetStore((s) => s.doorsOpen)

  // Rebuild the entire post-processing pipeline when lightStripsEnabled changes.
  // OFF pipeline: baseline composition (raw ao, no bloom, giIntensity=0.3 fixed).
  // ON  pipeline: warmth composition (aoLifted, bloom node, giIntensity controlled by doorsOpen).
  useEffect(() => {
    if (!(gl as any).isWebGPURenderer) return

    const renderer = gl as unknown as THREE.WebGPURenderer

    const origRender = renderer.render.bind(renderer)
    ;(renderer as any).render = (...args: Parameters<typeof origRender>) => {
      try { return origRender(...args) } catch(e) { console.error('[PostProcessing] origRender threw:', e) }
    }

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

    const sceneNormal = {
      sample: (uv: unknown) => colorToDirection((scenePassNormal as any).sample(uv)),
    }

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

    const gi = giPass.rgb
    const ao = giPass.a

    let outputNode: ReturnType<typeof vec4>

    if (lightStripsEnabled) {
      // WARMTH PIPELINE — aoLifted remap + bloom; giIntensity driven by doorsOpen ref
      giIntensityRef.current   = giPass.giIntensity
      const bloomPass = bloom(scenePassColor, 0, 0.35, 1.2)
      bloomStrengthRef.current = bloomPass.strength

      // Remap ao → [0.5, 1.0] so interior panels stay visible under SSGI occlusion
      const aoLifted = ao.mul(0.5).add(0.5)
      const composited = add(scenePassColor.rgb.mul(aoLifted), scenePassDiffuse.rgb.mul(gi))
      outputNode = vec4(add(composited, bloomPass.rgb), scenePassColor.a)
    } else {
      // BASELINE PIPELINE — raw ao, no bloom node, giIntensity fixed at 0.3
      giIntensityRef.current   = null
      bloomStrengthRef.current = null

      const composited = add(scenePassColor.rgb.mul(ao), scenePassDiffuse.rgb.mul(gi))
      outputNode = vec4(composited, scenePassColor.a)
    }

    const postProcessing = new THREE.PostProcessing(renderer)
    postProcessing.outputNode = outputNode
    ppRef.current = postProcessing

    return () => {
      renderer.render = origRender
      postProcessing.dispose()
      ppRef.current = null
      giIntensityRef.current   = null
      bloomStrengthRef.current = null
    }
  }, [gl, scene, camera, lightStripsEnabled])

  // Adjust GI intensity and bloom strength based on doors state (warmth pipeline only)
  useEffect(() => {
    if (!lightStripsEnabled) return
    const lightsActive = doorsOpen
    if (giIntensityRef.current)   giIntensityRef.current.value   = lightsActive ? 0.7 : 0.3
    if (bloomStrengthRef.current) bloomStrengthRef.current.value = lightsActive ? 0.4 : 0
  }, [lightStripsEnabled, doorsOpen])

  useFrame(() => {
    const pp = ppRef.current
    if (!pp) return
    ;(gl as unknown as THREE.WebGPURenderer).setClearAlpha(0)
    try {
      pp.render()
    } catch(e) {
      console.error('[PostProcessing] pp.render() threw:', e)
    }
  }, 1)

  return null
}
