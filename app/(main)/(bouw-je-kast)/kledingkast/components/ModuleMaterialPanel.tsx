'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useClosetStore } from '../store'
import { MATERIALS } from '../materials'
import { cn } from '@/lib/utils'
import MaterialColorWheel from './MaterialColorWheel'

export default function ModuleMaterialPanel() {
  const step = useClosetStore((s) => s.step)
  const selectedSlot = useClosetStore((s) => s.selectedSlot)
  const setSelectedSlot = useClosetStore((s) => s.setSelectedSlot)
  const modules = useClosetStore((s) => s.modules)
  const buitenkantMaterialId = useClosetStore((s) => s.buitenkantMaterialId)
  const binnenkantMaterialId = useClosetStore((s) => s.binnenkantMaterialId)
  const setModuleMaterial = useClosetStore((s) => s.setModuleMaterial)

  const [activeTab, setActiveTab] = useState<'buitenkant' | 'binnenkant'>('buitenkant')

  if (step !== 3 || selectedSlot === null) return null

  const moduleSlot = modules.find((m) => m.slotIndex === selectedSlot)
  if (!moduleSlot) return null

  // Use module override if set, otherwise fall back to global
  const materialId = activeTab === 'buitenkant'
    ? (moduleSlot.buitenkantMaterialId ?? buitenkantMaterialId)
    : (moduleSlot.binnenkantMaterialId ?? binnenkantMaterialId)

  const selectedMaterial = MATERIALS.find((m) => m.id === materialId)

  function handleSelect(id: string) {
    if (selectedSlot === null) return
    setModuleMaterial(selectedSlot, activeTab, id)
  }

  return (
    <div className="absolute inset-0 bg-primary text-white border border-border rounded-md z-10 flex flex-col p-6 gap-5 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Module {selectedSlot + 1}</h2>
          <p className="text-sm text-muted mt-0.5">Kies een kleur voor deze module.</p>
        </div>
        <button
          onClick={() => setSelectedSlot(null)}
          className="px-4 py-2 rounded-md bg-white hover:bg-background/80 text-foreground transition-colors"
          aria-label="Sluiten"
        >
          Opslaan
        </button>
      </div>

      {/* Buitenkant / Binnenkant tabs */}
      <div className="flex rounded-md border border-border overflow-hidden text-sm font-medium">
        <button
          onClick={() => setActiveTab('buitenkant')}
          className={cn(
            'flex-1 py-2 transition-colors',
            activeTab === 'buitenkant' ? 'bg-background text-foreground' : 'hover:bg-muted',
          )}
        >
          Buitenkant
        </button>
        <button
          onClick={() => setActiveTab('binnenkant')}
          className={cn(
            'flex-1 py-2 transition-colors border-l border-border',
            activeTab === 'binnenkant' ? 'bg-background text-foreground' : 'hover:bg-muted',
          )}
        >
          Binnenkant
        </button>
      </div>

      {/* Color wheel */}
      <div className="flex flex-col items-center gap-3">
        <MaterialColorWheel materialId={materialId} onSelect={handleSelect} size={260} />
        {selectedMaterial && (
          <p className="text-sm font-medium">{selectedMaterial.name}</p>
        )}
      </div>
    </div>
  )
}
