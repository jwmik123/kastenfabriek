'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three/webgpu'
import {
  pass, mrt, output, diffuseColor, normalView,
  directionToColor, colorToDirection, add, vec4,
  uniform, mix,
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
  const aoBlendRef        = useRef<{ value: number } | null>(null)
  const lightStripsEnabled = useClosetStore((s) => s.lightStripsEnabled)
  const doorsOpen          = useClosetStore((s) => s.doorsOpen)

  // Rebuild the entire post-processing pipeline when lightStripsEnabled changes.
  // OFF pipeline: baseline composition (raw ao, no bloom, giIntensity=0.3 fixed).
  // ON  pipeline: warmth composition (bloom node; giIntensity/aoBlend/bloomStrength controlled by doorsOpen).
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
      // WARMTH PIPELINE — bloom; giIntensity and aoBlend driven by doorsOpen ref.
      // aoBlend=0 (doors closed) → raw ao = pre-warmth baseline.
      // aoBlend=1 (doors open, strips illuminating) → aoLifted remap.
      giIntensityRef.current   = giPass.giIntensity
      const bloomPass = bloom(scenePassColor, 0, 0.35, 1.2)
      bloomStrengthRef.current = bloomPass.strength

      const aoBlend  = uniform(0.0)
      aoBlendRef.current = aoBlend
      const aoLifted = ao.mul(0.5).add(0.5)
      const aoFinal  = mix(ao, aoLifted, aoBlend)
      // GI color only added in warmth pipeline, scaled by aoBlend so it only
      // activates when strips are on (doors open). Avoids double-ambient on IBL.
      const giScaled = scenePassDiffuse.rgb.mul(gi).mul(aoBlend)
      const composited = add(scenePassColor.rgb.mul(aoFinal), giScaled)
      outputNode = vec4(add(composited, bloomPass.rgb), scenePassColor.a)
    } else {
      // BASELINE PIPELINE — AO darkening only. No GI color added: scenePassColor already
      // contains IBL from the environment map. Adding diffuse×gi on top = double ambient.
      giIntensityRef.current   = null
      bloomStrengthRef.current = null
      aoBlendRef.current       = null

      outputNode = vec4(scenePassColor.rgb.mul(ao), scenePassColor.a)
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
      aoBlendRef.current       = null
    }
  }, [gl, scene, camera, lightStripsEnabled])

  // Adjust GI intensity, bloom strength, and AO remap based on doors state (warmth pipeline only)
  useEffect(() => {
    if (!lightStripsEnabled) return
    const lightsActive = doorsOpen
    if (giIntensityRef.current)   giIntensityRef.current.value   = lightsActive ? 0.7 : 0.3
    if (bloomStrengthRef.current) bloomStrengthRef.current.value = lightsActive ? 0.4 : 0
    if (aoBlendRef.current)       aoBlendRef.current.value       = lightsActive ? 1.0 : 0.0
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
