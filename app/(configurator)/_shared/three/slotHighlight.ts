import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three/webgpu'
import { uv, float, fract, time, uniform, select, positionWorld } from 'three/tsl'
import { trapGeo, trapNaN } from '@/utils/debugGeometry'

const SELECTED_BORDER_M = 0.015 // 15mm border in world space
const HOVER_BORDER_M = 0.006 // thin hover outline
const SELECTED_COLOR = 0x22c55e
const HOVER_COLOR = 0x6b7280

/**
 * Overlay material for a module slot (or its top cabinet compartment).
 * Selected: green animated striped border with a light fill.
 * Hovered only: thin, solid grey outline without fill.
 * Driven by uniforms, so state changes never rebuild the node material.
 */
export function useSlotHighlightMaterial(
  widthM: number,
  heightM: number,
  isSelected: boolean,
  hovered: boolean,
) {
  const bxU = useRef(uniform(SELECTED_BORDER_M / widthM))
  const byU = useRef(uniform(SELECTED_BORDER_M / heightM))
  const fillAlphaU = useRef(uniform(0.0))
  const borderAlphaU = useRef(uniform(0.0))
  const colorU = useRef(uniform(new THREE.Color(SELECTED_COLOR)))
  const animU = useRef(uniform(1.0))
  const borderScaleU = useRef(uniform(1.0))

  useEffect(() => { bxU.current.value = SELECTED_BORDER_M / widthM }, [widthM])
  useEffect(() => { byU.current.value = SELECTED_BORDER_M / heightM }, [heightM])
  useEffect(() => {
    fillAlphaU.current.value = isSelected ? 0.05 : 0.0
    borderAlphaU.current.value = isSelected ? 0.85 : hovered ? 0.7 : 0.0
    colorU.current.value.setHex(isSelected ? SELECTED_COLOR : HOVER_COLOR)
    animU.current.value = isSelected ? 1.0 : 0.0
    borderScaleU.current.value = isSelected ? 1.0 : HOVER_BORDER_M / SELECTED_BORDER_M
  }, [isSelected, hovered])

  return useMemo(() => {
    const uvCoord = uv()
    const bx = bxU.current.mul(borderScaleU.current)
    const by = byU.current.mul(borderScaleU.current)
    const onEdge = uvCoord.x.lessThan(bx)
      .or(float(1.0).sub(uvCoord.x).lessThan(bx))
      .or(uvCoord.y.lessThan(by))
      .or(float(1.0).sub(uvCoord.y).lessThan(by))

    const stripe = fract(positionWorld.x.sub(positionWorld.y).mul(8.0).add(time.mul(0.8)))
    const stripeOn = stripe.lessThan(float(0.5)).or(animU.current.lessThan(float(0.5)))

    const pixelAlpha = select(
      onEdge,
      select(stripeOn, borderAlphaU.current, float(0.0)),
      fillAlphaU.current,
    )

    const mat = new THREE.MeshBasicNodeMaterial()
    mat.colorNode = colorU.current
    mat.opacityNode = pixelAlpha
    mat.transparent = true
    mat.depthWrite = false
    return mat
  }, [])
}

/**
 * Flat overlay shape from y=0 up to a top edge `profile` (slot-local x, left
 * to right), with UVs normalised to the bounding box so the highlight border
 * can be drawn in UV space.
 */
export function buildSlotOverlayGeometry(
  widthM: number,
  profile: Array<{ x: number; y: number }>,
  label: string,
) {
  const maxH = Math.max(...profile.map((pt) => pt.y))
  trapNaN(widthM, `${label}-widthM`)
  trapNaN(maxH, `${label}-maxH`)
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.lineTo(widthM, 0)
  for (let i = profile.length - 1; i >= 0; i--) {
    shape.lineTo(profile[i].x, profile[i].y)
  }
  shape.closePath()
  const geo = new THREE.ShapeGeometry(shape)
  const pos = geo.attributes.position
  const uvArr = new Float32Array(pos.count * 2)
  const safeW = widthM > 0 ? widthM : 1
  const safeH = maxH > 0 ? maxH : 1
  for (let i = 0; i < pos.count; i++) {
    uvArr[i * 2]     = pos.getX(i) / safeW
    uvArr[i * 2 + 1] = pos.getY(i) / safeH
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2))
  return trapGeo(geo, `${label}-geo`)
}
