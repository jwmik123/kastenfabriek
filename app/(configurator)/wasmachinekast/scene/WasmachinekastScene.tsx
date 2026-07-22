'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three/webgpu'
import { uv, float, fract, time, color, uniform, select, positionWorld } from 'three/tsl'
import { useWasmachinekastStore } from '../store'
import { ClosetMaterialProvider } from '../../_shared/materials/ClosetMaterial'
import ClosetCorpus from '../../_shared/three/ClosetCorpus'
import Module from '../../_shared/three/Module'
import { TopCabinetSlot } from '../../kledingkast/scene/TopCabinet'
import type { DiagParams } from '../../kledingkast/scene/diagonalUtils'
import { WALL, ONDERSTEL_HEIGHT, ONDERSTEL_GAP, CLOSET_INSIDE_INSET, MODULE_FLOOR_Y } from '../../kledingkast/scene/closetConstants'
import { useGLTF } from '@react-three/drei'
import { useClosetMaterialInstance } from '../../_shared/materials/ClosetMaterial'
import { trapNaN, trapGeo } from '@/utils/debugGeometry'
import { computeSlotWidthsM } from '../../_shared/store/slotWidths'
import { getWasmLayoutConfig } from '../moduleLayoutConfigs'
import { WASHER_LAYOUT_IDS } from '../moduleLayouts'
import { resolveFrontPlan } from '../../_shared/frontPolicy'
import type { BaseModuleSlot } from '../../_shared/store/types'
import type { Section } from '../sections/types'

const BORDER_M = 0.015
const WASHER_REAR_CLEARANCE = 0.10

interface SectionRender {
  width: number
  height: number
  moduleCount: number
  modules: BaseModuleSlot[]
}

function SlotInteraction({
  slotIndex,
  span,
  diagParams,
  sectionWidthM,
  sectionMainHeightM,
  sectionDepthM,
  modules,
  sectionKind,
}: {
  slotIndex: number
  span: 1 | 2
  diagParams: DiagParams
  sectionWidthM: number
  sectionMainHeightM: number
  sectionDepthM: number
  modules: BaseModuleSlot[]
  sectionKind: 'high' | 'low'
}) {
  const selectedSlot = useWasmachinekastStore((s) => s.selectedSlot)
  const hoveredSlot = useWasmachinekastStore((s) => s.hoveredSlot)
  const hoveredSection = useWasmachinekastStore((s) => s.hoveredSection)
  const setSelectedSlot = useWasmachinekastStore((s) => s.setSelectedSlot)
  const setHoveredSlot = useWasmachinekastStore((s) => s.setHoveredSlot)
  const setHoveredSection = useWasmachinekastStore((s) => s.setHoveredSection)

  const [localHovered, setLocalHovered] = useState(false)

  const innerW = sectionWidthM - WALL * 2
  const moduleDepth = sectionDepthM - WALL - CLOSET_INSIDE_INSET
  // Group sits at y=MODULE_FLOOR_Y (top of plinth). Plane should reach the
  // module-interior cap at y=sectionMainHeightM in world space, so cap to that
  // delta — otherwise it overhangs the corpus by the plinth height.
  const overlayHeightM = Math.max(0, sectionMainHeightM - MODULE_FLOOR_Y)

  const slotWidthsM = useMemo(() => computeSlotWidthsM(modules, innerW), [modules, innerW])
  const slotOffset = slotWidthsM.slice(0, slotIndex).reduce((a, b) => a + b, 0)
  const totalW = slotWidthsM.slice(slotIndex, slotIndex + span).reduce((a, b) => a + b, 0)

  const isSelected = selectedSlot === slotIndex

  const shapeGeo = useMemo(() => {
    trapNaN(totalW, `WasmSlotInteraction${slotIndex}-totalW`)
    trapNaN(overlayHeightM, `WasmSlotInteraction${slotIndex}-overlayHeightM`)
    const geo = new THREE.PlaneGeometry(totalW, overlayHeightM)
    geo.translate(totalW / 2, overlayHeightM / 2, 0)
    return trapGeo(geo, `WasmSlotInteraction${slotIndex}-shapeGeo`)
  }, [totalW, overlayHeightM])

  const hovered =
    localHovered ||
    (hoveredSlot === slotIndex && (hoveredSection === null || hoveredSection === sectionKind))

  useEffect(() => {
    document.body.style.cursor = localHovered ? 'pointer' : 'auto'
    return () => { document.body.style.cursor = 'auto' }
  }, [localHovered])

  const bxU = useRef(uniform(BORDER_M / totalW))
  const byU = useRef(uniform(BORDER_M / overlayHeightM))
  const fillAlphaU = useRef(uniform(0.0))
  const borderAlphaU = useRef(uniform(0.0))

  useEffect(() => { bxU.current.value = BORDER_M / totalW }, [totalW])
  useEffect(() => { byU.current.value = BORDER_M / overlayHeightM }, [overlayHeightM])
  useEffect(() => {
    fillAlphaU.current.value = isSelected ? 0.05 : hovered ? 0.10 : 0.0
    borderAlphaU.current.value = (isSelected || hovered) ? 0.85 : 0.0
  }, [isSelected, hovered])

  const visualMaterial = useMemo(() => {
    const uvCoord = uv()
    const onEdge = uvCoord.x.lessThan(bxU.current)
      .or(float(1.0).sub(uvCoord.x).lessThan(bxU.current))
      .or(uvCoord.y.lessThan(byU.current))
      .or(float(1.0).sub(uvCoord.y).lessThan(byU.current))
    const stripe = fract(positionWorld.x.sub(positionWorld.y).mul(8.0).add(time.mul(0.8)))
    const stripeOn = stripe.lessThan(float(0.5))
    const pixelAlpha = select(
      onEdge,
      select(stripeOn, borderAlphaU.current, float(0.0)),
      fillAlphaU.current,
    )
    const mat = new THREE.MeshBasicNodeMaterial()
    mat.colorNode = color(0x22c55e)
    mat.opacityNode = pixelAlpha
    mat.transparent = true
    mat.depthWrite = false
    return mat
  }, [])

  const hitMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial()
    mat.transparent = true
    mat.opacity = 0
    mat.depthWrite = false
    mat.colorWrite = false
    return mat
  }, [])

  const showVisual = isSelected || hovered

  return (
    <group position={[(-innerW / 2) + slotOffset, MODULE_FLOOR_Y, WALL]}>
      <mesh
        position={[0, 0, moduleDepth + 0.002]}
        geometry={shapeGeo}
        material={hitMaterial}
        onPointerOver={(e) => { e.stopPropagation(); setLocalHovered(true); setHoveredSlot(slotIndex); setHoveredSection(sectionKind) }}
        onPointerOut={() => { setLocalHovered(false); setHoveredSlot(null); setHoveredSection(null) }}
        onClick={(e) => {
          e.stopPropagation()
          if (isSelected) {
            setSelectedSlot(null)
          } else {
            const ne = e.nativeEvent as MouseEvent
            setSelectedSlot(slotIndex, { x: ne.clientX, y: ne.clientY })
          }
        }}
      />
      {showVisual && (
        <mesh
          position={[0, 0, moduleDepth + 0.003]}
          geometry={shapeGeo}
          material={visualMaterial}
          raycast={() => null}
        />
      )}
    </group>
  )
}

// Plinth segment spanning [centerXM] horizontally with given own width `segWidthM`.
// Caller is responsible for placement: pass the segment's own width (not the
// section width) and the world X of its center.
function PlinthSegment({
  segWidthM,
  centerXM,
  depthM,
}: {
  segWidthM: number
  centerXM: number
  depthM: number
}) {
  const { scene } = useGLTF('/objects/onderstel.glb')
  const material = useClosetMaterialInstance()

  const ONDERSTEL_FRONT_INSET = 0.089
  const innerD = depthM - WALL - ONDERSTEL_FRONT_INSET

  const [{ clone, originalBox }] = useState(() => {
    const c = scene.clone(true)
    const b = new THREE.Box3().setFromObject(c)
    return { clone: c, originalBox: b }
  })

  const { scaleX, scaleZ, pX, pY, pZ } = useMemo(() => {
    const sx = segWidthM / (originalBox.max.x - originalBox.min.x)
    const sz = innerD / (originalBox.max.z - originalBox.min.z)
    const cx = (originalBox.min.x + originalBox.max.x) / 2
    return {
      scaleX: sx,
      scaleZ: sz,
      pX: -cx * sx,
      pY: -originalBox.min.y,
      pZ: WALL - originalBox.min.z * sz,
    }
  }, [originalBox, segWidthM, innerD])

  useEffect(() => {
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh) obj.material = material
    })
  }, [clone, material])

  return (
    <group position={[centerXM, 0, 0]}>
      <primitive
        object={clone}
        scale={[scaleX, 1, scaleZ]}
        position={[pX, pY, pZ]}
      />
    </group>
  )
}

// Render the section's plinth as a sequence of segments, skipping any slot
// whose layout has `floorMount: true` (the GLB sits directly on the floor and
// the plinth must be cut out beneath it).
function SectionPlinth({
  widthM,
  depthM,
  modules,
}: {
  widthM: number
  depthM: number
  modules: BaseModuleSlot[]
}) {
  const innerW = widthM - WALL * 2
  const slotWidthsM = useMemo(() => computeSlotWidthsM(modules, innerW), [modules, innerW])

  const segments = useMemo(() => {
    // Each slot contributes to a "keep" segment unless it's a floor-mount slot.
    // Walk left→right, accumulating runs of contiguous keep slots.
    const runs: Array<{ width: number; startX: number }> = []
    let runStart = 0
    let runWidth = 0
    let cursorX = 0
    for (let i = 0; i < modules.length; i++) {
      const layoutId = modules[i].layoutId
      const cfg = layoutId !== null ? getWasmLayoutConfig(layoutId) : undefined
      const isFloorMount = !!cfg?.floorMount
      const slotW = slotWidthsM[i] ?? 0
      if (isFloorMount) {
        if (runWidth > 0) runs.push({ width: runWidth, startX: runStart })
        runStart = cursorX + slotW
        runWidth = 0
      } else {
        runWidth += slotW
      }
      cursorX += slotW
    }
    if (runWidth > 0) runs.push({ width: runWidth, startX: runStart })
    // Translate runs from inner-x coords (0..innerW) into section coords (centered at 0).
    return runs.map((r) => ({
      segWidthM: r.width,
      centerXM: -innerW / 2 + r.startX + r.width / 2,
    }))
  }, [modules, slotWidthsM, innerW])

  return (
    <>
      {segments.map((s, i) => (
        <PlinthSegment
          key={`plinth-${i}-${s.centerXM.toFixed(4)}`}
          segWidthM={s.segWidthM}
          centerXM={s.centerXM}
          depthM={depthM}
        />
      ))}
    </>
  )
}

function WerkbladSlab({
  widthM,
  depthM,
  thicknessM,
  y,
  materialId,
  binnenkantMaterialId,
}: {
  widthM: number
  depthM: number
  thicknessM: number
  y: number
  materialId: string
  binnenkantMaterialId: string
}) {
  return (
    <ClosetMaterialProvider buitenkantMaterialId={materialId} binnenkantMaterialId={binnenkantMaterialId}>
      <WerkbladSlabMesh widthM={widthM} depthM={depthM} thicknessM={thicknessM} y={y} />
    </ClosetMaterialProvider>
  )
}

function WerkbladSlabMesh({ widthM, depthM, thicknessM, y }: { widthM: number; depthM: number; thicknessM: number; y: number }) {
  const material = useClosetMaterialInstance()
  return (
    <mesh position={[0, y, depthM / 2]} castShadow receiveShadow>
      <boxGeometry args={[widthM, thicknessM, depthM]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

// Top cabinet interior for a high section taller than 275cm. Mirrors the
// kledingkast flat-case TopCabinet: a divider floor at mainHeight, per-slot
// dividers, doors, middle shelf and ceiling. High sections are always flat
// (no diagonals), so the flat TopCabinetSlot is reused directly.
function WasmTopCabinet({
  widthM,
  heightCm,
  mainHeightM,
  depthM,
  modules,
  sideWallThicknessM,
}: {
  widthM: number
  heightCm: number
  mainHeightM: number
  depthM: number
  modules: BaseModuleSlot[]
  sideWallThicknessM: number
}) {
  const doorsOpen = useWasmachinekastStore((s) => s.doorsOpen)

  const SIDE_WALL_EXTRA_M = 0.005
  const innerW = widthM - sideWallThicknessM * 2
  const moduleDepth = depthM - WALL - CLOSET_INSIDE_INSET
  const ceilH = heightCm / 100 - SIDE_WALL_EXTRA_M
  const flatH = ceilH - mainHeightM - WALL

  const slotWidthsM = useMemo(() => computeSlotWidthsM(modules, innerW), [modules, innerW])

  if (flatH <= WALL * 2) return null

  const startX = -innerW / 2
  let offset = 0

  return (
    <group position={[0, mainHeightM, WALL]}>
      {modules.map((m, i) => {
        const slotW = slotWidthsM[i] ?? 0
        const x = startX + offset
        offset += slotW
        if (slotW <= WALL * 2) return null
        const mirror = i % 2 === 1 || i === modules.length - 1
        const roofProfile = [
          { x: 0, y: flatH },
          { x: slotW, y: flatH },
        ]
        return (
          <group key={i} position={[x, 0, 0]}>
            <TopCabinetSlot
              slotW={slotW}
              moduleDepth={moduleDepth}
              roofProfile={roofProfile}
              leftH={flatH}
              rightH={flatH}
              flatH={flatH}
              doorsOpen={doorsOpen}
              mirror={mirror}
            />
          </group>
        )
      })}
    </group>
  )
}

interface SectionGroupProps {
  section: SectionRender
  kind: 'high' | 'low'
  depthCm: number
  xOffsetM: number
  topPanelThicknessMm: number
  countertopMaterialId: string | undefined
  buitenkantMaterialId: string
  binnenkantMaterialId: string
  enableSlotInteraction: boolean
  sideWallThicknessM: number
}

function SectionGroup({
  section,
  kind,
  depthCm,
  xOffsetM,
  topPanelThicknessMm,
  countertopMaterialId,
  buitenkantMaterialId,
  binnenkantMaterialId,
  enableSlotInteraction,
  sideWallThicknessM,
}: SectionGroupProps) {
  const widthM = section.width / 100
  const depthM = depthCm / 100
  const heightCm = section.height
  const isLow = kind === 'low'

  const doorsExtendToFloor = useWasmachinekastStore((s) => s.doorsExtendToFloor)
  const selectedHandleId = useWasmachinekastStore((s) => s.doorHandleId)
  const selectedDrawerHandleId = useWasmachinekastStore((s) => s.drawerHandleId)

  const SIDE_WALL_EXTRA_CM = 1.5
  const TOP_CABINET_THRESHOLD = 275
  const needsTop = heightCm > TOP_CABINET_THRESHOLD
  const topCabinetHeight = needsTop ? heightCm - 225 - SIDE_WALL_EXTRA_CM : 0
  const mainHeightCm = needsTop ? 225 : heightCm - SIDE_WALL_EXTRA_CM
  const WALL_M = 0.018
  const SIDE_WALL_EXTRA_M = 0.005

  const thicknessM = topPanelThicknessMm / 1000
  // Werkblad design: corpus top is always at heightCm - 18mm (the reference
  // thickness). 18mm slabs fit inside the 90cm budget; 36mm slabs extend
  // upward past the 90cm cap (corpus stays the same height in both cases).
  const REFERENCE_THICKNESS_M = 0.018
  const corpusTopM = isLow ? heightCm / 100 - REFERENCE_THICKNESS_M : mainHeightCm / 100
  const lowMainH = corpusTopM + WALL_M
  const lowClosetH = corpusTopM - SIDE_WALL_EXTRA_M

  const diagParams = useMemo<DiagParams>(
    () => ({
      diagonalSide: 'none',
      leftDiagStartHeight: 0,
      rightDiagStartHeight: 0,
      leftDiagTopWidth: 0,
      rightDiagTopWidth: 0,
      outerWidth: widthM,
      mainHeight: isLow ? lowMainH : mainHeightCm / 100,
      closetHeight: isLow ? lowClosetH : heightCm / 100,
      backDiagonal: false,
      backDiagKinkHeight: 0,
      backDiagFlatSectionDepth: 0,
      outerDepth: depthM,
      moduleCapY: isLow ? lowMainH : mainHeightCm / 100,
      sideWallThickness: sideWallThicknessM,
    }),
    [widthM, mainHeightCm, heightCm, depthM, isLow, lowMainH, lowClosetH, sideWallThicknessM],
  )

  const werkbladMaterialId = countertopMaterialId ?? buitenkantMaterialId

  return (
    <group position={[xOffsetM, 0, 0]}>
      <ClosetCorpus diagParams={diagParams} hideTopPanel={isLow} />
      <SectionPlinth widthM={widthM} depthM={depthM} modules={section.modules} />
      {isLow && (
        <WerkbladSlab
          widthM={widthM}
          depthM={depthM}
          thicknessM={thicknessM}
          y={corpusTopM + thicknessM / 2}
          materialId={werkbladMaterialId}
          binnenkantMaterialId={binnenkantMaterialId}
        />
      )}
      {section.modules
        .filter((m) => m.layoutId !== null)
        .map((m) => {
          const layout = getWasmLayoutConfig(m.layoutId!)
          if (!layout) return null
          const isWasher = WASHER_LAYOUT_IDS.has(m.layoutId!)
          const plan = resolveFrontPlan({
            product: 'wasmachinekast',
            sectionKind: kind,
            hasDoorSetting: m.hasDoor,
            isWasher,
            layoutHasLowFronts: layout.lowFronts === true,
            doorsExtendToFloor,
            selectedHandleId,
            selectedDrawerHandleId,
          })
          return (
            <Module
              key={m.slotIndex}
              index={m.slotIndex}
              layout={layout}
              hasDoor={plan.showDoor}
              span={m.span}
              diagParams={diagParams}
              depthOverride={isWasher ? depthM - WASHER_REAR_CLEARANCE : undefined}
              sectionWidthCm={section.width}
              sectionModuleCount={section.moduleCount}
              sectionModules={section.modules}
              sectionNeedsTopCabinet={isLow ? false : section.height > TOP_CABINET_THRESHOLD}
              sectionKind={kind}
              washerDoorAbove={plan.showWasherDoorAbove}
              drawerFronts={plan.showDrawerFronts}
              doorHandleIdOverride={plan.doorHandleId}
              drawerHandleId={plan.drawerHandleId}
            />
          )
        })}
      {!isLow && needsTop && (
        <WasmTopCabinet
          widthM={widthM}
          heightCm={heightCm}
          mainHeightM={mainHeightCm / 100}
          depthM={depthM}
          modules={section.modules}
          sideWallThicknessM={sideWallThicknessM}
        />
      )}
      {enableSlotInteraction &&
        section.modules.map((m, i) => {
          const isConsumed = i > 0 && section.modules[i - 1].span === 2
          if (isConsumed) return null
          return (
            <SlotInteraction
              key={`hit-${m.slotIndex}`}
              slotIndex={m.slotIndex}
              span={m.span}
              diagParams={diagParams}
              sectionWidthM={widthM}
              sectionMainHeightM={isLow ? lowMainH : mainHeightCm / 100}
              sectionDepthM={depthM}
              modules={section.modules}
              sectionKind={kind}
            />
          )
        })}
    </group>
  )
}

export default function WasmachinekastScene() {
  const layout = useWasmachinekastStore((s) => s.layout)
  const topWidth = useWasmachinekastStore((s) => s.width)
  const topHeight = useWasmachinekastStore((s) => s.height)
  const topModuleCount = useWasmachinekastStore((s) => s.moduleCount)
  const topModules = useWasmachinekastStore((s) => s.modules)
  const depthCm = useWasmachinekastStore((s) => s.depth)
  const lowSection = useWasmachinekastStore((s) => s.lowSection)
  const buitenkantMaterialId = useWasmachinekastStore((s) => s.buitenkantMaterialId)
  const binnenkantMaterialId = useWasmachinekastStore((s) => s.binnenkantMaterialId)
  const topPanelThicknessMm = useWasmachinekastStore((s) => s.topPanelThicknessMm)
  const countertopMaterialId = useWasmachinekastStore((s) => s.countertopMaterialId)
  const activeModulesSection = useWasmachinekastStore((s) => s.activeModulesSection)
  const sidePanelThickness = useWasmachinekastStore((s) => s.sidePanelThickness)
  const sideWallThicknessM = sidePanelThickness === '36mm' ? 0.036 : 0.018

  const isLowOnly = layout === 'low-only'
  const isDual = layout === 'low-left' || layout === 'low-right'

  // Resolve sections
  const highSection: SectionRender | null = isLowOnly
    ? null
    : { width: topWidth, height: topHeight, moduleCount: topModuleCount, modules: topModules }
  const lowSectionRender: SectionRender | null =
    isLowOnly
      ? { width: topWidth, height: topHeight, moduleCount: topModuleCount, modules: topModules }
      : lowSection
        ? { width: lowSection.width, height: lowSection.height, moduleCount: lowSection.moduleCount, modules: lowSection.modules }
        : null

  // X offsets
  const highW = highSection ? highSection.width / 100 : 0
  const lowW = lowSectionRender ? lowSectionRender.width / 100 : 0
  const totalW = highW + (isDual ? lowW : 0) || (isLowOnly ? lowW : highW)

  let highX = 0
  let lowX = 0
  if (layout === 'low-left') {
    lowX = -totalW / 2 + lowW / 2
    highX = -totalW / 2 + lowW + highW / 2
  } else if (layout === 'low-right') {
    highX = -totalW / 2 + highW / 2
    lowX = -totalW / 2 + highW + lowW / 2
  } else {
    highX = 0
    lowX = 0
  }

  return (
    <ClosetMaterialProvider buitenkantMaterialId={buitenkantMaterialId} binnenkantMaterialId={binnenkantMaterialId}>
      <group>
        {highSection && (
          <SectionGroup
            section={highSection}
            kind="high"
            depthCm={depthCm}
            xOffsetM={highX}
            topPanelThicknessMm={topPanelThicknessMm}
            countertopMaterialId={countertopMaterialId}
            buitenkantMaterialId={buitenkantMaterialId}
            binnenkantMaterialId={binnenkantMaterialId}
            enableSlotInteraction={!isDual || activeModulesSection === 'high'}
            sideWallThicknessM={sideWallThicknessM}
          />
        )}
        {lowSectionRender && !isLowOnly && (
          <SectionGroup
            section={lowSectionRender}
            kind="low"
            depthCm={depthCm}
            xOffsetM={lowX}
            topPanelThicknessMm={topPanelThicknessMm}
            countertopMaterialId={countertopMaterialId}
            buitenkantMaterialId={buitenkantMaterialId}
            binnenkantMaterialId={binnenkantMaterialId}
            enableSlotInteraction={isDual && activeModulesSection === 'low'}
            sideWallThicknessM={sideWallThicknessM}
          />
        )}
        {isLowOnly && lowSectionRender && (
          <SectionGroup
            section={lowSectionRender}
            kind="low"
            depthCm={depthCm}
            xOffsetM={0}
            topPanelThicknessMm={topPanelThicknessMm}
            countertopMaterialId={countertopMaterialId}
            buitenkantMaterialId={buitenkantMaterialId}
            binnenkantMaterialId={binnenkantMaterialId}
            enableSlotInteraction={true}
            sideWallThicknessM={sideWallThicknessM}
          />
        )}
      </group>
    </ClosetMaterialProvider>
  )
}

useGLTF.preload('/objects/onderstel.glb')
