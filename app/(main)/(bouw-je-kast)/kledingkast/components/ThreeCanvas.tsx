'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three/webgpu'
import { Suspense, useMemo } from 'react'
import { useClosetStore } from '../store'
import { MODULE_LAYOUTS, getLayoutById, computeModulePositions } from './moduleLayouts'
import FillZone from './FillZone'
import SpecialElement from './SpecialElement'
import ClosetMaterial, { ClosetMaterialProvider } from './ClosetMaterial'

const WALL = 0.018 // 5cm wall thickness in meters
const MODULE_WALL = 0.018 // 2.5cm module side panel thickness

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

  return (
    <group position={[0, height / 2, 0]}>
      {/* Back wall */}
      <mesh position={[0, 0, -depth / 2 + WALL / 2]} castShadow>
        <boxGeometry args={[width, height, WALL]} />
        <ClosetMaterial />
      </mesh>

      {/* Left wall */}
      <mesh position={[-width / 2 + WALL / 2, 0, 0]} castShadow>
        <boxGeometry args={[WALL, height, depth]} />
        <ClosetMaterial />
      </mesh>

      {/* Right wall */}
      <mesh position={[width / 2 - WALL / 2, 0, 0]} castShadow>
        <boxGeometry args={[WALL, height, depth]} />
        <ClosetMaterial />
      </mesh>

      {/* Top panel */}
      <mesh position={[0, height / 2 - WALL / 2, 0]} castShadow>
        <boxGeometry args={[width, WALL, depth]} />
        <ClosetMaterial />
      </mesh>

      {/* Bottom panel */}
      <mesh position={[0, -height / 2 + WALL / 2, 0]} castShadow>
        <boxGeometry args={[width, WALL, depth]} />
        <ClosetMaterial />
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

  // Inner dimensions - fits inside the main closet walls
  const innerW = width - WALL * 2
  const innerD = depth - WALL

  const y = mainH + topH / 2

  return (
    <group position={[0, y, WALL / 2]}>
      {/* Back */}
      <mesh position={[0, 0, -innerD / 2 + WALL / 2]}>
        <boxGeometry args={[innerW, topH, WALL]} />
        <ClosetMaterial />
      </mesh>
      {/* Left */}
      <mesh position={[-innerW / 2 + WALL / 2, 0, 0]}>
        <boxGeometry args={[WALL, topH, innerD]} />
        <ClosetMaterial />
      </mesh>
      {/* Right */}
      <mesh position={[innerW / 2 - WALL / 2, 0, 0]}>
        <boxGeometry args={[WALL, topH, innerD]} />
        <ClosetMaterial />
      </mesh>
      {/* Top */}
      <mesh position={[0, topH / 2 - WALL / 2, 0]}>
        <boxGeometry args={[innerW, WALL, innerD]} />
        <ClosetMaterial />
      </mesh>
      {/* Divider between main and top */}
      <mesh position={[0, -topH / 2 + WALL / 2, 0]}>
        <boxGeometry args={[innerW, WALL, innerD]} />
        <ClosetMaterial />
      </mesh>
    </group>
  )
}

function Module({ index, layoutId }: { index: number; layoutId: number }) {
  const mh = useClosetStore((s) => s.mainHeight()) / 100
  const depth = useClosetStore((s) => s.depth) / 100
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const width = useClosetStore((s) => s.width) / 100
  const doorsOpen = useClosetStore((s) => s.doorsOpen)

  const layout = getLayoutById(layoutId)
  if (!layout) return null

  const innerW = width - WALL * 2
  const slotW = innerW / moduleCount
  const moduleHeight = mh - WALL * 2
  const moduleDepth = depth - WALL

  const doorRotation = doorsOpen ? Math.PI * -0.65 : 0

  const { specialElementY, fillAbove, fillBelow } = computeModulePositions(layout, moduleHeight)

  // Position this module slot within the closet
  const startX = -innerW / 2
  const x = startX + index * slotW

  // Center offsets for fill zone shelves (relative to this group)
  const centerX = slotW / 2
  const centerZ = moduleDepth / 2

  return (
    <group position={[x, WALL, -depth / 2 + WALL]}>
      {/* Special element (GLB) — no Y scaling */}
      <SpecialElement
        layout={layout}
        targetWidth={slotW}
        targetDepth={moduleDepth}
        positionY={specialElementY}
        doorRotation={doorRotation}
      />

      {/* Fill zone above special element */}
      {fillAbove.end > fillAbove.start && (
        <FillZone
          config={layout.fillZone.above}
          startY={fillAbove.start}
          endY={fillAbove.end}
          width={slotW}
          depth={moduleDepth}
          centerX={centerX}
          centerZ={centerZ}
        />
      )}

      {/* Fill zone below special element */}
      {fillBelow.end > fillBelow.start && (
        <FillZone
          config={layout.fillZone.below}
          startY={fillBelow.start}
          endY={fillBelow.end}
          width={slotW}
          depth={moduleDepth}
          centerX={centerX}
          centerZ={centerZ}
        />
      )}

      {/* Left wall */}
      <mesh position={[MODULE_WALL / 2, moduleHeight / 2, centerZ]}>
        <boxGeometry args={[MODULE_WALL, moduleHeight, moduleDepth]} />
        <ClosetMaterial />
      </mesh>

      {/* Right wall */}
      <mesh position={[slotW - MODULE_WALL / 2, moduleHeight / 2, centerZ]}>
        <boxGeometry args={[MODULE_WALL, moduleHeight, moduleDepth]} />
        <ClosetMaterial />
      </mesh>
    </group>
  )
}

function ClosetScene() {
  const modules = useClosetStore((s) => s.modules)

  return (
    <ClosetMaterialProvider>
      <ClosetCorpus />
      <TopCabinet />
      <FloorGrid />
      {modules
        .filter((m) => m.layoutId !== null)
        .map((m) => (
          <Module key={m.slotIndex} index={m.slotIndex} layoutId={m.layoutId!} />
        ))}
    </ClosetMaterialProvider>
  )
}

export default function ThreeCanvas() {
  const doorsOpen = useClosetStore((s) => s.doorsOpen)
  const toggleDoors = useClosetStore((s) => s.toggleDoors)

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0.8, 1.6, 5], fov: 45 }}
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
              <axesHelper args={[5]} />

        <color attach="background" args={['#e8e8e8']} />
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-3}
          shadow-camera-right={3}
          shadow-camera-top={4}
          shadow-camera-bottom={-1}
          shadow-camera-near={0.5}
          shadow-camera-far={20}
        />
        <Suspense>
          <ClosetScene />
        </Suspense>
        {/* Floor plane to receive shadows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.35} />
        </mesh>
        <OrbitControls
          target={[0.4, 1, 0]}
          minDistance={2}
          maxDistance={8}
          maxPolarAngle={Math.PI / 2}
          enablePan={false}
        />
      </Canvas>
      <button
        onClick={toggleDoors}
        className="absolute top-4 left-4 px-4 py-2 bg-white rounded-lg shadow-md text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200"
      >
        {doorsOpen ? 'Sluit deuren' : 'Open deuren'}
      </button>
    </div>
  )
}

// Preload all module GLBs that have a glbPath
MODULE_LAYOUTS.forEach((layout) => {
  if (layout.specialElement.glbPath) {
    useGLTF.preload(layout.specialElement.glbPath)
  }
})
