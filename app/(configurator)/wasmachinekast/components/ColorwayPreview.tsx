'use client'

import { useWasmachinekastStore } from '../store'
import ColorwayPreviewSection from '../../_shared/components/ColorwayPreview'

export default function ColorwayPreview() {
  const buitenkantMaterialId = useWasmachinekastStore((s) => s.buitenkantMaterialId)
  return <ColorwayPreviewSection buitenkantMaterialId={buitenkantMaterialId} />
}
