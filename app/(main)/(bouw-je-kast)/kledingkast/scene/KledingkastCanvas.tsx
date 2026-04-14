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
        {/* Back wall shadow receiver */}
        <mesh rotation={[0, 0, 0]} position={[0, 0, -0.01]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#fce6cb" />
        </mesh>

        {/* Floor shadow receiver */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#efe9d7" />
        </mesh>

        <CameraController controlsRef={controlsRef} />
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
          minDistance={5}
          maxDistance={20}
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
