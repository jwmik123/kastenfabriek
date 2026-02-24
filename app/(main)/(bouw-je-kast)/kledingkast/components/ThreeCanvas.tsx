'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three/webgpu'
import { Suspense, useMemo, useState, useEffect } from 'react'
import { useClosetStore } from '../store'
import { MODULE_LAYOUTS, getLayoutById, computeModulePositions } from './moduleLayouts'
import FillZone from './FillZone'
import SpecialElement from './SpecialElement'
import ClosetMaterial, { ClosetMaterialProvider } from './ClosetMaterial'
import PostProcessing from './PostProcessing'

const WALL = 0.018 // 1.8cm panel thickness in meters
const MODULE_WALL = 0.018 // 1.8cm module side panel thickness
const ONDERSTEL_HEIGHT = 0.108 // 108mm onderstel (plinth)
const ONDERSTEL_GAP = 0.010   // 10mm gap between onderstel top and module floor
const ONDERSTEL_FRONT_INSET = 0.064 // 64mm inset from the front
const MODULE_FLOOR_Y = ONDERSTEL_HEIGHT + ONDERSTEL_GAP // 118mm — where modules start

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
  const innerD = depth - WALL - ONDERSTEL_FRONT_INSET

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
    <group position={[0, height / 2, depth / 2]}>
      {/* Back wall */}
      <mesh position={[0, 0, -depth / 2 + WALL / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, WALL]} />
        <ClosetMaterial />
      </mesh>

      {/* Left wall */}
      <mesh position={[-width / 2 + WALL / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL, height, depth]} />
        <ClosetMaterial />
      </mesh>

      {/* Right wall */}
      <mesh position={[width / 2 - WALL / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL, height, depth]} />
        <ClosetMaterial />
      </mesh>

      {/* Top panel */}
      <mesh position={[0, height / 2 - WALL / 2, 0]} castShadow receiveShadow>
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
  const innerD = depth - WALL - ONDERSTEL_FRONT_INSET

  const y = mainH + topH / 2

  return (
    <group position={[0, y, depth / 2 + WALL / 2]}>
      {/* Back */}
      <mesh position={[0, 0, -innerD / 2 + WALL / 2]} castShadow>
        <boxGeometry args={[innerW, topH, WALL]} />
        <ClosetMaterial />
      </mesh>
      {/* Left */}
      <mesh position={[-innerW / 2 + WALL / 2, 0, 0]} castShadow>
        <boxGeometry args={[WALL, topH, innerD]} />
        <ClosetMaterial />
      </mesh>
      {/* Right */}
      <mesh position={[innerW / 2 - WALL / 2, 0, 0]} castShadow>
        <boxGeometry args={[WALL, topH, innerD]} />
        <ClosetMaterial />
      </mesh>
      {/* Top */}
      <mesh position={[0, topH / 2 - WALL / 2, 0]} castShadow>
        <boxGeometry args={[innerW, WALL, innerD]} />
        <ClosetMaterial />
      </mesh>
      {/* Divider between main and top */}
      <mesh position={[0, -topH / 2 + WALL / 2, 0]} castShadow>
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
  const moduleHeight = mh - WALL - (MODULE_FLOOR_Y)
  const moduleDepth = depth - WALL - ONDERSTEL_FRONT_INSET

  const doorRotation = doorsOpen ? Math.PI * -0.65 : 0

  const { specialElementY, fillAbove, fillBelow } = computeModulePositions(layout, moduleHeight)

  // Position this module slot within the closet
  const startX = -innerW / 2
  const x = startX + index * slotW

  // Center offsets for fill zone shelves (relative to this group)
  const centerX = slotW / 2
  const centerZ = moduleDepth / 2

  return (
    <group position={[x, MODULE_FLOOR_Y, WALL]}>
      {/* Special element (GLB) — no Y scaling */}
      <SpecialElement
        layout={layout}
        targetWidth={slotW - MODULE_WALL * 2}
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
      <mesh position={[MODULE_WALL / 2, moduleHeight / 2, centerZ]} castShadow receiveShadow>
        <boxGeometry args={[MODULE_WALL, moduleHeight, moduleDepth]} />
        <ClosetMaterial />
      </mesh>

      {/* Right wall */}
      <mesh position={[slotW - MODULE_WALL / 2, moduleHeight / 2, centerZ]} castShadow receiveShadow>
        <boxGeometry args={[MODULE_WALL, moduleHeight, moduleDepth]} />
        <ClosetMaterial />
      </mesh>
    </group>
  )
}

function ModuleSlotInteraction({ slotIndex }: { slotIndex: number }) {
  const mh = useClosetStore((s) => s.mainHeight()) / 100
  const depth = useClosetStore((s) => s.depth) / 100
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const width = useClosetStore((s) => s.width) / 100
  const selectedSlot = useClosetStore((s) => s.selectedSlot)
  const setSelectedSlot = useClosetStore((s) => s.setSelectedSlot)

  const [hovered, setHovered] = useState(false)

  const innerW = width - WALL * 2
  const slotW = innerW / moduleCount
  const moduleHeight = mh - WALL - (MODULE_FLOOR_Y)
  const moduleDepth = depth - WALL - ONDERSTEL_FRONT_INSET

  const isSelected = selectedSlot === slotIndex

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
    return () => { document.body.style.cursor = 'auto' }
  }, [hovered])

  const opacity = isSelected ? 0.18 : hovered ? 0.32 : 0

  return (
    <group position={[(-innerW / 2) + slotIndex * slotW, MODULE_FLOOR_Y, WALL]}>
      <mesh
        position={[slotW / 2, moduleHeight / 2, moduleDepth + 0.002]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); setSelectedSlot(isSelected ? null : slotIndex) }}
        // layers={1}
      >
        <planeGeometry args={[slotW, moduleHeight]} />
        <meshBasicMaterial
          color="#22c55e"
          transparent={true}
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function SceneEnvironment() {
  const { scene } = useThree()
  useEffect(() => {
    const loader = new THREE.CubeTextureLoader()
    const texture = loader.load([
      '/cubemaps/module-highlight/px.png',
      '/cubemaps/module-highlight/nx.png',
      '/cubemaps/module-highlight/py.png',
      '/cubemaps/module-highlight/ny.png',
      '/cubemaps/module-highlight/pz.png',
      '/cubemaps/module-highlight/nz.png',
    ])
    scene.environment = texture
    return () => {
      texture.dispose()
      scene.environment = null
    }
  }, [scene])
  return null
}

function RaycasterSetup() {
  const { raycaster } = useThree()
  useEffect(() => {
    raycaster.layers.enable(1)
  }, [raycaster])
  return null
}

function OnderstelPlinth() {
  const width = useClosetStore((s) => s.width) / 100
  const depth = useClosetStore((s) => s.depth) / 100
  const { scene } = useGLTF('/objects/onderstel.glb')

  const innerW = width - WALL * 2
  const innerD = depth - WALL - ONDERSTEL_FRONT_INSET

  // Scale to inner closet dimensions, sits on floor (Y=0) between the walls
  // GLTF X → scene X (width), GLTF Z → scene Z (depth)
  // If scaling appears on wrong axis, swap scaleX/scaleZ below
  const { clone, scaleX, scaleZ, pX, pY, pZ } = useMemo(() => {
    const c = scene.clone(true)
    const box = new THREE.Box3().setFromObject(c)
    const sx = innerW / (box.max.x - box.min.x)
    const sz = innerD / (box.max.z - box.min.z)
    const cx = (box.min.x + box.max.x) / 2
    return {
      clone: c,
      scaleX: sx,
      scaleZ: sz,
      pX: -cx * sx,              // center in scene X
      pY: -box.min.y,            // bottom of plate sits on floor (Y=0)
      pZ: WALL - box.min.z * sz, // back face aligns with interior back wall (Z=WALL)
    }
  }, [scene, innerW, innerD])

  return (
    <primitive
      object={clone}
      scale={[scaleX, 1, scaleZ]}
      position={[pX, pY, pZ]}
    />
  )
}

function ClosetScene() {
  const modules = useClosetStore((s) => s.modules)

  return (
    <ClosetMaterialProvider>
      <ClosetCorpus />
      <TopCabinet />
      <OnderstelPlinth />
      {/* <FloorGrid /> */}
      {modules
        .filter((m) => m.layoutId !== null)
        .map((m) => (
          <Module key={m.slotIndex} index={m.slotIndex} layoutId={m.layoutId!} />
        ))}
      {modules.map((m) => (
        <ModuleSlotInteraction key={`hit-${m.slotIndex}`} slotIndex={m.slotIndex} />
      ))}
    </ClosetMaterialProvider>
  )
}

export default function ThreeCanvas() {
  const doorsOpen = useClosetStore((s) => s.doorsOpen)
  const toggleDoors = useClosetStore((s) => s.toggleDoors)
  const setSelectedSlot = useClosetStore((s) => s.setSelectedSlot)

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0.8, 1.6, 5], fov: 45 }}
        shadows
        frameloop="demand"
        onPointerMissed={() => setSelectedSlot(null)}
        gl={async (props: any) => {
          const renderer = new THREE.WebGPURenderer({
            ...props,
            // forceWebGL: true,
          })
        
          return renderer.init();
        }}
      >
        {/* <axesHelper args={[5]} /> */}

        <color attach="background" args={['#e8e8e8']} />
        <SceneEnvironment />
        {/* <ambientLight intensity={0} /> */}
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
        
        <RaycasterSetup />
        {/* <PostProcessing /> */}
        <Suspense>
          <ClosetScene />
        </Suspense>
        {/* Back wall plane to receive shadows — sits just behind closet back (Z=0) */}
        <mesh rotation={[0, 0, 0]} position={[0, 0, -0.01]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#fafafa" />

        </mesh>
                {/* Floor plane to receive shadows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#fafafa" />
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

useGLTF.preload('/objects/onderstel.glb')
