'use client'

import { useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { useWasmachinekastStore } from '../store'

export default function WasmRoomWalls() {
  const widthCm = useWasmachinekastStore((s) => s.width)
  const heightCm = useWasmachinekastStore((s) => s.height)
  const depthCm = useWasmachinekastStore((s) => s.depth)

  const W = widthCm / 100
  const H = heightCm / 100
  const D = depthCm / 100
  const T = 0.01
  const RF = W * 4

  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, metalness: 0, side: THREE.FrontSide }),
    [],
  )
  const floorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, metalness: 0 }),
    [],
  )

  return (
    <group>
      <mesh position={[-W / 2 - T / 2, H / 2, (D + RF - T) / 2]} material={wallMat}>
        <boxGeometry args={[T, H, D + T + RF]} />
      </mesh>
      <mesh position={[W / 2 + T / 2, H / 2, (D + RF - T) / 2]} material={wallMat}>
        <boxGeometry args={[T, H, D + T + RF]} />
      </mesh>
      <mesh position={[0, H / 2, -T / 2]} material={wallMat}>
        <boxGeometry args={[W, H, T]} />
      </mesh>
      <mesh position={[0, -T / 2, (D + RF - T) / 2]} receiveShadow castShadow={false}>
        <boxGeometry args={[W + 2 * T, T, D + T + RF]} />
        <primitive object={floorMat} attach="material" />
      </mesh>
      <mesh position={[0, H + T / 2, (D + RF - T) / 2]} material={wallMat}>
        <boxGeometry args={[W + 2 * T, T, D + T + RF]} />
      </mesh>
    </group>
  )
}
