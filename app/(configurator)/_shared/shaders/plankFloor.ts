/**
 * Photo-textured plank floor. One oak scan serves every plank colourway: the
 * diffuse map is normalised by its own average and re-tinted, so grain, knots
 * and seams stay photographic while the hue follows the chosen finish.
 *
 * UVs come from world XZ (V along Z), so planks run lengthwise away from the
 * cabinet and keep their physical size regardless of floor dimensions.
 */
import * as THREE from 'three/webgpu'
import { color, float, normalize, positionWorld, texture, transformNormalToView, vec3 } from 'three/tsl'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any

/** World size of one texture repeat (9 planks across) → ≈ 18 cm planks. */
const TILE_M = 1.6
/** Linear-space mean of diff.jpg / mean of rough.jpg, measured offline. */
const DIFF_MEAN: [number, number, number] = [0.2176, 0.1175, 0.0554]
const ROUGH_MEAN = 0.4715
/** Relief strength of the grain and plank bevels. */
const NORMAL_SCALE = 1.2

const cache = new Map<string, THREE.Texture>()

function loadTiled(url: string, srgb: boolean): THREE.Texture {
  let tex = cache.get(url)
  if (!tex) {
    tex = new THREE.TextureLoader().load(url)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
    tex.anisotropy = 8
    cache.set(url, tex)
  }
  return tex
}

export function createPlankFloorMaterial({ tint, roughness }: { tint: string; roughness: number }) {
  const uvNode: Node = (positionWorld as Node).xz.div(TILE_M)
  const diff: Node = texture(loadTiled('/materials/floor-oak/diff.jpg', true), uvNode)
  const rough: Node = texture(loadTiled('/materials/floor-oak/rough.jpg', false), uvNode)

  const mat = new THREE.MeshStandardNodeMaterial()
  mat.colorNode = diff.rgb.div(vec3(...DIFF_MEAN)).mul(color(tint))
  mat.roughnessNode = rough.r.mul(float(roughness / ROUGH_MEAN))
  // The floor is flat and its UVs are world XZ, so the tangent frame is fixed:
  // tangent = +X, bitangent = +Z, normal = +Y. No per-vertex tangents needed.
  const n: Node = texture(loadTiled('/materials/floor-oak/nor.jpg', false), uvNode).rgb.mul(2).sub(1)
  mat.normalNode = transformNormalToView(normalize(vec3(n.x.mul(NORMAL_SCALE), n.z, n.y.mul(NORMAL_SCALE))))
  mat.metalness = 0
  return mat
}
