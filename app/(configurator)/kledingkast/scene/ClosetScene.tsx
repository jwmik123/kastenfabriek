'use client'

import { useMemo } from 'react'
import { useClosetStore } from '../store'
import { ClosetMaterialProvider } from '../../_shared/materials/ClosetMaterial'
import { getDiagHeightAt, computeModuleCapY } from './diagonalUtils'
import type { DiagParams } from './diagonalUtils'
import { useSlotHighlightMaterial, buildSlotOverlayGeometry } from '../../_shared/three/slotHighlight'
import { useClosetSlotInteraction } from './slotInteraction'
import ClosetCorpus from '../../_shared/three/ClosetCorpus'
import TopCabinet from './TopCabinet'
import OnderstelPlinth from './OnderstelPlinth'
import Module from '../../_shared/three/Module'
import StructuralKinkShelf from './StructuralKinkShelf'
import StructuralSideKinkShelf from './StructuralSideKinkShelf'
import LightStrips from '../../_shared/three/LightStrips'
import { getLayoutById } from './moduleLayouts'
import { WALL, ONDERSTEL_HEIGHT, ONDERSTEL_GAP, CLOSET_INSIDE_INSET, MODULE_FLOOR_Y } from './closetConstants'
// import { StripWarmthProvider } from '../../_shared/materials/StripWarmthContext'

function slotCeilingProfile(
  leftXOuter: number,
  rightXOuter: number,
  p: DiagParams,
): Array<{ x: number; y: number }> {
  const wallH = (x: number) => Math.max(0, getDiagHeightAt(x, p) - MODULE_FLOOR_Y - WALL)
  const xs: number[] = [leftXOuter]
  if ((p.diagonalSide === 'left' || p.diagonalSide === 'both') && p.leftDiagTopWidth > 0) {
    const kink = p.leftDiagTopWidth
    if (kink > leftXOuter && kink < rightXOuter) xs.push(kink)
  }
  if ((p.diagonalSide === 'right' || p.diagonalSide === 'both') && p.rightDiagTopWidth > 0) {
    const kink = p.outerWidth - p.rightDiagTopWidth
    if (kink > leftXOuter && kink < rightXOuter) xs.push(kink)
  }
  xs.push(rightXOuter)
  xs.sort((a, b) => a - b)
  return xs.map((x) => ({ x: x - leftXOuter, y: wallH(x) }))
}

function ModuleSlotInteraction({ slotIndex, span, diagParams }: { slotIndex: number; span: 1 | 2; diagParams: DiagParams }) {
  const depth = useClosetStore((s) => s.depth) / 100
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const width = useClosetStore((s) => s.width) / 100
  const { isSelected, hovered, handlers } = useClosetSlotInteraction(slotIndex)

  const sideWallM = diagParams.sideWallThickness
  const innerW = width - sideWallM * 2
  const slotW = innerW / moduleCount
  const moduleDepth = depth - WALL - CLOSET_INSIDE_INSET

  const totalW = span * slotW

  const leftXOuter  = sideWallM + slotIndex * slotW
  const rightXOuter = sideWallM + (slotIndex + span) * slotW

  const profile = useMemo(
    () => slotCeilingProfile(leftXOuter, rightXOuter, diagParams),
    [leftXOuter, rightXOuter, diagParams],
  )

  const maxProfileH = Math.max(...profile.map((pt) => pt.y))

  const shapeGeo = useMemo(
    () => buildSlotOverlayGeometry(totalW, profile, `SlotInteraction${slotIndex}`),
    [profile, totalW, slotIndex],
  )

  const material = useSlotHighlightMaterial(totalW, maxProfileH, isSelected, hovered)

  return (
    <group position={[(-innerW / 2) + slotIndex * slotW, MODULE_FLOOR_Y, WALL]}>
      <mesh
        position={[0, 0, moduleDepth + 0.002]}
        geometry={shapeGeo}
        material={material}
        {...handlers}
      />
    </group>
  )
}

export default function ClosetScene() {
  const modules              = useClosetStore((s) => s.modules)
  const diagonalSide         = useClosetStore((s) => s.diagonalSide)
  const leftDiagStartHeight  = useClosetStore((s) => s.leftDiagStartHeight)
  const rightDiagStartHeight = useClosetStore((s) => s.rightDiagStartHeight)
  const leftDiagTopWidth     = useClosetStore((s) => s.leftDiagTopWidth)
  const rightDiagTopWidth    = useClosetStore((s) => s.rightDiagTopWidth)
  const outerWidth           = useClosetStore((s) => s.width)
  const closetHeightCm       = useClosetStore((s) => s.height)
  const mainHeightCm         = useClosetStore((s) => s.mainHeight())
  const backDiagonal           = useClosetStore((s) => s.backDiagonal)
  const backDiagKinkHeight     = useClosetStore((s) => s.backDiagKinkHeight)
  const backDiagFlatSectionDepth = useClosetStore((s) => s.backDiagFlatSectionDepth)
  const outerDepthCm           = useClosetStore((s) => s.depth)
  const needsTop               = useClosetStore((s) => s.needsTopCabinet())
  const buitenkantMaterialId   = useClosetStore((s) => s.buitenkantMaterialId)
  const binnenkantMaterialId   = useClosetStore((s) => s.binnenkantMaterialId)
  const lightStripsEnabled     = useClosetStore((s) => s.lightStripsEnabled)
  const doorsOpen              = useClosetStore((s) => s.doorsOpen)
  const sidePanelThickness     = useClosetStore((s) => s.sidePanelThickness)
  const sideWallThicknessM     = sidePanelThickness === '36mm' ? 0.036 : 0.018

  const diagParams = useMemo<DiagParams>(() => {
    const depthM    = outerDepthCm / 100
    const mainHM    = mainHeightCm / 100
    const closetHM  = closetHeightCm / 100
    const kinkHM    = backDiagKinkHeight / 100
    const flatSecM  = backDiagFlatSectionDepth / 100

    const base: DiagParams = {
      diagonalSide,
      leftDiagStartHeight:  Math.min(leftDiagStartHeight,  mainHeightCm - 20) / 100,
      rightDiagStartHeight: Math.min(rightDiagStartHeight, mainHeightCm - 20) / 100,
      leftDiagTopWidth:  leftDiagTopWidth  / 100,
      rightDiagTopWidth: rightDiagTopWidth / 100,
      outerWidth:        outerWidth        / 100,
      mainHeight:        mainHM,
      closetHeight:      closetHM,
      backDiagonal,
      backDiagKinkHeight:        kinkHM,
      backDiagFlatSectionDepth:  flatSecM,
      outerDepth:                depthM,
      moduleCapY:                mainHM,
      sideWallThickness:         sideWallThicknessM,
    }
    return { ...base, moduleCapY: computeModuleCapY(base, needsTop) }
  }, [diagonalSide, leftDiagStartHeight, rightDiagStartHeight, leftDiagTopWidth, rightDiagTopWidth, outerWidth, mainHeightCm, closetHeightCm, backDiagonal, backDiagKinkHeight, backDiagFlatSectionDepth, outerDepthCm, needsTop, sideWallThicknessM])

  return (
    <ClosetMaterialProvider buitenkantMaterialId={buitenkantMaterialId} binnenkantMaterialId={binnenkantMaterialId} lightStripsEnabled={lightStripsEnabled}>
      <ClosetCorpus diagParams={diagParams} />
      {lightStripsEnabled && doorsOpen && (
        <LightStrips
          modules={modules}
          widthM={outerWidth / 100}
          depthM={outerDepthCm / 100}
          diagParams={diagParams}
        />
      )}
      <TopCabinet />
      <OnderstelPlinth />
      {modules
        .filter((m, i) => m.layoutId !== null && !(i > 0 && modules[i - 1].span === 2))
        .map((m) => {
          const layout = getLayoutById(m.layoutId!)
          if (!layout) return null
          return (
            <Module
              key={m.slotIndex}
              index={m.slotIndex}
              layout={layout}
              hasDoor={m.hasDoor}
              span={m.span}
              diagParams={diagParams}
            />
          )
        })}
      {modules.map((m, i) => {
        const isConsumed = i > 0 && modules[i - 1].span === 2
        if (isConsumed) return null
        return <ModuleSlotInteraction key={`hit-${m.slotIndex}`} slotIndex={m.slotIndex} span={m.span} diagParams={diagParams} />
      })}
      {/* Structural kink shelf — one per module, auto-inserted when backDiagonal is active.
          Distinct key prefix `kink-` prevents WebGPU RenderObject reuse with module/hit meshes. */}
      {backDiagonal && modules.map((m, i) => {
        const isConsumed = i > 0 && modules[i - 1].span === 2
        if (isConsumed) return null
        return (
          <StructuralKinkShelf
            key={`kink-${m.slotIndex}`}
            isStructural
            slotIndex={m.slotIndex}
            span={m.span}
            hasDoor={m.hasDoor}
            buitenkantMaterialId={m.buitenkantMaterialId}
            binnenkantMaterialId={m.binnenkantMaterialId}
          />
        )
      })}
      {/* Structural side kink shelves — per module, per active side diagonal. Empty slots skipped. */}
      {(diagonalSide === 'left' || diagonalSide === 'both') && modules.map((m, i) => {
        const isConsumed = i > 0 && modules[i - 1].span === 2
        if (isConsumed) return null
        if (m.layoutId === null) return null
        return (
          <StructuralSideKinkShelf
            key={`side-kink-left-${m.slotIndex}`}
            isStructural
            slotIndex={m.slotIndex}
            span={m.span}
            side="left"
            diagParams={diagParams}
            hasDoor={m.hasDoor}
            buitenkantMaterialId={m.buitenkantMaterialId}
            binnenkantMaterialId={m.binnenkantMaterialId}
          />
        )
      })}
      {(diagonalSide === 'right' || diagonalSide === 'both') && modules.map((m, i) => {
        const isConsumed = i > 0 && modules[i - 1].span === 2
        if (isConsumed) return null
        if (m.layoutId === null) return null
        return (
          <StructuralSideKinkShelf
            key={`side-kink-right-${m.slotIndex}`}
            isStructural
            slotIndex={m.slotIndex}
            span={m.span}
            side="right"
            diagParams={diagParams}
            hasDoor={m.hasDoor}
            buitenkantMaterialId={m.buitenkantMaterialId}
            binnenkantMaterialId={m.binnenkantMaterialId}
          />
        )
      })}
    </ClosetMaterialProvider>
  )
}
