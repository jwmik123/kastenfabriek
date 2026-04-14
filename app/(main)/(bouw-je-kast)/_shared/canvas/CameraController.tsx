'use client'

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import { useClosetStore } from '../../kledingkast/store'

interface CameraControllerProps {
  controlsRef: React.RefObject<any>
}

export default function CameraController({ controlsRef }: CameraControllerProps) {
  const { camera, size } = useThree()
  const proxyRef = useRef<{ d: number } | null>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  const width = useClosetStore((s) => s.width)
  const userZoom = useClosetStore((s) => s.userZoom)

  const closetWidth = width / 100
  // On portrait canvases (mobile) the horizontal FOV is narrower, so pull the
  // camera back proportionally so the closet fits without feeling zoomed-in.
  const aspect = size.width / size.height
  const aspectCorrection = Math.max(1, 1.1 / aspect)
  const autoFitDist = 3 * (closetWidth / 1.8) * aspectCorrection
  const maxDist = 3.5 * (closetWidth / 1.8) * aspectCorrection
  const cameraTargetDist = userZoom <= 0.5
    ? 2 + (userZoom / 0.5) * (autoFitDist - 2)
    : autoFitDist + ((userZoom - 0.5) / 0.5) * (maxDist - autoFitDist)

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.maxDistance = maxDist
    }
  }, [maxDist, controlsRef, size.width, size.height])

  useEffect(() => {
    const target = new THREE.Vector3(0, 1, 0)

    if (!proxyRef.current) {
      proxyRef.current = { d: camera.position.clone().sub(target).length() }
    }

    tweenRef.current?.kill()
    tweenRef.current = gsap.to(proxyRef.current, {
      d: cameraTargetDist,
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
  }, [cameraTargetDist, camera, controlsRef, size.width, size.height])

  return null
}
