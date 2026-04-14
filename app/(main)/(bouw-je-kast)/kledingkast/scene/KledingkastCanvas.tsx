'use client'

import { Suspense, useRef, useEffect } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import { useClosetStore } from '../store'
import { useGLTF } from '@react-three/drei'
import { setGlCanvas, captureNow } from '@/lib/canvas-capture'
import ThreeCanvas from '../../_shared/canvas/ThreeCanvas'
import CameraController from '../../_shared/canvas/CameraController'
import ThreeLoader from '../../_shared/canvas/ThreeLoader'
import ClosetScene from './ClosetScene'
import RoomWalls, { ROOM_WALL_THICKNESS, ROOM_FORWARD } from './RoomWalls'
import SilhouettePlane from './SilhouettePlane'
import { MeasurementProjectorLayer, MeasurementsOverlayLayer, type ProjectedMap } from '../components/Measurements'
import CanvasToolbar from '../components/CanvasToolbar'
import CanvasPricePanel from '../components/CanvasPricePanel'
import { MODULE_LAYOUTS } from './moduleLayouts'
import PostProcessing from '../../_shared/effects/PostProcessing'
import WebGPURenderGuard from '../../_shared/effects/WebGPURenderGuard'

function RaycasterSetup() {
  const { raycaster } = useThree()
  useEffect(() => {
    raycaster.layers.enable(1)
  }, [raycaster])
  return null
}

/**
 * Post-update camera position safety clamp.
 *
 * Primary clamping strategy: OrbitControls bounds (azimuth ±(PI/2-0.1),
 * polar PI/8–PI/2) keep the camera in the front hemisphere. This component
 * is a secondary safety net — it hard-clamps camera.position to the inner
 * room AABB after each OrbitControls update so the camera can never clip
 * through a wall even from unexpected zoom+pan+orbit combinations.
 *
 * The AABB is kept slightly inset (5 cm) from the inner wall faces so the
 * camera is never flush against a wall.
 */
function CameraRoomClamp({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const { camera } = useThree()
  const W = useClosetStore(s => s.width)  / 100
  const H = useClosetStore(s => s.height) / 100
  const D = useClosetStore(s => s.depth)  / 100
  const T = ROOM_WALL_THICKNESS
  const INSET = 0.05

  useFrame(() => {
    // Clamp x: camera must stay between the two inner wall faces ± generous margin.
    // We allow x beyond the wall (camera is outside the room) but not by more than
    // a few metres so it can't escape to infinity from a freed orbit.
    const xMin = -W / 2 - T - 2
    const xMax =  W / 2 + T + 2
    camera.position.x = Math.max(xMin, Math.min(xMax, camera.position.x))

    // Clamp y: camera above floor (with inset) and not too far above the walls.
    camera.position.y = Math.max(INSET, Math.min(H + 3, camera.position.y))

    // Clamp z: camera must be in front of the back wall and can extend in front
    // of the closet for normal viewing. The azimuth lock already prevents going
    // fully behind the closet, but clamp here as a backstop.
    // zMax scales with closet width (same ratio as maxDist in CameraController)
    // so it never becomes the binding constraint when zooming out.
    const zMin = -T - INSET
    const zMax = D + Math.max(ROOM_FORWARD, 9 * W) - INSET
    camera.position.z = Math.max(zMin, Math.min(zMax, camera.position.z))

    // Clamp OrbitControls target to room footprint so the pivot doesn't drift outside.
    if (controlsRef.current) {
      const tgt = controlsRef.current.target
      tgt.x = Math.max(-W / 2, Math.min(W / 2, tgt.x))
      tgt.y = Math.max(0, Math.min(H, tgt.y))
      tgt.z = Math.max(0, Math.min(D, tgt.z))
    }
  })

  return null
}

function ScreenshotCapture() {
  const { gl } = useThree()
  const lastCapture = useRef(0)

  // Register the canvas ref — try domElement, fall back to any canvas property
  useEffect(() => {
    const canvas =
      (gl as unknown as { domElement?: HTMLCanvasElement }).domElement ??
      (gl as unknown as { canvas?: HTMLCanvasElement }).canvas ??
      null
    setGlCanvas(canvas)
    return () => setGlCanvas(null)
  }, [gl])

  // Schedule capture as a microtask so it fires AFTER gl.render() completes
  // in the same RAF, but before the browser composites the WebGPU frame.
  useFrame(() => {
    const now = performance.now()
    if (now - lastCapture.current < 1000) return
    lastCapture.current = now
    queueMicrotask(captureNow)
  })

  return null
}

export default function KledingkastCanvas() {
  const setSelectedSlot = useClosetStore((s) => s.setSelectedSlot)

  const controlsRef = useRef<any>(null)
  const projectedRef = useRef<ProjectedMap>({})

  return (
    <div className="relative w-full h-full">
      <ThreeCanvas onPointerMissed={() => setSelectedSlot(null)}>
        {/* Room shell — replaces the former infinite back-wall and floor planes */}
        <RoomWalls />

        <CameraController controlsRef={controlsRef} />
        <CameraRoomClamp controlsRef={controlsRef} />
        <RaycasterSetup />
        <ScreenshotCapture />
        <PostProcessing />
        <WebGPURenderGuard />
        <MeasurementProjectorLayer projectedRef={projectedRef} />

        <Suspense>
          <ClosetScene />
          <SilhouettePlane />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          target={[0, 1.5, 0]}
          minDistance={1}
          maxDistance={20}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2}
          minAzimuthAngle={-Math.PI / 2 + 0.1}
          maxAzimuthAngle={Math.PI / 2 - 0.1}
          enablePan={true}
        />
      </ThreeCanvas>

      <MeasurementsOverlayLayer projectedRef={projectedRef} />
      <CanvasToolbar />
      <CanvasPricePanel />
      <ThreeLoader />
    </div>
  )
}

// Preload all module GLBs
MODULE_LAYOUTS.forEach((layout) => {
  if (layout.specialElement.glbPath) {
    useGLTF.preload(layout.specialElement.glbPath)
  }
})

useGLTF.preload('/objects/onderstel.glb')
