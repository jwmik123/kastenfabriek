'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import * as THREE from 'three/webgpu'
import { useClosetStore } from '../../kledingkast/store'
import { getDiagHeightAt, getBackDiagHeightAtZ } from '../../kledingkast/scene/diagonalUtils'
import type { DiagParams } from '../../kledingkast/scene/diagonalUtils'

const WALL                 = 0.018
const MODULE_WALL          = 0.018
const WALL_OFFSET          = 0.001
const CLOSET_INSIDE_INSET  = 0.025
const ONDERSTEL_HEIGHT     = 0.108
const ONDERSTEL_GAP        = 0.010
const MODULE_FLOOR_Y       = ONDERSTEL_HEIGHT + ONDERSTEL_GAP
const STRIP_DEPTH_FROM_FRONT = 0.10

export interface StripPair {
  startA: THREE.Vector3
  endA:   THREE.Vector3
  startB: THREE.Vector3
  endB:   THREE.Vector3
}

export interface StripWarmthContextValue {
  enabled: boolean
  strips:  StripPair | null
}

const StripWarmthContext = createContext<StripWarmthContextValue | null>(null)

export function useStripWarmth(): StripWarmthContextValue | null {
  return useContext(StripWarmthContext)
}

interface ProviderProps {
  children:  ReactNode
  slotIndex: number
  span:      1 | 2
  diagParams: DiagParams
}

export function StripWarmthProvider({ children, slotIndex, span, diagParams: p }: ProviderProps) {
  const lightStripsEnabled = useClosetStore((s) => s.lightStripsEnabled)
  const doorsOpen          = useClosetStore((s) => s.doorsOpen)
  const moduleCount        = useClosetStore((s) => s.moduleCount)
  const widthCm            = useClosetStore((s) => s.width)
  const depthCm            = useClosetStore((s) => s.depth)

  const strips = useMemo<StripPair | null>(() => {
    const width  = widthCm / 100
    const depth  = depthCm / 100
    const innerW = width - WALL * 2
    const slotW  = innerW / moduleCount
    const moduleWidth = span * slotW
    const moduleDepth = depth - WALL - CLOSET_INSIDE_INSET
    const stripZ      = WALL + moduleDepth - STRIP_DEPTH_FROM_FRONT
    const x           = -innerW / 2 + slotIndex * slotW

    let height: number
    if (p.backDiagonal) {
      height = Math.max(0, p.mainHeight - MODULE_FLOOR_Y - WALL)
    } else {
      const leftXOuter  = WALL + slotIndex * slotW
      const rightXOuter = WALL + (slotIndex + span) * slotW
      const leftH  = Math.max(0, getDiagHeightAt(leftXOuter,  p) - MODULE_FLOOR_Y - WALL)
      const rightH = Math.max(0, getDiagHeightAt(rightXOuter, p) - MODULE_FLOOR_Y - WALL)
      height = Math.min(leftH, rightH)
    }
    if (height < 0.01) return null

    const stripBottom = MODULE_FLOOR_Y
    const stripTop    = MODULE_FLOOR_Y + height
    const leftX       = x + MODULE_WALL + WALL_OFFSET
    const rightX      = x + moduleWidth - MODULE_WALL - WALL_OFFSET

    return {
      startA: new THREE.Vector3(leftX,  stripBottom, stripZ),
      endA:   new THREE.Vector3(leftX,  stripTop,    stripZ),
      startB: new THREE.Vector3(rightX, stripBottom, stripZ),
      endB:   new THREE.Vector3(rightX, stripTop,    stripZ),
    }
  }, [widthCm, depthCm, moduleCount, slotIndex, span, p])

  const value = useMemo<StripWarmthContextValue>(
    () => ({ enabled: lightStripsEnabled && doorsOpen, strips }),
    [lightStripsEnabled, doorsOpen, strips],
  )

  return (
    <StripWarmthContext.Provider value={value}>
      {children}
    </StripWarmthContext.Provider>
  )
}
