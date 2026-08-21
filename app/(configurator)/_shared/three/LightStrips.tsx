'use client'

import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { getDiagHeightAt } from '../../kledingkast/scene/diagonalUtils'
import type { DiagParams } from '../../kledingkast/scene/diagonalUtils'
import { computeSlotWidthsM } from '../store/slotWidths'
import type { BaseModuleSlot } from '../store/types'

const WALL = 0.018
const MODULE_WALL = 0.018
const WALL_OFFSET = 0.001
const CLOSET_INSIDE_INSET = 0.025
const ONDERSTEL_HEIGHT = 0.108
const ONDERSTEL_GAP = 0.010
const MODULE_FLOOR_Y = ONDERSTEL_HEIGHT + ONDERSTEL_GAP
export const STRIP_DEPTH_FROM_FRONT = 0.10
export const STRIP_MARGIN = 0.01
const STRIP_WIDTH = 0.015
const STRIP_COLOR = '#ffad5c'

export interface StripInstance {
  /** Centre of the strip, in section-group space. */
  position: [number, number, number]
  rotY: number
  /** Visual width — the strip is a plane scaled to width × height. */
  width: number
  /** Strip height = module interior height minus the margin at both ends. */
  height: number
}

/**
 * The strip pair for one module: one on each side wall's inner face, inset by
 * `STRIP_MARGIN` at top and bottom. Left and right take their own height so a
 * module under a diagonal keeps each strip inside its own wall.
 */
export function stripPair({
  x,
  moduleWidth,
  floorY,
  leftHeight,
  rightHeight,
  stripZ,
  wallThickness = MODULE_WALL,
}: {
  /** Left edge of the module, in the group's own space. */
  x: number
  moduleWidth: number
  floorY: number
  leftHeight: number
  rightHeight: number
  stripZ: number
  wallThickness?: number
}): StripInstance[] {
  const out: StripInstance[] = []

  const leftH = leftHeight - STRIP_MARGIN * 2
  if (leftH >= 0.01) {
    out.push({
      position: [x + wallThickness + WALL_OFFSET, floorY + STRIP_MARGIN + leftH / 2, stripZ],
      rotY: Math.PI / 2,
      width: STRIP_WIDTH,
      height: leftH,
    })
  }

  const rightH = rightHeight - STRIP_MARGIN * 2
  if (rightH >= 0.01) {
    out.push({
      position: [
        x + moduleWidth - wallThickness - WALL_OFFSET,
        floorY + STRIP_MARGIN + rightH / 2,
        stripZ,
      ],
      rotY: -Math.PI / 2,
      width: STRIP_WIDTH,
      height: rightH,
    })
  }

  return out
}

/** Renders a strip list as one instanced emissive plane mesh. */
export function StripMesh({ strips }: { strips: StripInstance[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const q = new THREE.Quaternion()
    const matrix = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    strips.forEach((s, i) => {
      q.setFromEuler(new THREE.Euler(0, s.rotY, 0))
      pos.set(s.position[0], s.position[1], s.position[2])
      matrix.compose(pos, q, new THREE.Vector3(s.width, s.height, 1))
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

export interface StripLayoutInput {
  modules: BaseModuleSlot[]
  /** Section outer width in metres. */
  widthM: number
  /** Section outer depth in metres. */
  depthM: number
  diagParams: DiagParams
  /**
   * Side panel this section owns. A shared side wall belongs to the neighbouring
   * section, so its thickness drops out of this section's interior — same rule
   * Module applies.
   */
  sharedSideWall?: 'left' | 'right' | null
}

/**
 * Two strips per module, on the inner face of each side wall, 10 cm behind the
 * front edge. Pure so the geometry can be tested without a renderer.
 *
 * Slot widths come from `computeSlotWidthsM`, the same source Module uses, so a
 * fixed-width slot (a washer) puts its strips on its own walls rather than on
 * an evenly divided grid.
 */
export function computeStripInstances({
  modules,
  widthM,
  depthM,
  diagParams: p,
  sharedSideWall = null,
}: StripLayoutInput): StripInstance[] {
  const sideWallM = p.sideWallThickness
  const leftWallM = sharedSideWall === 'left' ? 0 : sideWallM
  const rightWallM = sharedSideWall === 'right' ? 0 : sideWallM
  const innerW = widthM - leftWallM - rightWallM
  if (innerW <= 0 || modules.length === 0) return []

  const slotWidthsM = computeSlotWidthsM(modules, innerW)
  const moduleDepth = depthM - WALL - CLOSET_INSIDE_INSET
  const stripZ = WALL + moduleDepth - STRIP_DEPTH_FROM_FRONT
  const startX = -widthM / 2 + leftWallM

  const result: StripInstance[] = []

  modules.forEach((m, i) => {
    const isConsumed = i > 0 && modules[i - 1].span === 2
    if (isConsumed) return

    const span = m.span ?? 1
    const slotOffset = slotWidthsM.slice(0, i).reduce((a, b) => a + b, 0)
    const moduleWidth = slotWidthsM.slice(i, i + span).reduce((a, b) => a + b, 0)
    if (moduleWidth <= MODULE_WALL * 2) return

    const x = startX + slotOffset
    const leftXOuter = leftWallM + slotOffset
    const rightXOuter = leftXOuter + moduleWidth

    // Back diagonal is uniform in X: every module keeps the flat height.
    const heightAt = (xOuter: number) =>
      p.backDiagonal
        ? Math.max(0, p.mainHeight - MODULE_FLOOR_Y - WALL)
        : Math.max(0, getDiagHeightAt(xOuter, p) - MODULE_FLOOR_Y - WALL)

    result.push(
      ...stripPair({
        x,
        moduleWidth,
        floorY: MODULE_FLOOR_Y,
        leftHeight: heightAt(leftXOuter),
        rightHeight: heightAt(rightXOuter),
        stripZ,
      }),
    )
  })

  return result
}

/**
 * LED strips for one cabinet section. Rendered inside the section's group, so
 * positions are section-local — a wasmachinekast section carries its own
 * x-offset on the group around it.
 */
export default function LightStrips({
  modules,
  widthM,
  depthM,
  diagParams,
  sharedSideWall = null,
}: StripLayoutInput) {
  const strips = useMemo(
    () => computeStripInstances({ modules, widthM, depthM, diagParams, sharedSideWall }),
    [modules, widthM, depthM, diagParams, sharedSideWall],
  )

  return <StripMesh strips={strips} />
}
