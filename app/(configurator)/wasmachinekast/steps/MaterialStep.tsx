'use client'

import { useEffect, useState } from 'react'
import { useWasmachinekastStore } from '../store'
import { MATERIALS } from '../../kledingkast/materials'
import { cn } from '@/lib/utils'
import MaterialPicker from '../../kledingkast/components/MaterialPicker'

type MaterialTab = 'buitenkant' | 'binnenkant' | 'werkblad'

export default function MaterialStep() {
  const buitenkantMaterialId = useWasmachinekastStore((s) => s.buitenkantMaterialId)
  const binnenkantMaterialId = useWasmachinekastStore((s) => s.binnenkantMaterialId)
  const setBuitenkantMaterialId = useWasmachinekastStore((s) => s.setBuitenkantMaterialId)
  const setBinnenkantMaterialId = useWasmachinekastStore((s) => s.setBinnenkantMaterialId)
  const layout = useWasmachinekastStore((s) => s.layout)
  const lowSection = useWasmachinekastStore((s) => s.lowSection)
  const countertopMaterialId = useWasmachinekastStore((s) => s.countertopMaterialId)
  const setLowCountertopMaterialId = useWasmachinekastStore((s) => s.setLowCountertopMaterialId)
  const hasLow = layout === 'low-only' || lowSection !== null

  const [activeTab, setActiveTab] = useState<MaterialTab>('buitenkant')

  useEffect(() => {
    useWasmachinekastStore.setState({ doorsOpen: activeTab === 'binnenkant' })
  }, [activeTab])

  const materialId =
    activeTab === 'buitenkant'
      ? buitenkantMaterialId
      : activeTab === 'binnenkant'
        ? binnenkantMaterialId
        : countertopMaterialId ?? buitenkantMaterialId
  const setMaterialId =
    activeTab === 'buitenkant'
      ? setBuitenkantMaterialId
      : activeTab === 'binnenkant'
        ? setBinnenkantMaterialId
        : setLowCountertopMaterialId

  const selectedMaterial = MATERIALS.find((m) => m.id === materialId)

  return (
    <div className="space-y-6">
      <div>
        {/* <h2 className="text-base font-semibold">Materiaal</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kies een kleur of materiaal voor je kast.
        </p> */}
        <p className="text-sm text-green-700 font-bold">Tip: Klik op een module om de kleur te wijzigen voor die module.</p>
      </div>

      <div className="flex rounded-md border border-border overflow-hidden text-sm font-medium">
        <button
          onClick={() => setActiveTab('buitenkant')}
          className={cn(
            'flex-1 py-2 transition-colors',
            activeTab === 'buitenkant' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          )}
        >
          Buitenkant
        </button>
        <button
          onClick={() => setActiveTab('binnenkant')}
          className={cn(
            'flex-1 py-2 transition-colors border-l border-border',
            activeTab === 'binnenkant' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          )}
        >
          Binnenkant
        </button>
        {hasLow && (
          <button
            onClick={() => setActiveTab('werkblad')}
            className={cn(
              'flex-1 py-2 transition-colors border-l border-border',
              activeTab === 'werkblad' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            Werkblad
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-3">
        <MaterialPicker materialId={materialId} onSelect={setMaterialId} size={300} hideOutsideOnly={activeTab === 'binnenkant'} />
        {selectedMaterial && (
          <p className="text-sm font-medium">{selectedMaterial.name}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          const target = document.getElementById('material-preview')
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
          else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        }}
        className="hidden md:block w-full text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 py-2"
      >
        Scroll naar beneden om de kast in het echt te zien met je gekozen materiaal
      </button>
    </div>
  )
}
