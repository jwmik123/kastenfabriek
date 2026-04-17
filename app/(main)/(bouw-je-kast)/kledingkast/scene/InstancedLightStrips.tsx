'use client'

import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { useClosetStore } from '../store'
import { getDiagHeightAt, getBackDiagHeightAtZ } from './diagonalUtils'
import type { DiagParams } from './diagonalUtils'

const WALL = 0.018
const MODULE_WALL = 0.018
const WALL_OFFSET = 0.001
const CLOSET_INSIDE_INSET = 0.025
const ONDERSTEL_HEIGHT = 0.108
const ONDERSTEL_GAP = 0.010
const MODULE_FLOOR_Y = ONDERSTEL_HEIGHT + ONDERSTEL_GAP
const STRIP_DEPTH_FROM_FRONT = 0.10
const STRIP_WIDTH = 0.015
const STRIP_COLOR = '#ffad5c'

interface StripInstance {
  position: THREE.Vector3
  rotY: number
  width: number  // visual width (STRIP_WIDTH)
  height: number // strip height = module interior height
}

interface Props {
  diagParams: DiagParams
}

export default function InstancedLightStrips({ diagParams: p }: Props) {
  const modules     = useClosetStore((s) => s.modules)
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const widthCm     = useClosetStore((s) => s.width)
  const depthCm     = useClosetStore((s) => s.depth)

  const meshRef = useRef<THREE.InstancedMesh>(null!)

  const strips = useMemo<StripInstance[]>(() => {
    const width = widthCm / 100
    const depth = depthCm / 100
    const innerW = width - WALL * 2
    const slotW = innerW / moduleCount
    const moduleDepth = depth - WALL - CLOSET_INSIDE_INSET
    const stripZ = WALL + moduleDepth - STRIP_DEPTH_FROM_FRONT

    const result: StripInstance[] = []

    modules.forEach((m, i) => {
      const isConsumed = i > 0 && modules[i - 1].span === 2
      if (isConsumed) return

      const moduleWidth = m.span * slotW
      const x = -innerW / 2 + m.slotIndex * slotW

      const leftXOuter  = WALL + m.slotIndex * slotW
      const rightXOuter = WALL + (m.slotIndex + m.span) * slotW

      let height: number
      if (p.backDiagonal) {
        height = Math.max(0, Math.min(getBackDiagHeightAtZ(WALL, p), p.mainHeight) - MODULE_FLOOR_Y - WALL)
      } else {
        const leftH  = Math.max(0, getDiagHeightAt(leftXOuter,  p) - MODULE_FLOOR_Y - WALL)
        const rightH = Math.max(0, getDiagHeightAt(rightXOuter, p) - MODULE_FLOOR_Y - WALL)
        height = Math.min(leftH, rightH)
      }
      if (height < 0.01) return

      const cy = MODULE_FLOOR_Y + height / 2

      // Left strip — inner face of left wall, facing +X into module
      result.push({
        position: new THREE.Vector3(x + MODULE_WALL + WALL_OFFSET, cy, stripZ),
        rotY: Math.PI / 2,
        width: STRIP_WIDTH,
        height,
      })

      // Right strip — inner face of right wall, facing -X into module
      result.push({
        position: new THREE.Vector3(x + moduleWidth - MODULE_WALL - WALL_OFFSET, cy, stripZ),
        rotY: -Math.PI / 2,
        width: STRIP_WIDTH,
        height,
      })
    })

    return result
  }, [modules, moduleCount, widthCm, depthCm, p])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const q = new THREE.Quaternion()
    const matrix = new THREE.Matrix4()
    strips.forEach((s, i) => {
      q.setFromEuler(new THREE.Euler(0, s.rotY, 0))
      matrix.compose(s.position, q, new THREE.Vector3(s.width, s.height, 1))
      mesh.setMatrixAt(i, matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [strips])

  if (strips.length === 0) return null

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, strips.length]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={STRIP_COLOR}
        emissive={STRIP_COLOR}
        emissiveIntensity={8}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  )
}
