'use client'

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import gsap from 'gsap'

interface CameraControllerProps {
  distance: number
  controlsRef: React.RefObject<any>
}

export default function CameraController({ distance, controlsRef }: CameraControllerProps) {
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
