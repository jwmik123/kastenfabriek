'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three/webgpu'
import { useMemo } from 'react'
import { useClosetStore } from '../store'

const MODEL_PATH = '/objects/module1.glb'
const WALL = 0.05 // 5cm wall thickness in meters

// The original model bounding box (from glb metadata)
const BASE_WIDTH = 0.575
const BASE_HEIGHT = 2.036
const BASE_DEPTH = 0.6

function createGridTexture(moduleCount: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  const w = 1024
  const h = 256
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Base color
  ctx.fillStyle = '#b8b0a4'
  ctx.fillRect(0, 0, w, h)

  // Vertical lines at module boundaries
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  for (let i = 0; i <= moduleCount; i++) {
    const x = (i / moduleCount) * w
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

function FloorGrid() {
  const width = useClosetStore((s) => s.width) / 100
  const depth = useClosetStore((s) => s.depth) / 100
  const moduleCount = useClosetStore((s) => s.moduleCount)

  const innerW = width - WALL * 2
  const innerD = depth - WALL

  const texture = useMemo(() => createGridTexture(moduleCount), [moduleCount])

  return (
    <mesh
      position={[0, WALL + 0.001, WALL / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[innerW, innerD]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}

function ClosetCorpus() {
  const width = useClosetStore((s) => s.width) / 100
  const height = useClosetStore((s) => s.height) / 100
  const depth = useClosetStore((s) => s.depth) / 100

  const color = '#d4cfc9'

  return (
    <group position={[0, height / 2, 0]}>
      {/* Back wall */}
      <mesh position={[0, 0, -depth / 2 + WALL / 2]}>
        <boxGeometry args={[width, height, WALL]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-width / 2 + WALL / 2, 0, 0]}>
        <boxGeometry args={[WALL, height, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Right wall */}
      <mesh position={[width / 2 - WALL / 2, 0, 0]}>
        <boxGeometry args={[WALL, height, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Top panel */}
      <mesh position={[0, height / 2 - WALL / 2, 0]}>
        <boxGeometry args={[width, WALL, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Bottom panel */}
      <mesh position={[0, -height / 2 + WALL / 2, 0]}>
        <boxGeometry args={[width, WALL, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

function TopCabinet() {
  const needsTop = useClosetStore((s) => s.needsTopCabinet())
  const topH = useClosetStore((s) => s.topCabinetHeight()) / 100
  const mainH = useClosetStore((s) => s.mainHeight()) / 100
  const width = useClosetStore((s) => s.width) / 100
  const depth = useClosetStore((s) => s.depth) / 100

  if (!needsTop) return null

  const color = '#c4b59d'
  const y = mainH + topH / 2

  return (
    <group position={[0, y, 0]}>
      {/* Back */}
      <mesh position={[0, 0, -depth / 2 + WALL / 2]}>
        <boxGeometry args={[width, topH, WALL]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Left */}
      <mesh position={[-width / 2 + WALL / 2, 0, 0]}>
        <boxGeometry args={[WALL, topH, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Right */}
      <mesh position={[width / 2 - WALL / 2, 0, 0]}>
        <boxGeometry args={[WALL, topH, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Top */}
      <mesh position={[0, topH / 2 - WALL / 2, 0]}>
        <boxGeometry args={[width, WALL, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Divider between main and top */}
      <mesh position={[0, -topH / 2 + WALL / 2, 0]}>
        <boxGeometry args={[width, WALL, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

function Module({ index }: { index: number }) {
  const { scene } = useGLTF(MODEL_PATH)
  const mh = useClosetStore((s) => s.mainHeight()) / 100
  const depth = useClosetStore((s) => s.depth) / 100
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const width = useClosetStore((s) => s.width) / 100

  const clone = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((child) => {
      child.position.set(0, 0, 0)
    })
    return c
  }, [scene])

  const innerW = width - WALL * 2
  const slotW = innerW / moduleCount

  // Model is rotated -90° around Y, so X↔Z are swapped
  const scaleX = (depth - WALL) / BASE_WIDTH
  const scaleY = (mh - WALL * 2) / BASE_HEIGHT
  const scaleZ = slotW / BASE_DEPTH

  const startX = -innerW / 2 + slotW
  const x = startX + index * slotW

  return (
    <primitive
      object={clone}
      scale={[scaleX, scaleY, scaleZ]}
      position={[x, WALL, -depth / 2 + WALL]}
      rotation={[0, -Math.PI / 2, 0]}
    />
  )
}

function ClosetScene() {
  const modules = useClosetStore((s) => s.modules)

  return (
    <group>
      <ClosetCorpus />
      <TopCabinet />
      <FloorGrid />
      {modules
        .filter((m) => m.layoutId !== null)
        .map((m) => (
          <Module key={m.slotIndex} index={m.slotIndex} />
        ))}
    </group>
  )
}

export default function ThreeCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 4], fov: 45 }}
      shadows
      gl={async (props: any) => {
        const renderer = new THREE.WebGPURenderer({
          ...props,
          forceWebGL: true,
        })
        await renderer.init()
        return renderer
      }}
    >
      <color attach="background" args={['#e8e8e8']} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1} />
      <ClosetScene />
      <OrbitControls
        target={[0, 1, 0]}
        minDistance={2}
        maxDistance={8}
        enablePan={false}
      />
    </Canvas>
  )
}

useGLTF.preload(MODEL_PATH)
