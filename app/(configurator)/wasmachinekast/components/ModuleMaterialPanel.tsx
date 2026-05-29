'use client'

import { useState } from 'react'
import { useWasmachinekastStore } from '../store'
import { MATERIALS } from '../../kledingkast/materials'
import { cn } from '@/lib/utils'
import MaterialColorWheel from '../../kledingkast/components/MaterialColorWheel'

export default function ModuleMaterialPanel() {
  const step = useWasmachinekastStore((s) => s.step)
  const selectedSlot = useWasmachinekastStore((s) => s.selectedSlot)
  const setSelectedSlot = useWasmachinekastStore((s) => s.setSelectedSlot)
  const topModules = useWasmachinekastStore((s) => s.modules)
  const lowSection = useWasmachinekastStore((s) => s.lowSection)
  const layout = useWasmachinekastStore((s) => s.layout)
  const activeModulesSection = useWasmachinekastStore((s) => s.activeModulesSection)
  const buitenkantMaterialId = useWasmachinekastStore((s) => s.buitenkantMaterialId)
  const binnenkantMaterialId = useWasmachinekastStore((s) => s.binnenkantMaterialId)
  const setModuleMaterialTop = useWasmachinekastStore((s) => s.setModuleMaterial)
  const setLowSectionModuleMaterial = useWasmachinekastStore((s) => s.setLowSectionModuleMaterial)

  const isDual = layout === 'low-left' || layout === 'low-right'
  const editingLow = isDual && activeModulesSection === 'low' && lowSection !== null
  const modules = editingLow ? lowSection!.modules : topModules
  const setModuleMaterial = editingLow ? setLowSectionModuleMaterial : setModuleMaterialTop

  const [activeTab, setActiveTab] = useState<'buitenkant' | 'binnenkant'>('buitenkant')

  if (step !== 5 || selectedSlot === null) return null

  const moduleSlot = modules.find((m) => m.slotIndex === selectedSlot)
  if (!moduleSlot) return null

  const materialId = activeTab === 'buitenkant'
    ? (moduleSlot.buitenkantMaterialId ?? buitenkantMaterialId)
    : (moduleSlot.binnenkantMaterialId ?? binnenkantMaterialId)

  const selectedMaterial = MATERIALS.find((m) => m.id === materialId)

  function handleSelect(id: string) {
    if (selectedSlot === null) return
    setModuleMaterial(selectedSlot, activeTab, id)
  }

  return (
    <div className="absolute inset-0 bg-primary text-white rounded-md z-10 flex flex-col p-6 gap-5 overflow-y-auto">
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

      <div className="flex flex-col items-center gap-3">
        <MaterialColorWheel materialId={materialId} onSelect={handleSelect} size={260} />
        {selectedMaterial && (
          <p className="text-sm font-medium">{selectedMaterial.name}</p>
        )}
      </div>
    </div>
  )
}
