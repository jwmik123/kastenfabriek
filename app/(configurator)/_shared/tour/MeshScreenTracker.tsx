'use client'

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useClosetStore } from '../../kledingkast/store'
import {
  MODULE_FLOOR_Y,
  WALL,
  CLOSET_INSIDE_INSET,
} from '../../kledingkast/scene/closetConstants'

export const TOUR_MODULE_TARGET_ID = 'kf-tour-module-target'

export interface ScreenRect {
  top: number
  left: number
  width: number
  height: number
}

export function projectBoxToScreen(
  box: THREE.Box3,
  camera: THREE.Camera,
  size: { width: number; height: number },
): ScreenRect {
  const corners: THREE.Vector3[] = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z),
  ]

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const c of corners) {
    c.project(camera)
    const sx = (c.x * 0.5 + 0.5) * size.width
    const sy = (-c.y * 0.5 + 0.5) * size.height
    if (sx < minX) minX = sx
    if (sx > maxX) maxX = sx
    if (sy < minY) minY = sy
    if (sy > maxY) maxY = sy
  }

  return { left: minX, top: minY, width: maxX - minX, height: maxY - minY }
}

export function computeFirstModuleBox(args: {
  widthCm: number
  heightCm: number
  depthCm: number
  moduleCount: number
  firstSlotIndex: number
}): THREE.Box3 {
  const { widthCm, heightCm, depthCm, moduleCount, firstSlotIndex } = args
  const W = widthCm / 100
  const H = heightCm / 100
  const D = depthCm / 100
  const innerW = W - WALL * 2
  const slotW = innerW / moduleCount
  const moduleDepth = D - WALL - CLOSET_INSIDE_INSET
  const xMin = -innerW / 2 + firstSlotIndex * slotW
  const xMax = xMin + slotW
  return new THREE.Box3(
    new THREE.Vector3(xMin, MODULE_FLOOR_Y, WALL),
    new THREE.Vector3(xMax, H - 0.05, WALL + moduleDepth),
  )
}

export default function ModuleSpotlightTracker({
  targetId = TOUR_MODULE_TARGET_ID,
}: {
  targetId?: string
}) {
  const widthCm = useClosetStore((s) => s.width)
  const heightCm = useClosetStore((s) => s.height)
  const depthCm = useClosetStore((s) => s.depth)
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const modules = useClosetStore((s) => s.modules)

  useFrame(({ camera, size }) => {
    if (typeof document === 'undefined') return
    const target = document.getElementById(targetId) as HTMLElement | null
    if (!target) return

    const firstSlotIndex = modules.findIndex((m) => m.layoutId !== null)
    const slotIndex = firstSlotIndex >= 0 ? firstSlotIndex : 0

    const box = computeFirstModuleBox({
      widthCm,
      heightCm,
      depthCm,
      moduleCount,
      firstSlotIndex: slotIndex,
    })

    const rect = projectBoxToScreen(box, camera, size)
    target.style.top = `${rect.top}px`
    target.style.left = `${rect.left}px`
    target.style.width = `${rect.width}px`
    target.style.height = `${rect.height}px`
  })

  return null
}
