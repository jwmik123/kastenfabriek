import * as THREE from 'three/webgpu'
import {
  abs,
  add,
  dFdx,
  dFdy,
  dot,
  normalize,
  pow,
  texture as tslTexture,
  vec2,
  vec3,
  vec4,
  positionWorld,
  normalLocal,
  normalWorld,
  uniform,
} from 'three/tsl'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface Vec2 {
  u: number
  v: number
}

export interface TriplanarSelection {
  uvX: Vec2
  uvY: Vec2
  uvZ: Vec2
  weights: Vec3
}

/**
 * Pure projection-selection math used by the TSL triplanar builder.
 * Exposed for unit tests; the TSL graph mirrors this logic per fragment.
 *
 * Per the PRD:
 *   - X-facing → uv = (p.z / tileU, p.y / tileV)
 *   - Z-facing → uv = (p.x / tileU, p.y / tileV)
 *   - Y-facing → uv = (p.x / tileU, p.z / tileV)
 *   - blend by pow(abs(normal), exponent), normalized
 */
export function computeTriplanarSelection(
  position: Vec3,
  normal: Vec3,
  tileU: number,
  tileV: number,
  exponent = 4,
): TriplanarSelection {
  const uvX: Vec2 = { u: position.z / tileU, v: position.y / tileV }
  const uvZ: Vec2 = { u: position.x / tileU, v: position.y / tileV }
  const uvY: Vec2 = { u: position.x / tileU, v: position.z / tileV }

  const ax = Math.pow(Math.abs(normal.x), exponent)
  const ay = Math.pow(Math.abs(normal.y), exponent)
  const az = Math.pow(Math.abs(normal.z), exponent)
  const sum = ax + ay + az
  if (sum <= 0) {
    return { uvX, uvY, uvZ, weights: { x: 0, y: 0, z: 0 } }
  }
  return {
    uvX,
    uvY,
    uvZ,
    weights: { x: ax / sum, y: ay / sum, z: az / sum },
  }
}

type AnyNode = ReturnType<typeof uniform>

export interface TriplanarBuilderInput {
  texture: THREE.Texture
  wardrobeInverse: AnyNode
  tileU: number
  tileV: number
  bumpScale: number
  exponent?: number
}

export interface TriplanarNodes {
  colorNode: AnyNode
  normalNode: AnyNode
  anisotropyTangentNode: AnyNode
}

/**
 * TSL builder mirroring `computeTriplanarSelection` per fragment.
 * Samples `texture` along three world-axis-aligned planes in
 * wardrobe-local space and blends by the surface normal.
 *
 * Returns `colorNode`, a luminance-derived `normalNode` perturbation,
 * and an `anisotropyTangentNode` carrying the per-projection grain-V
 * direction (world-Y on X/Z faces, world-Z on Y faces) blended by
 * the same weights.
 */
export function buildTriplanarNodes({
  texture,
  wardrobeInverse,
  tileU,
  tileV,
  bumpScale,
  exponent = 4,
}: TriplanarBuilderInput): TriplanarNodes {
  // Wardrobe-local position. matrixWorld is identity by default → world == local.
  const pLocal = (wardrobeInverse as any)
    .mul(vec4(positionWorld as any, 1))
    .xyz.toVar('pLocal')

  // Wardrobe-local normal — direction transform (no translation).
  const nLocal = normalize(
    (wardrobeInverse as any).mul(vec4(normalWorld as any, 0)).xyz,
  ).toVar('nLocal')

  const tU = uniform(tileU)
  const tV = uniform(tileV)

  const uvX = vec2((pLocal as any).z.div(tU), (pLocal as any).y.div(tV))
  const uvZ = vec2((pLocal as any).x.div(tU), (pLocal as any).y.div(tV))
  const uvY = vec2((pLocal as any).x.div(tU), (pLocal as any).z.div(tV))

  const absN = abs(nLocal as any)
  const wRaw = pow(absN as any, exponent)
  const wSum = (wRaw as any).x.add((wRaw as any).y).add((wRaw as any).z).add(1e-5)
  const w = (wRaw as any).div(wSum).toVar('triplanarWeights')

  const cX = (tslTexture(texture, uvX as any) as any).rgb
  const cY = (tslTexture(texture, uvY as any) as any).rgb
  const cZ = (tslTexture(texture, uvZ as any) as any).rgb

  const colorNode = (cX as any)
    .mul((w as any).x)
    .add((cY as any).mul((w as any).y))
    .add((cZ as any).mul((w as any).z))
    .toVar('triplanarColor')

  // Luminance-bump helper. Derivatives of perceived luminance perturb
  // the local normal by `bumpScale`. Used until real normal maps land.
  const lum = dot(colorNode as any, vec3(0.299, 0.587, 0.114))
  const bs = uniform(bumpScale)
  const gx = (dFdx(lum as any) as any).mul(bs)
  const gy = (dFdy(lum as any) as any).mul(bs)
  const normalNode = normalize(
    (normalLocal as any).add(vec3(gx, gy, 0)),
  ) as any

  // Anisotropy tangent in world space — grain V direction, blended.
  // X/Z faces want world-Y, Y faces want world-Z.
  const tX = vec3(0, 1, 0)
  const tYf = vec3(0, 0, 1)
  const tZ = vec3(0, 1, 0)
  const anisotropyTangentNode = add(
    (tX as any).mul((w as any).x),
    (tYf as any).mul((w as any).y),
    (tZ as any).mul((w as any).z),
  ) as any

  return { colorNode: colorNode as any, normalNode, anisotropyTangentNode }
}
