'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { useClosetStore } from '../store'
import { getLayoutById } from '../scene/moduleLayouts'

// Mirror constants from ThreeCanvas
const WALL = 0.018
const MODULE_WALL = 0.018
const ONDERSTEL_HEIGHT = 0.108
const ONDERSTEL_GAP = 0.010
const MODULE_FLOOR_Y = ONDERSTEL_HEIGHT + ONDERSTEL_GAP // 0.118m — where module boxes start

// --- Types ---

interface MeasurementSpec {
  id: string
  p1: THREE.Vector3
  p2: THREE.Vector3
  offsetDir: THREE.Vector3
  offsetDist: number
  labelCm: any
}

interface ProjectedLine {
  x1: number; y1: number
  x2: number; y2: number
  mx: number; my: number
  tx: number; ty: number  // perpendicular unit vector in screen space (for ticks)
  visible: boolean
}

export type ProjectedMap = Record<string, ProjectedLine>

// --- Build measurement specs from store ---

function useMeasurementSpecs(): MeasurementSpec[] {
  const widthM      = useClosetStore(s => s.width)  / 100
  const heightM     = useClosetStore(s => s.height) / 100
  const depthM      = useClosetStore(s => s.depth)  / 100
  const moduleCount = useClosetStore(s => s.moduleCount)
  const modules     = useClosetStore(s => s.modules)
  const widthCm     = useClosetStore(s => s.width)
  const heightCm    = useClosetStore(s => s.height)

  return useMemo(() => {
    const innerW = widthM - WALL * 2
    const slotW  = innerW / moduleCount
    const frontZ = depthM + 0.02

    const specs: MeasurementSpec[] = []

    // 1. Total width — horizontal, below the closet floor
    specs.push({
      id: 'total-width',
      p1: new THREE.Vector3(-widthM / 2, 0, frontZ),
      p2: new THREE.Vector3( widthM / 2, 0, frontZ),
      offsetDir: new THREE.Vector3(0, -1, 0),
      offsetDist: 0.14,
      labelCm: widthCm,
    })

    // 2. Total height — vertical, left of the closet
    specs.push({
      id: 'total-height',
      p1: new THREE.Vector3(-widthM / 2, 0,       frontZ),
      p2: new THREE.Vector3(-widthM / 2, heightM, frontZ),
      offsetDir: new THREE.Vector3(-1, 0, 0),
      offsetDist: 0.22,
      labelCm: heightCm,
    })

    // 3. Per-module inner clear widths — horizontal, at MODULE_FLOOR_Y height
    //    Spans from inner left face to inner right face of each slot
    for (let i = 0; i < moduleCount; i++) {
      const x1 = -innerW / 2 + i * slotW + MODULE_WALL
      const x2 = -innerW / 2 + (i + 1) * slotW - MODULE_WALL
      specs.push({
        id: `module-width-${i}`,
        p1: new THREE.Vector3(x1, MODULE_FLOOR_Y, frontZ),
        p2: new THREE.Vector3(x2, MODULE_FLOOR_Y, frontZ),
        offsetDir: new THREE.Vector3(0, -1, 0),
        offsetDist: 0.06,
        labelCm:((x2 - x1) * 100).toFixed(1),
      })
    }

    // 4. Special element heights — vertical, just inside the left wall of each module
    //    From MODULE_FLOOR_Y to MODULE_FLOOR_Y + specialElement.height
    for (const mod of modules) {
      if (mod.layoutId === null) continue
      const layout = getLayoutById(mod.layoutId)
      if (!layout || layout.specialElement.height <= 0) continue

      // Place the line 2cm inside the module's left inner wall
      const x = -innerW / 2 + mod.slotIndex * slotW + MODULE_WALL + 0.02

      specs.push({
        id: `special-height-${mod.slotIndex}`,
        p1: new THREE.Vector3(x, MODULE_FLOOR_Y,                               frontZ),
        p2: new THREE.Vector3(x, MODULE_FLOOR_Y + layout.specialElement.height, frontZ),
        offsetDir: new THREE.Vector3(1, 0, 0), // irrelevant — offsetDist is 0
        offsetDist: 0,
        labelCm: Math.round(layout.specialElement.height * 100),
      })
    }

    return specs
  }, [widthM, heightM, depthM, moduleCount, modules, widthCm, heightCm])
}

// --- MeasurementProjector: lives inside <Canvas> ---

interface ProjectorProps {
  projectedRef: React.MutableRefObject<ProjectedMap>
  specs: MeasurementSpec[]
}

export function MeasurementProjector({ projectedRef, specs }: ProjectorProps) {
  const { camera, size } = useThree()

  useFrame(() => {
    
    for (const spec of specs) {
      const offset = spec.offsetDir.clone().multiplyScalar(spec.offsetDist)
      const s3 = spec.p1.clone().add(offset)
      const e3 = spec.p2.clone().add(offset)

      const sv = s3.clone().project(camera)
      const ev = e3.clone().project(camera)

      if (sv.z > 1 || ev.z > 1) {
        const existing = projectedRef.current[spec.id]
        if (existing) existing.visible = false
        continue
      }

      const sx = (sv.x + 1) / 2 * size.width
      const sy = (1 - sv.y) / 2 * size.height
      const ex = (ev.x + 1) / 2 * size.width
      const ey = (1 - ev.y) / 2 * size.height

      const dx = ex - sx
      const dy = ey - sy
      const len = Math.sqrt(dx * dx + dy * dy)

      projectedRef.current[spec.id] = {
        x1: sx, y1: sy,
        x2: ex, y2: ey,
        mx: (sx + ex) / 2,
        my: (sy + ey) / 2,
        tx: len > 0 ? -dy / len : 0,
        ty: len > 0 ?  dx / len : 0,
        visible: true,
      }
    }
  })

  return null
}

// --- MeasurementsOverlay: lives outside <Canvas> ---

const TICK_PX = 8

interface OverlayProps {
  projectedRef: React.MutableRefObject<ProjectedMap>
  specs: MeasurementSpec[]
}

function MeasurementsOverlay({ projectedRef, specs }: OverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const elCacheRef = useRef<Map<string, {
    line:  SVGLineElement | null
    tickL: SVGLineElement | null
    tickR: SVGLineElement | null
    label: HTMLDivElement | null
  }>>(new Map())

  // Re-cache DOM elements whenever specs change (e.g. module count changes)
  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    const cache = new Map<string, { line: SVGLineElement | null; tickL: SVGLineElement | null; tickR: SVGLineElement | null; label: HTMLDivElement | null }>()
    for (const spec of specs) {
      cache.set(spec.id, {
        line:  root.querySelector(`[data-line="${spec.id}"]`),
        tickL: root.querySelector(`[data-tickl="${spec.id}"]`),
        tickR: root.querySelector(`[data-tickr="${spec.id}"]`),
        label: root.querySelector(`[data-label="${spec.id}"]`),
      })
    }
    elCacheRef.current = cache
  }, [specs])

  // RAF loop — direct DOM mutation, zero React re-renders
  useEffect(() => {
    let rafId: number

    const update = () => {
      const map = projectedRef.current

      for (const [id, els] of elCacheRef.current) {
        if (!els) continue
        const p = map[id]
        const show = p?.visible ? '' : 'none'

        if (els.line)  els.line.style.display  = show
        if (els.tickL) els.tickL.style.display = show
        if (els.tickR) els.tickR.style.display = show
        if (els.label) els.label.style.display = p?.visible ? 'block' : 'none'

        if (!p?.visible) continue

        if (els.line) {
          els.line.setAttribute('x1', String(p.x1))
          els.line.setAttribute('y1', String(p.y1))
          els.line.setAttribute('x2', String(p.x2))
          els.line.setAttribute('y2', String(p.y2))
        }
        if (els.tickL) {
          els.tickL.setAttribute('x1', String(p.x1 - p.tx * TICK_PX))
          els.tickL.setAttribute('y1', String(p.y1 - p.ty * TICK_PX))
          els.tickL.setAttribute('x2', String(p.x1 + p.tx * TICK_PX))
          els.tickL.setAttribute('y2', String(p.y1 + p.ty * TICK_PX))
        }
        if (els.tickR) {
          els.tickR.setAttribute('x1', String(p.x2 - p.tx * TICK_PX))
          els.tickR.setAttribute('y1', String(p.y2 - p.ty * TICK_PX))
          els.tickR.setAttribute('x2', String(p.x2 + p.tx * TICK_PX))
          els.tickR.setAttribute('y2', String(p.y2 + p.ty * TICK_PX))
        }
        if (els.label) {
          els.label.style.left = `${p.mx}px`
          els.label.style.top  = `${p.my}px`
        }
      }

      rafId = requestAnimationFrame(update)
    }

    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [projectedRef])

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" overflow="visible">
        {specs.map(s => (
          <g key={s.id}>
            <line data-line={s.id}  stroke="currentColor" strokeWidth="1" className="text-white" />
            <line data-tickl={s.id} stroke="currentColor" strokeWidth="1" className="text-white" />
            <line data-tickr={s.id} stroke="currentColor" strokeWidth="1" className="text-white" />
          </g>
        ))}
      </svg>

      {specs.map(s => (
        <div
          key={s.id}
          data-label={s.id}
          className="measurement-label bg-background text-foreground text-xs font-medium px-1 rounded"
          style={{ position: 'absolute', transform: 'translate(-50%, -50%)' }}
        >
          {s.labelCm} cm
        </div>
      ))}
    </div>
  )
}

// --- Public exports: gated on showMeasurements ---

export function MeasurementProjectorLayer({
  projectedRef,
}: {
  projectedRef: React.MutableRefObject<ProjectedMap>
}) {
  const show  = useClosetStore(s => s.showMeasurements)
  const specs = useMeasurementSpecs()
  if (!show) return null
  return <MeasurementProjector projectedRef={projectedRef} specs={specs} />
}

export function MeasurementsOverlayLayer({
  projectedRef,
}: {
  projectedRef: React.MutableRefObject<ProjectedMap>
}) {
  const show  = useClosetStore(s => s.showMeasurements)
  const specs = useMeasurementSpecs()
  if (!show) return null
  return <MeasurementsOverlay projectedRef={projectedRef} specs={specs} />
}
