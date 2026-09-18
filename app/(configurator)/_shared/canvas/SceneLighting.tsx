'use client'

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'

// Living-room light rig: soft daylight key from front-left above the cabinet, cool rim
// from back-right, ambient from the HDRI (no hemisphere fill). Intensities are
// scaled for NoToneMapping so the light walls never clip.
const KEY = { color: '#fffaf4', intensity: 0.8, position: [-1.8, 3.5, 2.4] as const }
// Low and behind the back wall (walls cast no shadow): grazes the floor towards the camera,
// which is what puts the soft sheen on the floor finish.
const RIM = { color: '#eef3ff', intensity: 0.55, position: [0.4, 2.6, -3.2] as const }
const TARGET: readonly [number, number, number] = [0, 1.2, 0.3]

function useAimAtTarget(ref: React.RefObject<THREE.DirectionalLight | null>) {
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const light = ref.current
    if (!light) return
    light.target.position.set(...TARGET)
    scene.add(light.target)
    return () => {
      scene.remove(light.target)
    }
  }, [ref, scene])
}

export default function SceneLighting({ shadowMapSize }: { shadowMapSize: number }) {
  const keyRef = useRef<THREE.DirectionalLight>(null)
  const rimRef = useRef<THREE.DirectionalLight>(null)
  useAimAtTarget(keyRef)
  useAimAtTarget(rimRef)

  return (
    <group name="lights">
      <directionalLight
        ref={keyRef}
        color={KEY.color}
        intensity={KEY.intensity}
        position={KEY.position}
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={0.3}
        shadow-camera-far={12}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-radius={4}
      />
      <directionalLight ref={rimRef} color={RIM.color} intensity={RIM.intensity} position={RIM.position} />
    </group>
  )
}
