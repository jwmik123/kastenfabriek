'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { useEffect, useRef, type ReactNode } from 'react'
import SceneEnvironment from './SceneEnvironment'
import SceneLighting from './SceneLighting'
import { isLowPowerDevice } from './devicePower'
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
 * Sets up: WebGPU renderer, camera, living-room light rig, HDR environment.
 * Scene-specific content (controls, objects, overlays) goes in children.
 */
export default function ThreeCanvas({ children, onPointerMissed }: ThreeCanvasProps) {
  // Phones/tablets get a lighter render path: capped DPR and smaller shadow
  // maps. Client-only component (dynamic ssr:false), so this is stable.
  const lowPower = isLowPowerDevice()
  return (
    <Canvas
      dpr={lowPower ? [1, 1.5] : [1, 2]}
      camera={{ position: [0, 1.6, 3], fov: 55 }}
      shadows
      onPointerMissed={onPointerMissed}
      gl={async (props: any) => {
        const renderer = new THREE.WebGPURenderer({ ...props, powerPreference: 'high-performance' })
        await renderer.init()
        renderer.toneMapping = THREE.NoToneMapping
        renderer.toneMappingExposure = 1
        return renderer
      }}
    >
      <color attach="background" args={['#f1efeb']} />
      <SceneEnvironment />

      {process.env.NODE_ENV === 'development' && <StatsPanel />}
      <SceneLighting shadowMapSize={lowPower ? 1024 : 2048} />
      {children}
    </Canvas>
  )
}
