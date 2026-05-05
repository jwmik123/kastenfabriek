'use client'

import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three/webgpu'
import { uniform } from 'three/tsl'
import { useFrame } from '@react-three/fiber'

type Mat4Uniform = ReturnType<typeof uniform>

const WardrobeInverseContext = createContext<Mat4Uniform | null>(null)

export function useWardrobeInverse(): Mat4Uniform {
  const ctx = useContext(WardrobeInverseContext)
  if (!ctx) {
    throw new Error('useWardrobeInverse must be used inside <WardrobeRootGroup>')
  }
  return ctx
}

/**
 * Wraps the wardrobe scene graph in a tracked group whose
 * `matrixWorldInverse` is published as a `mat4` TSL uniform.
 *
 * The triplanar projection uses this matrix to sample the color
 * texture in wardrobe-local space, so the grain stays glued to the
 * furniture if the wardrobe is ever translated or rotated.
 */
export function WardrobeRootGroup({ children }: { children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)
  const inverseUniform = useMemo(() => uniform(new THREE.Matrix4()), [])

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    ;(inverseUniform.value as THREE.Matrix4).copy(g.matrixWorld).invert()
  })

  return (
    <WardrobeInverseContext.Provider value={inverseUniform}>
      <group ref={groupRef}>{children}</group>
    </WardrobeInverseContext.Provider>
  )
}
