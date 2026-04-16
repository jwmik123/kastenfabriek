'use client'

import { Suspense, useRef, useEffect } from 'react'
import { CameraControls, CameraControlsImpl, useGLTF } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { useClosetStore } from '../store'
import { setGlCanvas, captureNow } from '@/lib/canvas-capture'
import ThreeCanvas from '../../_shared/canvas/ThreeCanvas'
import ThreeLoader from '../../_shared/canvas/ThreeLoader'
import ClosetScene from './ClosetScene'
import RoomWalls from './RoomWalls'
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

  useEffect(() => {
    const canvas =
      (gl as unknown as { domElement?: HTMLCanvasElement }).domElement ??
      (gl as unknown as { canvas?: HTMLCanvasElement }).canvas ??
      null
    setGlCanvas(canvas)
    return () => setGlCanvas(null)
  }, [gl])

  useFrame(() => {
    const now = performance.now()
    if (now - lastCapture.current < 1000) return
    lastCapture.current = now
    queueMicrotask(captureNow)
  })

  return null
}

function CameraSystem() {
  const cameraRef = useRef<CameraControlsImpl>(null)
  const { size } = useThree()

  const widthCm  = useClosetStore(s => s.width)
  const heightCm = useClosetStore(s => s.height)
  const depthCm  = useClosetStore(s => s.depth)
  const userZoom = useClosetStore(s => s.userZoom)

  const W = widthCm  / 100
  const H = heightCm / 100
  const D = depthCm  / 100

  const aspect = size.width / size.height
  const aspectCorrection = Math.max(1, 1.1 / aspect)
  const autoFitDist = 3   * (W / 1.8) * aspectCorrection
  const maxDist     = Math.max(5, 3.5 * (W / 1.8) * aspectCorrection)

  const cameraTargetDist = userZoom <= 0.5
    ? 2 + (userZoom / 0.5) * (autoFitDist - 2)
    : autoFitDist + ((userZoom - 0.5) / 0.5) * (maxDist - autoFitDist)

  // Set initial view after CameraControls mounts
  useEffect(() => {
    if (!cameraRef.current) return
    cameraRef.current.setLookAt(0, H / 2, 5, 0, H / 2, 0, false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update maxDistance when closet width or aspect ratio changes
  useEffect(() => {
    if (!cameraRef.current) return
    cameraRef.current.maxDistance = maxDist
  }, [maxDist])

  // Constrain orbit target to closet interior
  useEffect(() => {
    if (!cameraRef.current) return
    const INSET = 0.1
    const boundary = new THREE.Box3(
      new THREE.Vector3(-W / 2 + INSET, INSET,  INSET),
      new THREE.Vector3( W / 2 - INSET, H - INSET, D + 1.0),
    )
    cameraRef.current.setBoundary(boundary)
  }, [W, H, D])

  // Animate distance when zoom buttons are used
  const prevZoomRef = useRef(userZoom)
  useEffect(() => {
    if (!cameraRef.current) return
    if (Math.abs(userZoom - prevZoomRef.current) < 0.001) return
    prevZoomRef.current = userZoom
    cameraRef.current.dollyTo(cameraTargetDist, true)
  }, [userZoom, cameraTargetDist])

  return (
    <CameraControls
      ref={cameraRef}
      makeDefault
      minPolarAngle={Math.PI / 2.2}
      maxPolarAngle={Math.PI / 1.9}
      minAzimuthAngle={-Math.PI / 5}
      maxAzimuthAngle={Math.PI / 5}
      minDistance={0.5}
      maxDistance={maxDist}
      smoothTime={0.25}
    />
  )
}

export default function KledingkastCanvas() {
  const setSelectedSlot = useClosetStore((s) => s.setSelectedSlot)
  const projectedRef = useRef<ProjectedMap>({})

  return (
    <div className="relative w-full h-full">
      <ThreeCanvas onPointerMissed={() => setSelectedSlot(null)}>
        <RoomWalls />
        <CameraSystem />
        <RaycasterSetup />
        <ScreenshotCapture />
        <PostProcessing />
        <WebGPURenderGuard />
        <MeasurementProjectorLayer projectedRef={projectedRef} />

        <Suspense>
          <ClosetScene />
          <SilhouettePlane />
        </Suspense>
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
