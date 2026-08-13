'use client'

import { useIsMobile } from '../../_shared/components/useIsMobile'
import MaterialColorWheel from './MaterialColorWheel'
import MaterialSwatchGrid from './MaterialSwatchGrid'

interface MaterialPickerProps {
  materialId: string
  onSelect: (id: string) => void
  /** Wheel diameter on desktop; ignored by the mobile grid. */
  size?: number
  hideOutsideOnly?: boolean
}

/** Color wheel on desktop, square-swatch grid on phones. */
export default function MaterialPicker({
  materialId,
  onSelect,
  size = 300,
  hideOutsideOnly = false,
}: MaterialPickerProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <MaterialSwatchGrid
        materialId={materialId}
        onSelect={onSelect}
        hideOutsideOnly={hideOutsideOnly}
      />
    )
  }

  return (
    <MaterialColorWheel
      materialId={materialId}
      onSelect={onSelect}
      size={size}
      hideOutsideOnly={hideOutsideOnly}
    />
  )
}
