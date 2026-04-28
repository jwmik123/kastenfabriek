'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three/webgpu'
import { uv, float, fract, time, color, uniform, select, positionWorld } from 'three/tsl'
import { useWasmachinekastStore } from '../store'
import { ClosetMaterialProvider } from '../../_shared/materials/ClosetMaterial'
import ClosetCorpus from '../../_shared/three/ClosetCorpus'
import Module from '../../_shared/three/Module'
import type { DiagParams } from '../../kledingkast/scene/diagonalUtils'
import { WALL, ONDERSTEL_HEIGHT, ONDERSTEL_GAP, CLOSET_INSIDE_INSET, MODULE_FLOOR_Y } from '../../kledingkast/scene/closetConstants'
import { useGLTF } from '@react-three/drei'
import { useClosetMaterialInstance } from '../../_shared/materials/ClosetMaterial'
import { trapNaN, trapGeo } from '@/utils/debugGeometry'

const BORDER_M = 0.015

// Simplified slot interaction — no diagonal ceiling shape needed
function WasmModuleSlotInteraction({
  slotIndex,
  span,
  diagParams,
}: {
  slotIndex: number
  span: 1 | 2
  diagParams: DiagParams
}) {
  const depth = useWasmachinekastStore((s) => s.depth) / 100
  const moduleCount = useWasmachinekastStore((s) => s.moduleCount)
  const width = useWasmachinekastStore((s) => s.width) / 100
  const mainHeightCm = useWasmachinekastStore((s) => s.mainHeight())
  const selectedSlot = useWasmachinekastStore((s) => s.selectedSlot)
  const setSelectedSlot = useWasmachinekastStore((s) => s.setSelectedSlot)
  const setHoveredSlot = useWasmachinekastStore((s) => s.setHoveredSlot)

  const [hovered, setHovered] = useState(false)

  const innerW = width - WALL * 2
  const slotW = innerW / moduleCount
  const moduleDepth = depth - WALL - CLOSET_INSIDE_INSET
  const mainHeightM = mainHeightCm / 100

  const isSelected = selectedSlot === slotIndex
  const totalW = span * slotW

  const shapeGeo = useMemo(() => {
    trapNaN(totalW, `WasmSlotInteraction${slotIndex}-totalW`)
    trapNaN(mainHeightM, `WasmSlotInteraction${slotIndex}-mainHeightM`)
    const geo = new THREE.PlaneGeometry(totalW, mainHeightM)
    geo.translate(totalW / 2, mainHeightM / 2, 0)
    return trapGeo(geo, `WasmSlotInteraction${slotIndex}-shapeGeo`)
  }, [totalW, mainHeightM])

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
    return () => { document.body.style.cursor = 'auto' }
  }, [hovered])

  const bxU = useRef(uniform(BORDER_M / totalW))
  const byU = useRef(uniform(BORDER_M / mainHeightM))
  const fillAlphaU = useRef(uniform(0.0))
  const borderAlphaU = useRef(uniform(0.0))

  useEffect(() => { bxU.current.value = BORDER_M / totalW }, [totalW])
  useEffect(() => { byU.current.value = BORDER_M / mainHeightM }, [mainHeightM])
  useEffect(() => {
    fillAlphaU.current.value = isSelected ? 0.05 : hovered ? 0.10 : 0.0
    borderAlphaU.current.value = (isSelected || hovered) ? 0.85 : 0.0
  }, [isSelected, hovered])

  const material = useMemo(() => {
    const uvCoord = uv()
    const onEdge = uvCoord.x.lessThan(bxU.current)
      .or(float(1.0).sub(uvCoord.x).lessThan(bxU.current))
      .or(uvCoord.y.lessThan(byU.current))
      .or(float(1.0).sub(uvCoord.y).lessThan(byU.current))
    const stripe = fract(positionWorld.x.sub(positionWorld.y).mul(8.0).add(time.mul(0.8)))
    const stripeOn = stripe.lessThan(float(0.5))
    const pixelAlpha = select(
      onEdge,
      select(stripeOn, borderAlphaU.current, float(0.0)),
      fillAlphaU.current,
    )
    const mat = new THREE.MeshBasicNodeMaterial()
    mat.colorNode = color(0x22c55e)
    mat.opacityNode = pixelAlpha
    mat.transparent = true
    mat.depthWrite = false
    return mat
  }, [])

  return (
    <group position={[(-innerW / 2) + slotIndex * slotW, MODULE_FLOOR_Y, WALL]}>
      <mesh
        position={[0, 0, moduleDepth + 0.002]}
        geometry={shapeGeo}
        material={material}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); setHoveredSlot(slotIndex) }}
        onPointerOut={() => { setHovered(false); setHoveredSlot(null) }}
        onClick={(e) => { e.stopPropagation(); setSelectedSlot(isSelected ? null : slotIndex) }}
      />
    </group>
  )
}

function WasmOnderstelPlinth() {
  const width = useWasmachinekastStore((s) => s.width) / 100
  const depth = useWasmachinekastStore((s) => s.depth) / 100
  const { scene } = useGLTF('/objects/onderstel.glb')
  const material = useClosetMaterialInstance()

  const ONDERSTEL_FRONT_INSET = 0.089
  const innerW = width - WALL * 2
  const innerD = depth - WALL - ONDERSTEL_FRONT_INSET

  const [{ clone, originalBox }] = useState(() => {
    const c = scene.clone(true)
    const b = new THREE.Box3().setFromObject(c)
    return { clone: c, originalBox: b }
  })

  const { scaleX, scaleZ, pX, pY, pZ } = useMemo(() => {
    const sx = innerW / (originalBox.max.x - originalBox.min.x)
    const sz = innerD / (originalBox.max.z - originalBox.min.z)
    const cx = (originalBox.min.x + originalBox.max.x) / 2
    return {
      scaleX: sx,
      scaleZ: sz,
      pX: -cx * sx,
      pY: -originalBox.min.y,
      pZ: WALL - originalBox.min.z * sz,
    }
  }, [originalBox, innerW, innerD])

  useEffect(() => {
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh) obj.material = material
    })
  }, [clone, material])

  return (
    <primitive
      object={clone}
      scale={[scaleX, 1, scaleZ]}
      position={[pX, pY, pZ]}
    />
  )
}

export default function WasmachinekastScene() {
  const modules = useWasmachinekastStore((s) => s.modules)
  const outerWidth = useWasmachinekastStore((s) => s.width)
  const closetHeightCm = useWasmachinekastStore((s) => s.height)
  const mainHeightCm = useWasmachinekastStore((s) => s.mainHeight())
  const outerDepthCm = useWasmachinekastStore((s) => s.depth)

  const diagParams = useMemo<DiagParams>(
    () => ({
      diagonalSide: 'none',
      leftDiagStartHeight: 0,
      rightDiagStartHeight: 0,
      leftDiagTopWidth: 0,
      rightDiagTopWidth: 0,
      outerWidth: outerWidth / 100,
      mainHeight: mainHeightCm / 100,
      closetHeight: closetHeightCm / 100,
      backDiagonal: false,
      backDiagKinkHeight: 0,
      backDiagFlatSectionDepth: 0,
      outerDepth: outerDepthCm / 100,
    }),
    [outerWidth, mainHeightCm, closetHeightCm, outerDepthCm],
  )

  return (
    <ClosetMaterialProvider>
      <ClosetCorpus diagParams={diagParams} />
      <WasmOnderstelPlinth />
      {modules
        .filter((m) => m.layoutId !== null)
        .map((m) => (
          <Module
            key={m.slotIndex}
            index={m.slotIndex}
            layoutId={m.layoutId!}
            hasDoor={m.hasDoor}
            span={m.span}
            diagParams={diagParams}
          />
        ))}
      {modules.map((m, i) => {
        const isConsumed = i > 0 && modules[i - 1].span === 2
        if (isConsumed) return null
        return (
          <WasmModuleSlotInteraction
            key={`hit-${m.slotIndex}`}
            slotIndex={m.slotIndex}
            span={m.span}
            diagParams={diagParams}
          />
        )
      })}
    </ClosetMaterialProvider>
  )
}

useGLTF.preload('/objects/onderstel.glb')
