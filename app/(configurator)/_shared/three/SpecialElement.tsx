'use client'

import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three/webgpu'
import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import type { ModuleLayoutConfig } from '../../kledingkast/scene/moduleLayouts'
import { useClosetMaterialInstance, useChromeMaterialInstance, useGlassMaterialInstance } from '../materials/ClosetMaterial'
import { useConfiguratorStore } from '../store/context'

// All nodes in module GLBs carry a -90° Y rotation.
// After that rotation: local X → world Z (depth), local Z → world X (width).
// So sceneSize.x = WIDTH, sceneSize.z = DEPTH.
//
// Mesh name suffixes drive scaling:
//   _ds  → geometry.scale(depthScale, 1, 1)   stretches local X → world Z (depth)
//   _ws  → geometry.scale(1, 1, widthScale)   stretches local Z → world X (width)
//
// Mesh name tokens drive positioning:
//   Right  (no _ws) → mesh.position.x += widthGrowth      clamps to right edge
//   Middle (no _ws) → mesh.position.x += widthGrowth / 2  stays centered in width
//   Back            → back-anchored, suppresses front-anchor shift
//   Left / none     → left-anchored / front-anchored

const MODULE_WALL = 0.018

interface SpecialElementProps {
  layout: ModuleLayoutConfig
  targetWidth: number  // slot width in meters
  targetDepth: number  // module depth in meters
  positionY: number    // Y of the element's bottom in module-group space
  hovered: boolean
  hasDoor: boolean
}

interface MeshOriginal {
  pos: THREE.Vector3
}

function SpecialElementInner({
  layout,
  targetWidth,
  targetDepth,
  positionY,
  hovered,
  hasDoor,
}: SpecialElementProps) {
  const { scene, animations } = useGLTF(layout.specialElement.glbPath!)
  const closetMaterial = useClosetMaterialInstance(hasDoor ? 'binnenkant' : 'buitenkant')
  const chromeMaterial = useChromeMaterialInstance()
  const glassMaterial  = useGlassMaterialInstance()

  const doorsOpen = useConfiguratorStore((s) => s.doorsOpen)

  const proxyRef = useRef({ t: 0 })
  const hoveredRef = useRef(hovered)
  useEffect(() => { hoveredRef.current = hovered }, [hovered])

  const isStacked  = !!layout.specialElement.stacked
  const isDouble   = !!layout.specialElement.double
  const isCentered = !!layout.specialElement.centered

  const [{ clone, clone2, originals, box, clonedClips }] = useState(() => {
    const c = scene.clone(true)
    const b = new THREE.Box3().setFromObject(c)
    const origs = new Map<string, MeshOriginal>()

    c.traverse((child: THREE.Object3D) => {
      if (!(child as THREE.Mesh).isMesh) return
      const mesh = child as THREE.Mesh
      origs.set(mesh.uuid, {
        pos: mesh.position.clone(),
      })
    })

    const clips = animations.map(clip => {
      const cl = clip.clone()
      cl.tracks.forEach(track => {
        ;(track as any)._origValues = track.values.slice()
      })
      return cl
    })

    const c2 = (isStacked || isDouble) ? scene.clone(true) : null

    return { clone: c, clone2: c2, originals: origs, box: b, clonedClips: clips }
  })

  // For double: washer 1 flush with left wall, washer 2 directly adjacent (0 gap)
  const offsetX = isDouble
    ? -box.min.x + MODULE_WALL
    : isCentered
      ? MODULE_WALL + targetWidth / 2 - (box.min.x + box.max.x) / 2
      : -box.min.x + MODULE_WALL
  const offsetZ = -box.min.z + (!hasDoor ? (layout.specialElement.noDoorDepthOffset ?? 0) : 0)

  const { actions } = useAnimations(clonedClips, clone)

  useEffect(() => {
    const glbMeshes    = new Set(layout.specialElement.glbMaterialMeshes ?? [])
    const chromeMeshes = new Set(layout.specialElement.chromeMaterialMeshes ?? [])
    const glassMeshes  = new Set(layout.specialElement.glassMaterialMeshes ?? [])
    const applyMaterial = (obj: THREE.Object3D) => {
      obj.traverse((child: THREE.Object3D) => {
        if (!(child as THREE.Mesh).isMesh) return
        const mesh = child as THREE.Mesh
        if (glbMeshes.has(mesh.name)) return
        if (glassMeshes.has(mesh.name)) { mesh.material = glassMaterial; return }
        const isChrome = chromeMeshes.has(mesh.name) || mesh.name.includes('Metal')
        mesh.material = isChrome ? chromeMaterial : closetMaterial
        mesh.castShadow = true
        mesh.receiveShadow = true
      })
    }
    applyMaterial(clone)
    if (clone2) applyMaterial(clone2)
  }, [clone, clone2, closetMaterial, chromeMaterial, glassMaterial, layout.specialElement.glbMaterialMeshes, layout.specialElement.chromeMaterialMeshes, layout.specialElement.glassMaterialMeshes])

  useEffect(() => {
    const action = Object.values(actions)[0]
    if (action) {
      gsap.killTweensOf(proxyRef.current)
      proxyRef.current.t = 0
      action.reset()
      action.play()
      action.paused = true
      action.time = 0
    }

    const originalWidth = box.max.x - box.min.x
    const originalDepth = box.max.z - box.min.z
    const widthScale  = targetWidth / originalWidth
    const depthScale  = targetDepth / originalDepth
    const widthGrowth = targetWidth - originalWidth
    const depthGrowth = targetDepth - originalDepth

    clone.traverse((child: THREE.Object3D) => {
      if (!(child as THREE.Mesh).isMesh) return
      const mesh = child as THREE.Mesh
      const original = originals.get(mesh.uuid)
      if (!original) return

      mesh.scale.set(1, 1, 1)
      mesh.position.copy(original.pos)

      const hasDS    = mesh.name.includes('_ds')
      const hasWS    = mesh.name.includes('_ws')
      const isRight  = mesh.name.includes('Right')
      const isMiddle = mesh.name.includes('Middle')
      const isBack   = (() => {
        let cur: THREE.Object3D | null = mesh
        while (cur) {
          if (cur.name.includes('Back')) return true
          cur = cur.parent
        }
        return false
      })()

      const isWMSingle = (() => {
        let cur: THREE.Object3D | null = mesh
        while (cur) {
          if (cur.name.includes('WMDoubleMachine')) return true
          if (cur.name.includes('WMPlankMachine')) return true
          if (cur.name.includes('WMSingleMachine')) return true
          cur = cur.parent
        }
        return false
      })()

      if (hasDS && hasWS) {
        mesh.scale.set(depthScale, 1, widthScale)
      } else if (hasDS) {
        mesh.scale.x = depthScale
      } else if (hasWS) {
        mesh.scale.z = widthScale
      }

      if (isRight && !hasWS) {
        mesh.position.x += widthGrowth
      } else if (isMiddle && !hasWS) {
        mesh.position.x += widthGrowth / 2
      }

      if (!hasDS && !isBack) {
        if (isWMSingle) {
          mesh.position.x += depthGrowth
        } else {
          mesh.position.z += depthGrowth
        }
      }
    })

    const meshByName = new Map<string, THREE.Object3D>()
    clone.traverse((child: THREE.Object3D) => meshByName.set(child.name, child))

    clonedClips.forEach(clip => {
      clip.tracks.forEach(track => {
        if (!track.name.endsWith('.position')) return
        const meshName = track.name.slice(0, -'.position'.length)
        const child = meshByName.get(meshName)
        const original = originals.get((child as THREE.Mesh | undefined)?.uuid ?? '')
        const origValues = (track as any)._origValues as Float32Array | undefined
        if (!child || !original || !origValues) return

        const dx = child.position.x - original.pos.x
        const dy = child.position.y - original.pos.y
        const dz = child.position.z - original.pos.z

        for (let i = 0; i < track.values.length; i += 3) {
          track.values[i]     = origValues[i]     + dx
          track.values[i + 1] = origValues[i + 1] + dy
          track.values[i + 2] = origValues[i + 2] + dz
        }
      })
    })

    if (action) {
      const targetT = hoveredRef.current ? action.getClip().duration : 0
      proxyRef.current.t = targetT
      action.time = targetT
    }
  }, [clone, originals, box, clonedClips, actions, targetWidth, targetDepth])

  useEffect(() => {
    const action = Object.values(actions)[0]
    if (!action) return
    action.reset()
    action.play()
    action.paused = true
    action.time = 0
    proxyRef.current.t = 0
  }, [actions])

  useEffect(() => {
    const action = Object.values(actions)[0]
    if (!action) return
    const duration = action.getClip().duration
    gsap.killTweensOf(proxyRef.current)
    gsap.to(proxyRef.current, {
      t: hovered && doorsOpen ? duration : 0,
      duration: 0.6,
      ease: 'power2.inOut',
      onUpdate: () => {
        action.time = Math.max(0, Math.min(duration, proxyRef.current.t))
      },
    })
  }, [hovered, doorsOpen, actions])

  // clone2 doesn't get the traverse treatment (mesh positions shifted by depthGrowth),
  // so compensate with an explicit Z offset. Use actual GLB dimensions from box.
  const washerHeight = box.max.y - box.min.y
  const depthGrowth  = targetDepth - (box.max.z - box.min.z)

  return (
    <>
      <group position={[offsetX, positionY, offsetZ]}>
        <primitive object={clone} />
      </group>
      {isStacked && clone2 && (
        <group position={[offsetX, positionY + washerHeight, offsetZ + depthGrowth]}>
          <primitive object={clone2} />
        </group>
      )}
      {isDouble && clone2 && (
        <group position={[offsetX + (box.max.x - box.min.x), positionY, offsetZ + depthGrowth]}>
          <primitive object={clone2} />
        </group>
      )}
    </>
  )
}

function WasherPlaceholder({ layout, positionY }: Pick<SpecialElementProps, 'layout' | 'positionY'>) {
  const dims = layout.specialElement.placeholderDimensions
  if (!dims) return null
  return (
    <mesh position={[dims.w / 2, positionY + dims.h / 2, dims.d / 2]} castShadow receiveShadow>
      <boxGeometry args={[dims.w, dims.h, dims.d]} />
      <meshStandardMaterial color="#aaaaaa" roughness={0.6} metalness={0.1} />
    </mesh>
  )
}

export default function SpecialElement(props: SpecialElementProps) {
  if (!props.layout.specialElement.glbPath) {
    return <WasherPlaceholder layout={props.layout} positionY={props.positionY} />
  }
  return <SpecialElementInner key={props.layout.specialElement.glbPath} {...props} />
}
