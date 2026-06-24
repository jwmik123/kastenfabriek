'use client'

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import type { MeasurementSpec, Vec3 } from './types'

// Screen-space projection of one measurement, written every frame by the
// projector (inside <Canvas>) and read every frame by the overlay (outside).
interface ProjectedLine {
  x1: number; y1: number
  x2: number; y2: number
  mx: number; my: number
  tx: number; ty: number // perpendicular unit vector in screen space (ticks)
  visible: boolean
}

export type ProjectedMap = Record<string, ProjectedLine>

const v3 = (v: Vec3) => new THREE.Vector3(v.x, v.y, v.z)

// --- Projector: lives inside <Canvas>, projects spec endpoints to screen ---

export function MeasurementProjector({
  projectedRef,
  specs,
}: {
  projectedRef: React.MutableRefObject<ProjectedMap>
  specs: MeasurementSpec[]
}) {
  const { camera, size } = useThree()

  useFrame(() => {
    for (const spec of specs) {
      const offset = v3(spec.offsetDir).multiplyScalar(spec.offsetDist)
      const s3 = v3(spec.p1).add(offset)
      const e3 = v3(spec.p2).add(offset)

      const sv = s3.project(camera)
      const ev = e3.project(camera)

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
        ty: len > 0 ? dx / len : 0,
        visible: true,
      }
    }
  })

  return null
}

// --- Overlay: lives outside <Canvas>, direct DOM mutation, zero re-renders ---

const TICK_PX = 8

type CacheEntry = {
  line: SVGLineElement | null
  tickL: SVGLineElement | null
  tickR: SVGLineElement | null
  label: HTMLDivElement | null
}

export function MeasurementsOverlay({
  projectedRef,
  specs,
}: {
  projectedRef: React.MutableRefObject<ProjectedMap>
  specs: MeasurementSpec[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const elCacheRef = useRef<Map<string, CacheEntry>>(new Map())

  // Re-cache DOM elements whenever specs change (e.g. module count changes).
  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    const cache = new Map<string, CacheEntry>()
    for (const spec of specs) {
      cache.set(spec.id, {
        line: root.querySelector(`[data-line="${spec.id}"]`),
        tickL: root.querySelector(`[data-tickl="${spec.id}"]`),
        tickR: root.querySelector(`[data-tickr="${spec.id}"]`),
        label: root.querySelector(`[data-label="${spec.id}"]`),
      })
    }
    elCacheRef.current = cache
  }, [specs])

  // RAF loop — direct DOM mutation, zero React re-renders.
  useEffect(() => {
    let rafId: number
    const update = () => {
      const map = projectedRef.current
      for (const [id, els] of elCacheRef.current) {
        if (!els) continue
        const p = map[id]
        const show = p?.visible ? '' : 'none'

        if (els.line) els.line.style.display = show
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
          els.label.style.top = `${p.my}px`
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
        {specs.map((s) => (
          <g key={s.id}>
            <line data-line={s.id} stroke="currentColor" strokeWidth="1" className="text-white" />
            <line data-tickl={s.id} stroke="currentColor" strokeWidth="1" className="text-white" />
            <line data-tickr={s.id} stroke="currentColor" strokeWidth="1" className="text-white" />
          </g>
        ))}
      </svg>

      {specs.map((s) => (
        <div
          key={s.id}
          data-label={s.id}
          className="measurement-label bg-background text-foreground text-xs font-medium px-1 rounded"
          style={{ position: 'absolute', transform: 'translate(-50%, -50%)' }}
        >
          {s.label} cm
        </div>
      ))}
    </div>
  )
}
