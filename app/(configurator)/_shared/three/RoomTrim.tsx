'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three/webgpu'

/** Soft off-white living-room wall paint, shared by every configurator room shell. */
export const ROOM_WALL_COLOR = '#f1efeb'
const TRIM_COLOR = '#fbfaf8'

const SKIRTING_H = 0.045
const SKIRTING_D = 0.008

function useFlatMaterial(color: string, roughness: number) {
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, side: THREE.FrontSide }),
    [color, roughness],
  )
  useEffect(() => () => mat.dispose(), [mat])
  return mat
}

export function useRoomWallMaterial() {
  return useFlatMaterial(ROOM_WALL_COLOR, 0.92)
}

interface RoomTrimProps {
  /** Closet outer width (m); the closet is centred on x = 0 against the back wall at z = 0. */
  closetWidth: number
  /** Half width of the back wall (m). */
  backHalfWidth: number
  /** Height of the vertical part of the back wall (m). */
  backWallHeight: number
  /** z where the closet front ends and z where the room ends (m). */
  closetDepth: number
  roomFrontZ: number
  /** Ingebouwd: side walls hug the closet. Vrijstaand: open back wall with socket and switch. */
  sideWalls: boolean
}

/**
 * Skirting plus known-size architecture (socket at 300 mm, switch at 1050 mm)
 * so the room reads at real scale. Purely decorative: never casts shadows, never raycast.
 */
export default function RoomTrim({
  closetWidth: W,
  backHalfWidth,
  backWallHeight,
  closetDepth: D,
  roomFrontZ,
  sideWalls,
}: RoomTrimProps) {
  const trim = useFlatMaterial(TRIM_COLOR, 0.55)

  const sideLen = Math.max(0.001, roomFrontZ - D)
  const backLen = Math.max(0, backHalfWidth - W / 2)

  const socketX = W / 2 + 0.55
  const switchX = -(W / 2 + 0.7)
  const showSocket = !sideWalls && socketX + 0.05 < backHalfWidth
  const showSwitch = !sideWalls && -switchX + 0.05 < backHalfWidth && backWallHeight > 1.15

  return (
    <group name="room-trim" raycast={() => null}>
      {sideWalls ? (
        <>
          <mesh material={trim} position={[-W / 2 + SKIRTING_D / 2, SKIRTING_H / 2, D + sideLen / 2]} receiveShadow>
            <boxGeometry args={[SKIRTING_D, SKIRTING_H, sideLen]} />
          </mesh>
          <mesh material={trim} position={[W / 2 - SKIRTING_D / 2, SKIRTING_H / 2, D + sideLen / 2]} receiveShadow>
            <boxGeometry args={[SKIRTING_D, SKIRTING_H, sideLen]} />
          </mesh>
        </>
      ) : (
        backLen > 0.001 && (
          <>
            <mesh material={trim} position={[-(W / 2 + backLen / 2), SKIRTING_H / 2, SKIRTING_D / 2]} receiveShadow>
              <boxGeometry args={[backLen, SKIRTING_H, SKIRTING_D]} />
            </mesh>
            <mesh material={trim} position={[W / 2 + backLen / 2, SKIRTING_H / 2, SKIRTING_D / 2]} receiveShadow>
              <boxGeometry args={[backLen, SKIRTING_H, SKIRTING_D]} />
            </mesh>
          </>
        )
      )}

      {showSocket && (
        <mesh material={trim} position={[socketX, 0.3, 0.005]}>
          <boxGeometry args={[0.086, 0.086, 0.01]} />
        </mesh>
      )}
      {showSwitch && (
        <mesh material={trim} position={[switchX, 1.05, 0.005]}>
          <boxGeometry args={[0.086, 0.086, 0.01]} />
        </mesh>
      )}
    </group>
  )
}
