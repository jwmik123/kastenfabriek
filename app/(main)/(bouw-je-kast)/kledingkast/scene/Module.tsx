'use client'

import { useClosetStore } from '../store'
import { getLayoutById, computeModulePositions } from './moduleLayouts'
import FillZone from './FillZone'
import SpecialElement from './SpecialElement'
import Door from '../../_shared/objects/Door'
import ClosetMaterial, { ModuleMaterialOverrideProvider } from '../../_shared/materials/ClosetMaterial'

const WALL = 0.018
const MODULE_WALL = 0.018
const MODULE_INSIDE_INSET = 0.010
const ONDERSTEL_HEIGHT = 0.108
const ONDERSTEL_GAP = 0.010
const CLOSET_INSIDE_INSET = 0.025
const MODULE_FLOOR_Y = ONDERSTEL_HEIGHT + ONDERSTEL_GAP

interface ModuleProps {
  index: number
  layoutId: number
  hasDoor: boolean
  span: 1 | 2
}

export default function Module({ index, layoutId, hasDoor, span }: ModuleProps) {
  const mh = useClosetStore((s) => s.mainHeight()) / 100
  const depth = useClosetStore((s) => s.depth) / 100
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const width = useClosetStore((s) => s.width) / 100
  const doorsOpen = useClosetStore((s) => s.doorsOpen)
  const hoveredSlot = useClosetStore((s) => s.hoveredSlot)
  const doorHandleId = useClosetStore((s) => s.doorHandleId)
  const moduleSlot = useClosetStore((s) => s.modules.find((m) => m.slotIndex === index))

  const layout = getLayoutById(layoutId)
  if (!layout) return null

  const innerW = width - WALL * 2
  const slotW = innerW / moduleCount
  const moduleWidth = span * slotW
  const moduleHeight = mh - WALL - MODULE_FLOOR_Y
  const moduleDepth = depth - WALL - CLOSET_INSIDE_INSET

  const { specialElementY, fillAbove, fillBelow } = computeModulePositions(layout, moduleHeight)

  const isLastModule = index + span === moduleCount
  const mirrorDoor = index % 2 === 1 || isLastModule

  const startX = -innerW / 2
  const x = startX + index * slotW

  const contentDepth = moduleDepth - MODULE_INSIDE_INSET
  const centerX = moduleWidth / 2
  const centerZ = contentDepth / 2

  return (
    <ModuleMaterialOverrideProvider
      buitenkantMaterialId={moduleSlot?.buitenkantMaterialId}
      binnenkantMaterialId={moduleSlot?.binnenkantMaterialId}
    >
    <group position={[x, MODULE_FLOOR_Y, WALL]}>
      {/* Special element (GLB) */}
      <SpecialElement
        layout={layout}
        targetWidth={moduleWidth - MODULE_WALL * 2}
        targetDepth={contentDepth}
        positionY={specialElementY}
        hovered={hoveredSlot === index}
        hasDoor={hasDoor}
      />

      {/* Fill zone above special element */}
      {fillAbove.end > fillAbove.start && (
        <FillZone
          config={layout.fillZone.above}
          startY={fillAbove.start}
          endY={fillAbove.end}
          width={moduleWidth}
          depth={contentDepth}
          centerX={centerX}
          centerZ={centerZ}
          hasDoor={hasDoor}
        />
      )}

      {/* Fill zone below special element */}
      {fillBelow.end > fillBelow.start && (
        <FillZone
          config={layout.fillZone.below}
          startY={fillBelow.start}
          endY={fillBelow.end}
          width={moduleWidth}
          depth={contentDepth}
          centerX={centerX}
          centerZ={centerZ}
          hasDoor={hasDoor}
        />
      )}

      {/* Back wall */}
      <mesh position={[moduleWidth / 2, moduleHeight / 2, MODULE_WALL / 2]} castShadow receiveShadow>
        <boxGeometry args={[moduleWidth, moduleHeight, MODULE_WALL]} />
        <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
      </mesh>

      {/* Left wall */}
      <mesh position={[MODULE_WALL / 2, moduleHeight / 2, centerZ]} castShadow receiveShadow>
        <boxGeometry args={[MODULE_WALL, moduleHeight, moduleDepth]} />
        <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
      </mesh>

      {/* Right wall */}
      <mesh position={[moduleWidth - MODULE_WALL / 2, moduleHeight / 2, centerZ]} castShadow receiveShadow>
        <boxGeometry args={[MODULE_WALL, moduleHeight, moduleDepth]} />
        <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
      </mesh>

      {/* Floor */}
      <mesh position={[moduleWidth / 2, MODULE_WALL / 2, centerZ]} castShadow receiveShadow>
        <boxGeometry args={[moduleWidth, MODULE_WALL, moduleDepth]} />
        <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
      </mesh>

      {/* Roof */}
      <mesh position={[moduleWidth / 2, moduleHeight - MODULE_WALL / 2, centerZ]} castShadow receiveShadow>
        <boxGeometry args={[moduleWidth, MODULE_WALL, moduleDepth]} />
        <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
      </mesh>

      {/* Door(s) */}
      {hasDoor && span === 1 && (
        <Door
          moduleHeight={moduleHeight}
          slotW={slotW}
          moduleDepth={moduleDepth}
          doorsOpen={doorsOpen}
          doorHandleId={doorHandleId}
          mirror={mirrorDoor}
        />
      )}
      {hasDoor && span === 2 && (
        <>
          <Door
            moduleHeight={moduleHeight}
            slotW={slotW}
            moduleDepth={moduleDepth}
            doorsOpen={doorsOpen}
            doorHandleId={doorHandleId}
          />
          <group position={[slotW, 0, 0]}>
            <Door
              moduleHeight={moduleHeight}
              slotW={slotW}
              moduleDepth={moduleDepth}
              doorsOpen={doorsOpen}
              doorHandleId={doorHandleId}
              mirror
            />
          </group>
        </>
      )}
    </group>
    </ModuleMaterialOverrideProvider>
  )
}
