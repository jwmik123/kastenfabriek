'use client'

import { useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { useWasmachinekastStore } from '../store'

const T  = 0.01  // wall thickness (m)
const LOW_ONLY_ROOM_HEIGHT_M = 2.6  // typical NL plafond ~260cm

function buildSideWallGeo(
  ptsZY: [number, number][],
  innerX: number,
  outerX: number,
): THREE.BufferGeometry {
  const n = ptsZY.length
  const verts: number[] = []
  const rev = outerX < innerX
  for (let i = 1; i < n - 1; i++) {
    const [z0, y0] = ptsZY[0]
    const [za, ya] = ptsZY[rev ? i + 1 : i]
    const [zb, yb] = ptsZY[rev ? i : i + 1]
    verts.push(innerX, y0, z0, innerX, ya, za, innerX, yb, zb)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3))
  geo.computeVertexNormals()
  return geo
}

function buildBackWallGeo(
  ptsXY: [number, number][],
  innerZ: number,
): THREE.BufferGeometry {
  const n = ptsXY.length
  const verts: number[] = []
  for (let i = 1; i < n - 1; i++) {
    const [x0, y0] = ptsXY[0]
    const [xa, ya] = ptsXY[i]
    const [xb, yb] = ptsXY[i + 1]
    verts.push(x0, y0, innerZ, xa, ya, innerZ, xb, yb, innerZ)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3))
  geo.computeVertexNormals()
  return geo
}

export default function WasmRoomWalls() {
  const widthCm     = useWasmachinekastStore((s) => s.width)
  const heightCm    = useWasmachinekastStore((s) => s.height)
  const depthCm     = useWasmachinekastStore((s) => s.depth)
  const placementType = useWasmachinekastStore((s) => s.placementType)
  const layout      = useWasmachinekastStore((s) => s.layout)
  const lowSection  = useWasmachinekastStore((s) => s.lowSection)

  const isDual = layout === 'low-left' || layout === 'low-right'
  const totalWidthCm = isDual && lowSection ? widthCm + lowSection.width : widthCm
  const W = totalWidthCm  / 100
  const H = layout === 'low-only' ? LOW_ONLY_ROOM_HEIGHT_M : heightCm / 100
  const D = depthCm  / 100
  const RF = W * 4

  const isVrijstaand     = placementType === 'vrijstaand'
  const vrijstaandSideExt = W * 3
  const sceneHalfW       = isVrijstaand ? W / 2 + vrijstaandSideExt : W / 2
  const floorW           = isVrijstaand ? W + 2 * vrijstaandSideExt  : W + 2 * T

  const leftWallGeo = useMemo(() => {
    const pts: [number, number][] = [[-T, 0], [D + RF, 0], [D + RF, H], [-T, H]]
    return buildSideWallGeo(pts, -W / 2, -W / 2 - T)
  }, [W, H, D, RF])

  const rightWallGeo = useMemo(() => {
    const pts: [number, number][] = [[-T, 0], [D + RF, 0], [D + RF, H], [-T, H]]
    return buildSideWallGeo(pts, W / 2, W / 2 + T)
  }, [W, H, D, RF])

  const backWallGeo = useMemo(() => {
    return buildBackWallGeo(
      [[-sceneHalfW, 0], [sceneHalfW, 0], [sceneHalfW, H], [-sceneHalfW, H]],
      0,
    )
  }, [sceneHalfW, H])

  const ceilingGeo = useMemo(() => {
    const geo = new THREE.BoxGeometry(floorW, T, D + T + RF)
    return geo
  }, [floorW, D, RF])

  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, metalness: 0, side: THREE.FrontSide }),
    [],
  )
  const floorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, metalness: 0 }),
    [],
  )

  return (
    <group>
      {placementType === 'ingebouwd' && (
        <mesh geometry={leftWallGeo} material={wallMat} receiveShadow castShadow={false} />
      )}
      {placementType === 'ingebouwd' && (
        <mesh geometry={rightWallGeo} material={wallMat} receiveShadow castShadow={false} />
      )}

      <mesh geometry={backWallGeo} material={wallMat} receiveShadow castShadow={false} />

      <mesh position={[0, -T / 2, (D + RF - T) / 2]} receiveShadow castShadow={false}>
        <boxGeometry args={[floorW, T, D + T + RF]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      <mesh
        position={[0, H + T / 2, (D + RF - T) / 2]}
        geometry={ceilingGeo}
        material={wallMat}
        receiveShadow
        castShadow={false}
      />
    </group>
  )
}
