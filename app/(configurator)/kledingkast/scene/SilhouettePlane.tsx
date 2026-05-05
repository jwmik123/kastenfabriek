'use client'

import { useTexture } from '@react-three/drei'
import { useClosetStore } from '../store'

export default function SilhouettePlane() {
  const width = useClosetStore((s) => s.width) / 100
  const texture = useTexture('/silhouette.png')

  const SILHOUETTE_HEIGHT = 1.8
  const img = texture.image as HTMLImageElement
  const aspect = (img.width && img.height) ? img.width / img.height : 1
  const planeWidth = SILHOUETTE_HEIGHT * aspect

  const x = -(width / 2 + 0.3 + planeWidth / 2)

  return (
    <mesh position={[x, SILHOUETTE_HEIGHT / 2 - 0.05, -0.005]} scale={[planeWidth, SILHOUETTE_HEIGHT, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} transparent opacity={0.25} depthWrite={false} />
    </mesh>
  )
}
