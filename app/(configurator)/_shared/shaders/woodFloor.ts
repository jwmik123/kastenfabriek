/**
 * Procedural wood floors (planken / visgraat) as TSL node materials.
 *
 * Patterns are evaluated in world XZ so they stay fixed in metres regardless
 * of the floor mesh size. The plank classification mirrors `herringboneCell`
 * and `planksCell` in ../materials/floors.ts (which carry the unit tests).
 * No textures: per-plank tint from a hash, grain from MaterialX noise, dark
 * seams between planks.
 */
import * as THREE from 'three/webgpu'
import {
  color,
  dot,
  float,
  floor,
  fract,
  min,
  mix,
  mod,
  mx_noise_float,
  positionWorld,
  select,
  sin,
  smoothstep,
  vec2,
  vec3,
} from 'three/tsl'
import {
  HERRINGBONE_PLANK_RATIO,
  HERRINGBONE_PLANK_WIDTH_M,
  type WoodPalette,
} from '../materials/floors'

// TSL node arithmetic is loosely typed; keep casts in one place.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any

export type WoodPattern = 'planks' | 'herringbone'

export interface WoodFloorParams {
  pattern: WoodPattern
  palette: WoodPalette
  roughness: number
  /** Plank width in metres. */
  plankWidth?: number
  /** Plank length as a multiple of the width. */
  ratio?: number
}

/** Half seam width in plank-width units (0.012 × 12 cm ≈ 1.4 mm). */
const SEAM_HALF = 0.012
/** Seam edge softness in plank-width units (anti-aliasing at distance). */
const SEAM_SOFT = 0.03

function hash2(p: Node, k: [number, number]): Node {
  return fract(sin(dot(p, vec2(k[0], k[1]))).mul(43758.5453))
}

/** Mirrors `rowHash` in floors.ts. */
function hash1(v: Node): Node {
  return fract(sin(v.mul(127.1).add(311.7)).mul(43758.5453))
}

interface PlankCoords {
  /** Integer plank corner, used to seed per-plank randomness. */
  origin: Node
  /** 0..1 along the plank length. */
  along: Node
  /** 0..1 across the plank width. */
  across: Node
}

function herringboneCoords(plankWidth: number, ratio: number): PlankCoords {
  const n = float(ratio)
  const twoN = float(2 * ratio)

  // World XZ → plank-width units, rotated 45° so planks are axis-aligned.
  const p: Node = (positionWorld as Node).xz.div(plankWidth)
  const s = float(Math.SQRT1_2)
  const q = vec2(p.x.sub(p.y).mul(s), p.x.add(p.y).mul(s))

  const i = floor(q.x)
  const j = floor(q.y)
  const d = mod(i.sub(j), twoN)          // GLSL-style mod → always ≥ 0
  const isH = d.lessThan(n)
  const k = twoN.sub(1).sub(d)

  const originX = select(isH, i.sub(d), i)
  const originY = select(isH, j, j.sub(k))
  const along = select(isH, q.x.sub(originX), q.y.sub(originY)).div(n)
  const across = select(isH, q.y.sub(originY), q.x.sub(originX))
  return { origin: vec2(originX, originY), along, across }
}

function planksCoords(plankWidth: number, ratio: number): PlankCoords {
  const length = plankWidth * ratio
  const p: Node = (positionWorld as Node).xz
  const row = floor(p.y.div(plankWidth))
  const across = p.y.div(plankWidth).sub(row)
  const u = p.x.add(hash1(row).mul(length)).div(length)
  const col = floor(u)
  return { origin: vec2(col, row), along: u.sub(col), across }
}

export interface WoodFloorNodes {
  colorNode: Node
  roughnessNode: Node
}

export function buildWoodFloorNodes({
  pattern,
  palette,
  roughness,
  plankWidth = HERRINGBONE_PLANK_WIDTH_M,
  ratio = HERRINGBONE_PLANK_RATIO,
}: WoodFloorParams): WoodFloorNodes {
  // Plain node graph (no Fn): the same node instances feed both colorNode and
  // roughnessNode, so the builder emits the pattern math once per fragment.
  const { origin, along, across } =
    pattern === 'herringbone' ? herringboneCoords(plankWidth, ratio) : planksCoords(plankWidth, ratio)
  const n = float(ratio)

  // Per-plank randoms
  const r1 = hash2(origin, [127.1, 311.7])
  const r2 = hash2(origin, [269.5, 183.3])

  // Grain: noise stretched along the plank, offset per plank so no two match.
  const grainCoord = vec3(
    along.mul(n).mul(1.6).add(r2.mul(40)),
    across.mul(14).add(r1.mul(60)),
    r1.mul(7),
  )
  const grain = mx_noise_float(grainCoord)                       // ≈ -1..1
  const fine = mx_noise_float(grainCoord.mul(vec3(4, 2.5, 1)))   // finer streaks

  // Seams: distance to nearest plank edge (in plank-width units).
  const edgeAcross = min(across, float(1).sub(across))
  const edgeAlong = min(along, float(1).sub(along)).mul(n)
  const edge = min(edgeAcross, edgeAlong)
  const plankMask = smoothstep(float(SEAM_HALF), float(SEAM_HALF + SEAM_SOFT), edge)

  const tint = mix(color(palette.dark), color(palette.light), r1)
  const wood = tint.mul(
    float(1).add(grain.mul(0.07)).add(fine.mul(0.035)),
  )
  const colorNode = mix(color(palette.gap), wood, plankMask)

  // Seams are rougher (no lacquer).
  const r = float(roughness).add(grain.mul(0.06))
  const roughnessNode = mix(float(0.95), r, plankMask)

  return { colorNode, roughnessNode }
}

export function createWoodFloorMaterial(params: WoodFloorParams): THREE.MeshStandardNodeMaterial {
  const mat = new THREE.MeshStandardNodeMaterial()
  const { colorNode, roughnessNode } = buildWoodFloorNodes(params)
  mat.colorNode = colorNode
  mat.roughnessNode = roughnessNode
  mat.metalness = 0
  return mat
}
