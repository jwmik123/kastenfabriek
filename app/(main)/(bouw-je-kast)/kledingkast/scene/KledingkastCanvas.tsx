'use client'

import { Suspense, useRef, useEffect } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useClosetStore } from '../store'
import { useGLTF } from '@react-three/drei'
import ThreeCanvas from '../../_shared/canvas/ThreeCanvas'
import CameraController from '../../_shared/canvas/CameraController'
import ThreeLoader from '../../_shared/canvas/ThreeLoader'
import ClosetScene from './ClosetScene'
import SilhouettePlane from './SilhouettePlane'
import { MeasurementProjectorLayer, MeasurementsOverlayLayer, type ProjectedMap } from '../components/Measurements'
import CanvasToolbar from '../components/CanvasToolbar'
import { MODULE_LAYOUTS } from './moduleLayouts'

function RaycasterSetup() {
  const { raycaster } = useThree()
  useEffect(() => {
    raycaster.layers.enable(1)
  }, [raycaster])
  return null
}

export default function KledingkastCanvas() {
  const setSelectedSlot = useClosetStore((s) => s.setSelectedSlot)
  const closetWidth = useClosetStore((s) => s.width) / 100
  const userZoom = useClosetStore((s) => s.userZoom)

  const controlsRef = useRef<any>(null)
  const projectedRef = useRef<ProjectedMap>({})

  const autoFitDist = 3 * (closetWidth / 1.8)
  const maxDist = 4 * (closetWidth / 1.8)
  const cameraTargetDist = userZoom <= 0.5
    ? 2 + (userZoom / 0.5) * (autoFitDist - 2)
    : autoFitDist + ((userZoom - 0.5) / 0.5) * (maxDist - autoFitDist)

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

        <CameraController distance={cameraTargetDist} controlsRef={controlsRef} />
        <RaycasterSetup />
        <MeasurementProjectorLayer projectedRef={projectedRef} />

        <Suspense>
          <ClosetScene />
          <SilhouettePlane />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          target={[0, 1.5, 0]}
          minDistance={4}
          maxDistance={maxDist}
          maxPolarAngle={Math.PI / 2}
          minAzimuthAngle={-Math.PI / 2 + 0.1}
          maxAzimuthAngle={Math.PI / 2 - 0.1}
          enablePan={true}
        />
      </ThreeCanvas>

      <MeasurementsOverlayLayer projectedRef={projectedRef} />
      <CanvasToolbar />
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
