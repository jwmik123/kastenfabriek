'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

import { OrbitControls, useGLTF, useTexture, useProgress } from '@react-three/drei'
import * as THREE from 'three/webgpu'
import { Suspense, useMemo, useState, useEffect, useRef } from 'react'
import { useClosetStore } from '../store'
import { MODULE_LAYOUTS, getLayoutById, computeModulePositions } from './moduleLayouts'
import FillZone from './FillZone'
import SpecialElement from './SpecialElement'
import Door from './objects/Door'
import ClosetMaterial, { ClosetMaterialProvider, useClosetMaterialInstance } from './ClosetMaterial'
import PostProcessing from './PostProcessing'
import CanvasToolbar from './CanvasToolbar'
import { MeasurementProjectorLayer, MeasurementsOverlayLayer, type ProjectedMap } from './Measurements'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const WALL = 0.018 // 1.8cm panel thickness in meters
const MODULE_WALL = 0.018 // 1.8cm module side panel thickness
const MODULE_INSIDE_INSET = 0.010 // 10mm gap between shelves and walls to prevent z-fighting
const ONDERSTEL_HEIGHT = 0.108 // 108mm onderstel (plinth)
const ONDERSTEL_GAP = 0.010   // 10mm gap between onderstel top and module floor
const CLOSET_INSIDE_INSET = 0.025 // 25mm inset from the front
const ONDERSTEL_FRONT_INSET = 0.089 // 89mm inset from the front
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
  const innerD = depth - WALL - CLOSET_INSIDE_INSET

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
  const innerD = depth - WALL - CLOSET_INSIDE_INSET

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

function Module({ index, layoutId, hasDoor, span }: { index: number; layoutId: number; hasDoor: boolean; span: 1 | 2 }) {
  const mh = useClosetStore((s) => s.mainHeight()) / 100
  const depth = useClosetStore((s) => s.depth) / 100
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const width = useClosetStore((s) => s.width) / 100
  const doorsOpen = useClosetStore((s) => s.doorsOpen)
  const hoveredSlot = useClosetStore((s) => s.hoveredSlot)
  const doorHandleId = useClosetStore((s) => s.doorHandleId)

  const layout = getLayoutById(layoutId)
  if (!layout) return null

  const innerW = width - WALL * 2
  const slotW = innerW / moduleCount
  const moduleWidth = span * slotW
  const moduleHeight = mh - WALL - (MODULE_FLOOR_Y)
  const moduleDepth = depth - WALL - CLOSET_INSIDE_INSET

  const { specialElementY, fillAbove, fillBelow } = computeModulePositions(layout, moduleHeight)

  const isLastModule = index + span === moduleCount
  const mirrorDoor = index % 2 === 1 || isLastModule

  // Position this module slot within the closet
  const startX = -innerW / 2
  const x = startX + index * slotW

  // Content depth: inset 10mm from the front face of the module
  const contentDepth = moduleDepth - MODULE_INSIDE_INSET

  // Center offsets for fill zone shelves (relative to this group)
  const centerX = moduleWidth / 2
  const centerZ = contentDepth / 2

  return (
    <group position={[x, MODULE_FLOOR_Y, WALL]}>
      {/* Special element (GLB) — no Y scaling */}
      <SpecialElement
        layout={layout}
        targetWidth={moduleWidth - MODULE_WALL * 2}
        targetDepth={contentDepth}
        positionY={specialElementY}
        hovered={hoveredSlot === index}
      />

      {/* Fill zone above special element */}
      {fillAbove.end > fillAbove.start && (
        <FillZone
          config={layout.fillZone.above}
          startY={fillAbove.start}
          endY={fillAbove.end}
          width={moduleWidth}
          depth={contentDepth}
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
          width={moduleWidth}
          depth={contentDepth}
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
      <mesh position={[moduleWidth - MODULE_WALL / 2, moduleHeight / 2, centerZ]} castShadow receiveShadow>
        <boxGeometry args={[MODULE_WALL, moduleHeight, moduleDepth]} />
        <ClosetMaterial />
      </mesh>

      {/* Floor */}
      <mesh position={[moduleWidth / 2, MODULE_WALL / 2, centerZ]} castShadow receiveShadow>
        <boxGeometry args={[moduleWidth, MODULE_WALL, moduleDepth]} />
        <ClosetMaterial />
      </mesh>

      {/* Roof */}
      <mesh position={[moduleWidth / 2, moduleHeight - MODULE_WALL / 2, centerZ]} castShadow receiveShadow>
        <boxGeometry args={[moduleWidth, MODULE_WALL, moduleDepth]} />
        <ClosetMaterial />
      </mesh>

      {/* Door(s) — single door for span=1, two mirrored doors for span=2 */}
      {hasDoor && span === 1 && (
        <Door
          moduleHeight={moduleHeight}
          slotW={slotW}
          moduleDepth={moduleDepth}
          doorsOpen={doorsOpen}
          doorHandleId={doorHandleId}
          mirror={mirrorDoor}
        />
      )}
      {hasDoor && span === 2 && (
        <>
          <Door
            moduleHeight={moduleHeight}
            slotW={slotW}
            moduleDepth={moduleDepth}
            doorsOpen={doorsOpen}
            doorHandleId={doorHandleId}
          />
          <group position={[slotW, 0, 0]}>
            <Door
              moduleHeight={moduleHeight}
              slotW={slotW}
              moduleDepth={moduleDepth}
              doorsOpen={doorsOpen}
              doorHandleId={doorHandleId}
              mirror
            />
          </group>
        </>
      )}
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
  const setHoveredSlot = useClosetStore((s) => s.setHoveredSlot)

  const [hovered, setHovered] = useState(false)

  const innerW = width - WALL * 2
  const slotW = innerW / moduleCount
  const moduleHeight = mh - WALL - (MODULE_FLOOR_Y)
  const moduleDepth = depth - WALL - CLOSET_INSIDE_INSET

  const isSelected = selectedSlot === slotIndex

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
    return () => { document.body.style.cursor = 'auto' }
  }, [hovered])

  const opacity = isSelected ? 0.10 : hovered ? 0.05 : 0

  return (
    <group position={[(-innerW / 2) + slotIndex * slotW, MODULE_FLOOR_Y, WALL]}>
      <mesh
        position={[slotW / 2, moduleHeight / 2, moduleDepth + 0.002]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); setHoveredSlot(slotIndex) }}
        onPointerOut={() => { setHovered(false); setHoveredSlot(null) }}
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

    const loader = new HDRLoader();

    let cancelled = false;
    loader.loadAsync('/hdr.hdr').then((envMap) => {
      if (cancelled) {
        envMap.dispose();
        return;
      }
      envMap.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = envMap;
      scene.environmentRotation = new THREE.Euler(Math.PI /2, 0, 0);; // Rotate environment 90 degrees around Y-axis

    });

    return () => {
      cancelled = true;
      scene.environment = null;
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
  const material = useClosetMaterialInstance()

  const innerW = width - WALL * 2
  const innerD = depth - WALL - ONDERSTEL_FRONT_INSET

  // Scale to inner closet dimensions, sits on floor (Y=0) between the walls
  // GLTF X → scene X (width), GLTF Z → scene Z (depth)
  // If scaling appears on wrong axis, swap scaleX/scaleZ below
  // Clone once — deep-cloning on every resize was freezing the scene.
  // The bounding box is fixed per GLB; only scale factors change with closet dimensions.
  const [{ clone, originalBox }] = useState(() => {
    const c = scene.clone(true)
    const b = new THREE.Box3().setFromObject(c)
    return { clone: c, originalBox: b }
  })

  const { scaleX, scaleZ, pX, pY, pZ } = useMemo(() => {
    const sx = innerW / (originalBox.max.x - originalBox.min.x)
    const sz = innerD / (originalBox.max.z - originalBox.min.z)
    const cx = (originalBox.min.x + originalBox.max.x) / 2
    return {
      scaleX: sx,
      scaleZ: sz,
      pX: -cx * sx,
      pY: -originalBox.min.y,
      pZ: WALL - originalBox.min.z * sz,
    }
  }, [originalBox, innerW, innerD])

  useEffect(() => {
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.material = material
      }
    })
  }, [clone, material])

  return (
    <primitive
      object={clone}
      scale={[scaleX, 1, scaleZ]}
      position={[pX, pY, pZ]}
    />
  )
}

function SilhouettePlane() {
  const width = useClosetStore((s) => s.width) / 100
  const texture = useTexture('/silhouette.png')

  const SILHOUETTE_HEIGHT = 1.8
  const img = texture.image as HTMLImageElement
  const aspect = img.width / img.height
  const planeWidth = SILHOUETTE_HEIGHT * aspect

  const x = -(width / 2 + 0.3 + planeWidth / 2)

  return (
    <mesh position={[x, SILHOUETTE_HEIGHT / 2 - 0.05, -0.005]}>
      <planeGeometry args={[planeWidth, SILHOUETTE_HEIGHT]} />
      <meshBasicMaterial map={texture} transparent opacity={0.25} depthWrite={false} />
    </mesh>
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
          <Module key={m.slotIndex} index={m.slotIndex} layoutId={m.layoutId!} hasDoor={m.hasDoor} span={m.span} />
        ))}
      {modules.map((m) => (
        <ModuleSlotInteraction key={`hit-${m.slotIndex}`} slotIndex={m.slotIndex} />
      ))}
    </ClosetMaterialProvider>
  )
}

function CameraController({ distance, controlsRef }: { distance: number; controlsRef: React.RefObject<any> }) {
  const { camera } = useThree()
  const proxyRef = useRef<{ d: number } | null>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    const target = new THREE.Vector3(0, 1, 0)

    if (!proxyRef.current) {
      proxyRef.current = { d: camera.position.clone().sub(target).length() }
    }

    tweenRef.current?.kill()
    tweenRef.current = gsap.to(proxyRef.current, {
      d: distance,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => {
        const offset = camera.position.clone().sub(target)
        if (offset.length() === 0) return
        offset.normalize().multiplyScalar(proxyRef.current!.d)
        camera.position.copy(target).add(offset)
        controlsRef.current?.update()
      },
    })

    return () => { tweenRef.current?.kill() }
  }, [distance, camera, controlsRef])

  return null
}

function ThreeLoader() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const animDone = useRef(false)
  const loadDone = useRef(false)
  const exiting = useRef(false)
  const hasBeenActive = useRef(false)
  const { active } = useProgress()

  const doExit = () => {
    if (exiting.current) return
    exiting.current = true
    gsap.to(wrapperRef.current, {
      opacity: '0',
      duration: 1,
      ease: 'power4.inOut',
      onComplete: () => setVisible(false),
    })
  }

  useGSAP(
    () => {
      gsap.set('.loader-fill-rect', { scaleX: 0, transformOrigin: 'left center' })
      gsap.to('.loader-fill-rect', {
        scaleX: 1,
        duration: 1.5,
        ease: 'power4.inOut',
        onComplete: () => {
          animDone.current = true
          if (loadDone.current) doExit()
        },
      })
    },
    { scope: containerRef }
  )

  useEffect(() => {
    if (active) hasBeenActive.current = true
    if (!active && hasBeenActive.current) {
      loadDone.current = true
      if (animDone.current) doExit()
    }
  }, [active])

  if (!visible) return null

  return (
    <div ref={wrapperRef} className="absolute inset-0 z-50 flex items-center justify-center bg-primary-dark">
      <div ref={containerRef} className="w-[91.5px] h-[55.5px]">
        <svg className="w-full h-full" viewBox="0 0 183 111" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="loaderClipPath">
              <rect className="loader-fill-rect" x="0" y="0" width="183" height="111" />
            </clipPath>
          </defs>
          <path
            d="M13.75 108.5H2.5V2.5H25V108.5H13.75ZM13.75 108.5L13.5 55H45V108.5H35.5M13.75 108.5H35.5M35.5 108.5V34H76V108.5H58M35.5 108.5H58M58 108.5V75H146V108.5H107M58 108.5H95.5M95.5 108.5V57.5H168.5V108.5H107M95.5 108.5H107M107 108.5V93H180.5V108.5H107Z"
            stroke="var(--color-primary)"
            strokeWidth="5"
            fill="none"
            opacity="0.2"
          />
          <path
            d="M13.75 108.5H2.5V2.5H25V108.5H13.75ZM13.75 108.5L13.5 55H45V108.5H35.5M13.75 108.5H35.5M35.5 108.5V34H76V108.5H58M35.5 108.5H58M58 108.5V75H146V108.5H107M58 108.5H95.5M95.5 108.5V57.5H168.5V108.5H107M95.5 108.5H107M107 108.5V93H180.5V108.5H107Z"
            stroke="white"
            strokeWidth="5"
            fill="none"
            opacity="0.8"
            clipPath="url(#loaderClipPath)"
          />
        </svg>
      </div>
    </div>
  )
}

export default function ThreeCanvas() {
  const setSelectedSlot = useClosetStore((s) => s.setSelectedSlot)
  const closetWidth = useClosetStore((s) => s.width) / 100
  const userZoom = useClosetStore((s) => s.userZoom)

  const controlsRef = useRef<any>(null)
  const projectedRef = useRef<ProjectedMap>({})

  // Width-based auto-fit (userZoom=0.5 default): min 5, max 8 at 180 cm
  // Toolbar/orbit user interaction: min 2, max 8 at 180 cm
  const autoFitDist = 3 * (closetWidth / 1.8)
  const maxDist = 4 * (closetWidth / 1.8)
  // Piecewise: 0.5 anchors to auto-fit; below → down to 2; above → up to maxDist
  const cameraTargetDist = userZoom <= 0.5
    ? 2 + (userZoom / 0.5) * (autoFitDist - 2)
    : autoFitDist + ((userZoom - 0.5) / 0.5) * (maxDist - autoFitDist)

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 1.6, 3], fov: 45 }}
        shadows
        // frameloop="demand"
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

        <CameraController distance={cameraTargetDist} controlsRef={controlsRef} />
        
        <RaycasterSetup />
        <MeasurementProjectorLayer projectedRef={projectedRef} />
        {/* <PostProcessing /> */}
        <Suspense>
          <ClosetScene />
          <SilhouettePlane />
        </Suspense>
        {/* Back wall plane to receive shadows — sits just behind closet back (Z=0) */}
        <mesh rotation={[0, 0, 0]} position={[0, 0, -0.01]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#fce6cb" />

        </mesh>
                {/* Floor plane to receive shadows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#efe9d7" />
        </mesh>

        <OrbitControls
          ref={controlsRef}
          target={[0, 1.5, 0]}
          minDistance={5}
          maxDistance={maxDist}
          maxPolarAngle={Math.PI / 2}
          minAzimuthAngle={-Math.PI / 2 + 0.1}
          maxAzimuthAngle={Math.PI / 2 - 0.1}
          enablePan={true}
        />
      </Canvas>
      <MeasurementsOverlayLayer projectedRef={projectedRef} />
      <CanvasToolbar />
      <ThreeLoader />
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
