'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { uv, float, fract, time, color, uniform, select, positionWorld } from 'three/tsl'
import { useClosetStore } from '../store'
import { ClosetMaterialProvider } from '../../_shared/materials/ClosetMaterial'
import ClosetCorpus from './ClosetCorpus'
import TopCabinet from './TopCabinet'
import OnderstelPlinth from './OnderstelPlinth'
import Module from './Module'

const WALL = 0.018
const ONDERSTEL_HEIGHT = 0.108
const ONDERSTEL_GAP = 0.010
const CLOSET_INSIDE_INSET = 0.025
const MODULE_FLOOR_Y = ONDERSTEL_HEIGHT + ONDERSTEL_GAP
const BORDER_M = 0.015 // 15mm border in world space

function ModuleSlotInteraction({ slotIndex, span }: { slotIndex: number; span: 1 | 2 }) {
  const mh = useClosetStore((s) => s.mainHeight()) / 100
  const depth = useClosetStore((s) => s.depth) / 100
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const width = useClosetStore((s) => s.width) / 100
  const selectedSlot = useClosetStore((s) => s.selectedSlot)
  const setSelectedSlot = useClosetStore((s) => s.setSelectedSlot)
  const setHoveredSlot = useClosetStore((s) => s.setHoveredSlot)

  const [hovered, setHovered] = useState(false)

  const innerW = width - WALL * 2
  const slotW = innerW / moduleCount
  const moduleHeight = mh - WALL - MODULE_FLOOR_Y
  const moduleDepth = depth - WALL - CLOSET_INSIDE_INSET

  const isSelected = selectedSlot === slotIndex
  const totalW = span * slotW

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
    return () => { document.body.style.cursor = 'auto' }
  }, [hovered])

  // Border width as UV fraction — updated when dimensions change
  const bxU = useRef(uniform(BORDER_M / totalW))
  const byU = useRef(uniform(BORDER_M / moduleHeight))
  // Opacity uniforms — updated on hover/select state change
  const fillAlphaU = useRef(uniform(0.0))
  const borderAlphaU = useRef(uniform(0.0))

  useEffect(() => { bxU.current.value = BORDER_M / totalW }, [totalW])
  useEffect(() => { byU.current.value = BORDER_M / moduleHeight }, [moduleHeight])
  useEffect(() => {
    fillAlphaU.current.value = isSelected ? 0.05 : hovered ? 0.10 : 0.0
    // fillAlphaU.current.value = 0.0
    borderAlphaU.current.value = (isSelected || hovered) ? 0.85 : 0.0
  }, [isSelected, hovered])

  const material = useMemo(() => {
    const uvCoord = uv()

    // Detect the border region (inner edges in UV space)
    const onEdge = uvCoord.x.lessThan(bxU.current)
      .or(float(1.0).sub(uvCoord.x).lessThan(bxU.current))
      .or(uvCoord.y.lessThan(byU.current))
      .or(float(1.0).sub(uvCoord.y).lessThan(byU.current))

    // Marching-ants diagonal stripes — world-space coords keep stripe width consistent
    const stripe = fract(positionWorld.x.sub(positionWorld.y).mul(8.0).add(time.mul(0.8)))
    const stripeOn = stripe.lessThan(float(0.5))

    // Border: alternating green / transparent stripes. Fill: flat faint green.
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
  }, []) // created once; uniforms update reactively via .value

  return (
    <group position={[(-innerW / 2) + slotIndex * slotW, MODULE_FLOOR_Y, WALL]}>
      <mesh
        position={[totalW / 2, moduleHeight / 2, moduleDepth + 0.002]}
        scale={[totalW, moduleHeight, 1]}
        material={material}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); setHoveredSlot(slotIndex) }}
        onPointerOut={() => { setHovered(false); setHoveredSlot(null) }}
        onClick={(e) => { e.stopPropagation(); setSelectedSlot(isSelected ? null : slotIndex) }}
      >
        <planeGeometry />
      </mesh>
    </group>
  )
}

export default function ClosetScene() {
  const modules = useClosetStore((s) => s.modules)

  return (
    <ClosetMaterialProvider>
      <ClosetCorpus />
      <TopCabinet />
      <OnderstelPlinth />
      {modules
        .filter((m) => m.layoutId !== null)
        .map((m) => (
          <Module key={m.slotIndex} index={m.slotIndex} layoutId={m.layoutId!} hasDoor={m.hasDoor} span={m.span} />
        ))}
      {modules.map((m, i) => {
        const isConsumed = i > 0 && modules[i - 1].span === 2
        if (isConsumed) return null
        return <ModuleSlotInteraction key={`hit-${m.slotIndex}`} slotIndex={m.slotIndex} span={m.span} />
      })}
    </ClosetMaterialProvider>
  )
}
