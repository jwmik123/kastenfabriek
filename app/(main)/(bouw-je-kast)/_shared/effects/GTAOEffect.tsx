'use client'

import { useThree, useFrame } from '@react-three/fiber'
import { useMemo, useEffect } from 'react'
import { PostProcessing } from 'three/webgpu'
import { pass, mrt, output, normalView } from 'three/tsl'
import { ao } from 'three/addons/tsl/display/GTAONode.js'

export default function GTAOEffect() {
  const { gl, scene, camera } = useThree()

  const { pp, aoPass } = useMemo(() => {
    const postProcessing = new PostProcessing(gl as any)

    const scenePass = pass(scene, camera)
    scenePass.setMRT(mrt({
      output: output,
      normal: normalView,
    }))

    const scenePassColor = scenePass.getTextureNode('output')
    const scenePassDepth = scenePass.getTextureNode('depth')
    const scenePassNormal = scenePass.getTextureNode('normal')

    const aoPass = ao(scenePassDepth, scenePassNormal, camera)
    aoPass.resolutionScale       = 0.5
    aoPass.useTemporalFiltering  = false
    aoPass.radius.value          = 0.2
    aoPass.thickness.value       = 1
    aoPass.distanceFallOff.value = 2
    aoPass.scale.value           = 2
    aoPass.samples.value         = 8

    postProcessing.outputNode = scenePassColor.mul(aoPass.getTextureNode().r)

    return { pp: postProcessing, aoPass }
  }, [gl, scene, camera])

  useEffect(() => {
    const previousRenderMode = gl.render
    return () => { gl.render = previousRenderMode }
  }, [gl])

  useFrame(({ camera }) => {
    const node = aoPass as any
    node._cameraProjectionMatrix.value.copy(camera.projectionMatrix)
    node._cameraProjectionMatrixInverse.value.copy(camera.projectionMatrixInverse)
    node._cameraProjectionMatrix.needsUpdate = true
    node._cameraProjectionMatrixInverse.needsUpdate = true
    pp.render()
  }, 1)

  return null
}
