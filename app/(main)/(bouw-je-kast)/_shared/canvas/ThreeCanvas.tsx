'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { useEffect, useRef, type ReactNode } from 'react'
import SceneEnvironment from './SceneEnvironment'
import Stats from 'stats.js'

function StatsPanel() {
  const statsRef = useRef<Stats | null>(null)
  useEffect(() => {
    if (window.innerWidth < 768) return
    const stats = new Stats()
    document.body.appendChild(stats.dom)
    statsRef.current = stats
    return () => {
      if (statsRef.current) document.body.removeChild(statsRef.current.dom)
    }
  }, [])
  useFrame(() => statsRef.current?.update())
  return null
}

interface ThreeCanvasProps {
  children: ReactNode
  onPointerMissed?: () => void
}

/**
 * Base canvas wrapper shared across all configurators.
 * Sets up: WebGPU renderer, camera, directional light, HDR environment.
 * Scene-specific content (controls, objects, overlays) goes in children.
 */
export default function ThreeCanvas({ children, onPointerMissed }: ThreeCanvasProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.6, 3], fov: 55 }}
      shadows
      onPointerMissed={onPointerMissed}
      gl={async (props: any) => {
        const renderer = new THREE.WebGPURenderer({ ...props, powerPreference: 'high-performance' })
        return renderer.init()
      }}
    >
      <color attach="background" args={['#e8e8e8']} />
      <SceneEnvironment />
      
      {process.env.NODE_ENV === 'development' && <StatsPanel />}
      <directionalLight
        position={[-3, 5, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={4}
        shadow-camera-bottom={-1}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      {children}
    </Canvas>
  )
}
