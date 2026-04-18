import {
  positionWorld,
  normalWorld,
  float,
  vec3,
  smoothstep,
  clamp,
  uniform,
  select,
  max,
  type Node,
} from 'three/tsl'
import * as THREE from 'three/webgpu'

export interface StripWarmthUniforms {
  uEnabled: Node
  uStartA: Node
  uEndA: Node
  uStartB: Node
  uEndB: Node
  uRadius: Node
  uColor: Node
  uIntensity: Node
}

export function createStripWarmthUniforms(): StripWarmthUniforms {
  return {
    uEnabled:   uniform(0),
    uStartA:    uniform(new THREE.Vector3()),
    uEndA:      uniform(new THREE.Vector3()),
    uStartB:    uniform(new THREE.Vector3()),
    uEndB:      uniform(new THREE.Vector3()),
    uRadius:    uniform(0.45),
    uColor:     uniform(new THREE.Color(0xffad5c)),
    uIntensity: uniform(0.5),
  }
}

function warmthFromStrip(
  fragPos: Node,
  segStart: Node,
  segEnd: Node,
  radius: Node,
  color: Node,
  intensity: Node,
) {
  // Closest point on the strip line segment (clamped)
  const ab = (segEnd as any).sub(segStart)
  const ap = (fragPos as any).sub(segStart)
  const t  = clamp((ap as any).dot(ab).div((ab as any).dot(ab).add(1e-8)), 0.0, 1.0)
  const closest  = (segStart as any).add((ab as any).mul(t))
  const d        = (fragPos as any).sub(closest).length()
  const falloff  = (smoothstep(radius, float(0.0), d) as any).pow(float(0.6))
  return (color as any).mul(falloff).mul(intensity)
}

export function buildWarmthNode(u: StripWarmthUniforms) {
  const p  = positionWorld
  const wA = warmthFromStrip(p as any, u.uStartA, u.uEndA, u.uRadius, u.uColor, u.uIntensity)
  const wB = warmthFromStrip(p as any, u.uStartB, u.uEndB, u.uRadius, u.uColor, u.uIntensity)
  // Exclude Z-facing surfaces (drawer fronts, shelf front edges, door panels).
  // Side walls (±X normal) and shelf tops/bottoms (±Y normal) are unaffected.
  const absNZ    = (normalWorld as any).z.abs()
  const zMask    = smoothstep(float(0.7), float(0.4), absNZ)
  const combined = (max(wA, wB) as any).mul(zMask)
  const enabled  = (u.uEnabled as any).greaterThan(float(0.5))
  return select(enabled, combined, vec3(0, 0, 0))
}
