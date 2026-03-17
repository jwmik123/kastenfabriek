'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { uv, float, fract, time, color, uniform, select, positionWorld } from 'three/tsl'
import { useClosetStore } from '../store'
import { ClosetMaterialProvider } from '../../_shared/materials/ClosetMaterial'
import { getDiagHeightAt } from './diagonalUtils'
import type { DiagParams } from './diagonalUtils'
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

function slotCeilingProfile(
  leftXOuter: number,
  rightXOuter: number,
  p: DiagParams,
): Array<{ x: number; y: number }> {
  const wallH = (x: number) => Math.max(0, getDiagHeightAt(x, p) - MODULE_FLOOR_Y - WALL)
  const xs: number[] = [leftXOuter]
  if ((p.diagonalSide === 'left' || p.diagonalSide === 'both') && p.leftDiagTopWidth > 0) {
    const kink = p.leftDiagTopWidth
    if (kink > leftXOuter && kink < rightXOuter) xs.push(kink)
  }
  if ((p.diagonalSide === 'right' || p.diagonalSide === 'both') && p.rightDiagTopWidth > 0) {
    const kink = p.outerWidth - p.rightDiagTopWidth
    if (kink > leftXOuter && kink < rightXOuter) xs.push(kink)
  }
  xs.push(rightXOuter)
  xs.sort((a, b) => a - b)
  return xs.map((x) => ({ x: x - leftXOuter, y: wallH(x) }))
}

function ModuleSlotInteraction({ slotIndex, span, diagParams }: { slotIndex: number; span: 1 | 2; diagParams: DiagParams }) {
  const depth = useClosetStore((s) => s.depth) / 100
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const width = useClosetStore((s) => s.width) / 100
  const selectedSlot = useClosetStore((s) => s.selectedSlot)
  const setSelectedSlot = useClosetStore((s) => s.setSelectedSlot)
  const setHoveredSlot = useClosetStore((s) => s.setHoveredSlot)

  const [hovered, setHovered] = useState(false)

  const innerW = width - WALL * 2
  const slotW = innerW / moduleCount
  const moduleDepth = depth - WALL - CLOSET_INSIDE_INSET

  const isSelected = selectedSlot === slotIndex
  const totalW = span * slotW

  const leftXOuter  = WALL + slotIndex * slotW
  const rightXOuter = WALL + (slotIndex + span) * slotW

  const profile = useMemo(
    () => slotCeilingProfile(leftXOuter, rightXOuter, diagParams),
    [leftXOuter, rightXOuter, diagParams],
  )

  const maxProfileH = Math.max(...profile.map((pt) => pt.y))

  const shapeGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(totalW, 0)
    for (let i = profile.length - 1; i >= 0; i--) {
      shape.lineTo(profile[i].x, profile[i].y)
    }
    shape.closePath()
    const geo = new THREE.ShapeGeometry(shape)
    // ShapeGeometry uses raw x,y as UVs (in metres); normalize to [0,1] for the border shader
    const pos = geo.attributes.position
    const uvArr = new Float32Array(pos.count * 2)
    for (let i = 0; i < pos.count; i++) {
      uvArr[i * 2]     = pos.getX(i) / totalW
      uvArr[i * 2 + 1] = pos.getY(i) / maxProfileH
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2))
    return geo
  }, [profile, totalW, maxProfileH])

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
    return () => { document.body.style.cursor = 'auto' }
  }, [hovered])

  const bxU = useRef(uniform(BORDER_M / totalW))
  const byU = useRef(uniform(BORDER_M / maxProfileH))
  const fillAlphaU = useRef(uniform(0.0))
  const borderAlphaU = useRef(uniform(0.0))

  useEffect(() => { bxU.current.value = BORDER_M / totalW }, [totalW])
  useEffect(() => { byU.current.value = BORDER_M / maxProfileH }, [maxProfileH])
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

export default function ClosetScene() {
  const modules              = useClosetStore((s) => s.modules)
  const diagonalSide         = useClosetStore((s) => s.diagonalSide)
  const leftDiagStartHeight  = useClosetStore((s) => s.leftDiagStartHeight)
  const rightDiagStartHeight = useClosetStore((s) => s.rightDiagStartHeight)
  const leftDiagTopWidth     = useClosetStore((s) => s.leftDiagTopWidth)
  const rightDiagTopWidth    = useClosetStore((s) => s.rightDiagTopWidth)
  const outerWidth           = useClosetStore((s) => s.width)
  const mainHeightCm         = useClosetStore((s) => s.mainHeight())

  const diagParams = useMemo(() => ({
    diagonalSide,
    leftDiagStartHeight:  Math.min(leftDiagStartHeight,  mainHeightCm - 20) / 100,
    rightDiagStartHeight: Math.min(rightDiagStartHeight, mainHeightCm - 20) / 100,
    leftDiagTopWidth:  leftDiagTopWidth  / 100,
    rightDiagTopWidth: rightDiagTopWidth / 100,
    outerWidth:        outerWidth        / 100,
    mainHeight:        mainHeightCm      / 100,
  }), [diagonalSide, leftDiagStartHeight, rightDiagStartHeight, leftDiagTopWidth, rightDiagTopWidth, outerWidth, mainHeightCm])

  return (
    <ClosetMaterialProvider>
      <ClosetCorpus />
      <TopCabinet />
      <OnderstelPlinth />
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
        return <ModuleSlotInteraction key={`hit-${m.slotIndex}`} slotIndex={m.slotIndex} span={m.span} diagParams={diagParams} />
      })}
    </ClosetMaterialProvider>
  )
}
