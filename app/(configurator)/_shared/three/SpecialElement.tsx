'use client'

import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import type { ModuleElement } from '../../kledingkast/scene/moduleLayouts'
import { useClosetMaterialInstance, useChromeMaterialInstance, useGlassMaterialInstance } from '../materials/ClosetMaterial'
import { useConfiguratorStore } from '../store/context'
import { HandleByType } from '../objects/Handles'
import type { HandleMaterial, LeatherColor } from '../constants/handleMaterials'

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
  element: ModuleElement
  targetWidth: number  // slot width in meters
  targetDepth: number  // module depth in meters
  positionY: number    // Y of the element's bbox bottom in module-group space
  hasDoor: boolean
  /**
   * Interior finish: closed modules take the binnenkant colour. Separate from
   * `hasDoor`, which also drives the depth offset — a washer module has no
   * full-height door but is still finished on the inside.
   */
  insideFinish: boolean
  /**
   * True when the element's Front* meshes are visible from outside the cabinet
   * (a washer module: finished inside, but no full-height door in front of the
   * drawers). Those fronts then take the buitenkant colour like any other
   * exposed front.
   */
  exposedFronts?: boolean
  // When set, render a horizontal handle centered on each Front* mesh
  // (kitchen-style lage kast fronts).
  drawerHandle?: {
    id: string
    meshId?: string
    material?: HandleMaterial
    bodyColor?: LeatherColor
    /** Keep the handle upright instead of turning it onto its side. */
    noRotation?: boolean
  } | null
  // Module-local Y where the bottom edge of meshes named *_extend should land
  // (2 cm above the room floor when "deuren tot vloer" is on). The mesh is
  // stretched downward, its top edge stays fixed. Null/undefined = no stretch.
  extendFrontBottomY?: number | null
}

// Same edge inset as the door handle's distance from the door side (Door.tsx
// handleX = slotW - 0.055): drawer handles sit 5.5 cm below the front's top.
const DRAWER_HANDLE_TOP_INSET = 0.055

interface MeshOriginal {
  pos: THREE.Vector3
}

function SpecialElementInner({
  element,
  targetWidth,
  targetDepth,
  positionY,
  hasDoor,
  insideFinish,
  exposedFronts = false,
  drawerHandle = null,
  extendFrontBottomY = null,
}: SpecialElementProps) {
  const { scene, animations } = useGLTF(element.glbPath)
  const closetMaterial = useClosetMaterialInstance(insideFinish ? 'binnenkant' : 'buitenkant')
  const outerMaterial  = useClosetMaterialInstance('buitenkant')
  const chromeMaterial = useChromeMaterialInstance()
  const glassMaterial  = useGlassMaterialInstance()

  const doorsOpen = useConfiguratorStore((s) => s.doorsOpen)

  const proxyRef = useRef({ t: 0 })
  // Drawers follow the "deuren open" toggle, not hover: opening the doors slides
  // every drawer out, closing them slides all of them back.
  const doorsOpenRef = useRef(doorsOpen)
  useEffect(() => { doorsOpenRef.current = doorsOpen }, [doorsOpen])

  // Clone-space boxes of Front* meshes, measured after the transform pass —
  // drives horizontal front handles (kitchen-style lage kast fronts). Each
  // entry keeps the mesh + its static (post-transform, pre-animation)
  // position so the handle can follow the drawer-open hover animation.
  const [drawerFronts, setDrawerFronts] = useState<
    Array<{
      cx: number
      topY: number
      frontZ: number
      mesh: THREE.Mesh
      staticPos: THREE.Vector3
    }>
  >([])
  const handleRefs = useRef<Array<THREE.Group | null>>([])

  const isCentered = !!element.centered

  const [{ clone, originals, box, clonedClips }] = useState(() => {
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

    return { clone: c, originals: origs, box: b, clonedClips: clips }
  })

  // Slot-filling elements (widthScaleMeshes) grow by the slot's growth over the
  // width they were modelled at, measured on the module — not on the corpus
  // opening the bbox-relative scale uses. Every listed mesh keeps its left edge,
  // so the element's post-transform width is its bbox width plus that growth.
  const slotGrowth =
    element.nativeSlotWidth && element.widthScaleMeshes?.length
      ? targetWidth + MODULE_WALL * 2 - element.nativeSlotWidth
      : null

  const offsetX = isCentered
    ? MODULE_WALL + targetWidth / 2 - (box.min.x + box.max.x + (slotGrowth ?? 0)) / 2
    : -box.min.x + MODULE_WALL
  const offsetZ = -box.min.z + (!hasDoor ? (element.noDoorDepthOffset ?? 0) : 0)
  // Subtract bbox.min.y so positionY refers to the bbox bottom, not the GLB origin.
  const offsetY = positionY - box.min.y

  const { actions } = useAnimations(clonedClips, clone)

  useEffect(() => {
    const glbMeshes    = new Set(element.glbMaterialMeshes ?? [])
    const chromeMeshes = new Set(element.chromeMaterialMeshes ?? [])
    const glassMeshes  = new Set(element.glassMaterialMeshes ?? [])
    const applyMaterial = (obj: THREE.Object3D) => {
      obj.traverse((child: THREE.Object3D) => {
        if (!(child as THREE.Mesh).isMesh) return
        const mesh = child as THREE.Mesh
        if (glbMeshes.has(mesh.name)) return
        if (glassMeshes.has(mesh.name)) { mesh.material = glassMaterial; return }
        const isChrome = chromeMeshes.has(mesh.name) || mesh.name.includes('Metal')
        const isExposedFront = exposedFronts && mesh.name.includes('Front')
        mesh.material = isChrome
          ? chromeMaterial
          : isExposedFront
            ? outerMaterial
            : closetMaterial
        mesh.castShadow = true
        mesh.receiveShadow = true
      })
    }
    applyMaterial(clone)
  }, [clone, closetMaterial, outerMaterial, exposedFronts, chromeMaterial, glassMaterial, element.glbMaterialMeshes, element.chromeMaterialMeshes, element.glassMaterialMeshes])

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

    const wsMeshes = new Set(element.widthScaleMeshes ?? [])
    const originalWidth = box.max.x - box.min.x
    const originalDepth = box.max.z - box.min.z
    const widthScale  = targetWidth / originalWidth
    const depthScale  = targetDepth / originalDepth
    // slotGrowth is measured on the module for slot-filling elements; without
    // it, growth is the element bbox's own change towards the corpus opening.
    const widthGrowth = slotGrowth ?? targetWidth - originalWidth
    const depthGrowth = targetDepth - originalDepth

    clone.traverse((child: THREE.Object3D) => {
      if (!(child as THREE.Mesh).isMesh) return
      const mesh = child as THREE.Mesh
      const original = originals.get(mesh.uuid)
      if (!original) return

      mesh.scale.set(1, 1, 1)
      mesh.position.copy(original.pos)

      const hasDS    = mesh.name.includes('_ds')
      const hasWS    = mesh.name.includes('_ws') || wsMeshes.has(mesh.name)
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

      // `widthScaleMeshes` grows a mesh by exactly widthGrowth with its left
      // edge pinned, instead of scaling it proportionally about the origin.
      // Side panels and runners move by widthGrowth too, so a proportional
      // stretch would leave the drawer bottom short of them by its left inset.
      let widthFactor = 1
      if (wsMeshes.has(mesh.name)) {
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
        const gz = mesh.geometry.boundingBox!
        const spanZ = gz.max.z - gz.min.z
        if (spanZ > 1e-6) {
          widthFactor = (spanZ + widthGrowth) / spanZ
          // Local +Z maps to world -X, so the local max edge is the world min.
          mesh.position.x += gz.max.z * (widthFactor - 1)
        }
      } else if (hasWS) {
        widthFactor = widthScale
      }

      if (hasDS) mesh.scale.x = depthScale
      mesh.scale.z = widthFactor

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

      // `_extend` convention: stretch the front downward so its bottom edge
      // lands at extendFrontBottomY (module-group space), keeping the top
      // edge fixed. The group shifts the clone by offsetY, so convert the
      // target into clone space first. Y is unaffected by the shared -90° Y
      // rotation, so scaling local Y is safe.
      if (extendFrontBottomY != null && mesh.name.includes('_extend')) {
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
        const g = mesh.geometry.boundingBox!
        const targetY = extendFrontBottomY - (positionY - box.min.y)
        const topY = original.pos.y + g.max.y
        const bottomY = original.pos.y + g.min.y
        if (topY - bottomY > 1e-6 && targetY < bottomY) {
          const s = (topY - targetY) / (topY - bottomY)
          mesh.scale.y = s
          mesh.position.y = original.pos.y + g.max.y * (1 - s)
        }
      }
    })

    const fronts: Array<{
      cx: number
      topY: number
      frontZ: number
      mesh: THREE.Mesh
      staticPos: THREE.Vector3
    }> = []
    clone.traverse((child: THREE.Object3D) => {
      if (!(child as THREE.Mesh).isMesh) return
      const mesh = child as THREE.Mesh
      if (!mesh.name.includes('Front')) return
      mesh.updateMatrix()
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
      const b = mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrix)
      fronts.push({
        cx: (b.min.x + b.max.x) / 2,
        topY: b.max.y,
        frontZ: b.max.z,
        mesh,
        staticPos: mesh.position.clone(),
      })
    })
    fronts.sort((a, b) => a.topY - b.topY)
    setDrawerFronts(fronts)

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
      const targetT = doorsOpenRef.current ? action.getClip().duration : 0
      proxyRef.current.t = targetT
      action.time = targetT
    }
  }, [clone, originals, box, clonedClips, actions, targetWidth, targetDepth, extendFrontBottomY, positionY, element.widthScaleMeshes, slotGrowth])

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
      t: doorsOpen ? duration : 0,
      duration: 0.6,
      ease: 'power2.inOut',
      onUpdate: () => {
        action.time = Math.max(0, Math.min(duration, proxyRef.current.t))
      },
    })
  }, [doorsOpen, actions])

  // Follow the drawer-open hover animation: the mixer writes the front mesh's
  // position each frame; mirror its offset from the measured static position
  // onto the handle so the handle rides along with the front.
  useFrame(() => {
    if (!drawerHandle || drawerHandle.id === 'none') return
    drawerFronts.forEach((f, i) => {
      const g = handleRefs.current[i]
      if (!g) return
      g.position.set(
        f.cx + (f.mesh.position.x - f.staticPos.x),
        f.topY - DRAWER_HANDLE_TOP_INSET + (f.mesh.position.y - f.staticPos.y),
        f.frontZ + 0.001 + (f.mesh.position.z - f.staticPos.z),
      )
    })
  })

  return (
    <group position={[offsetX, offsetY, offsetZ]}>
      <primitive object={clone} />
      {drawerHandle && drawerHandle.id !== 'none' && drawerFronts.map((f, i) => (
        <group
          key={`drawer-handle-${i}`}
          ref={(el) => { handleRefs.current[i] = el }}
          position={[f.cx, f.topY - DRAWER_HANDLE_TOP_INSET, f.frontZ + 0.001]}
          rotation={[0, 0, drawerHandle.noRotation ? 0 : Math.PI / 2]}
        >
          <HandleByType
            id={drawerHandle.id}
            meshId={drawerHandle.meshId}
            material={drawerHandle.material}
            bodyColor={drawerHandle.bodyColor}
            position={[0, 0, 0]}
          />
        </group>
      ))}
    </group>
  )
}

export default function SpecialElement(props: SpecialElementProps) {
  return <SpecialElementInner key={props.element.glbPath} {...props} />
}
