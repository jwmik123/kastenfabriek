'use client'

import { useEffect, useState } from 'react'
import { useClosetStore } from '../store'
import { MATERIALS } from '../materials'
import { cn } from '@/lib/utils'
import MaterialColorWheel from '../components/MaterialColorWheel'

export default function MaterialStep() {
  const buitenkantMaterialId = useClosetStore((s) => s.buitenkantMaterialId)
  const binnenkantMaterialId = useClosetStore((s) => s.binnenkantMaterialId)
  const setBuitenkantMaterialId = useClosetStore((s) => s.setBuitenkantMaterialId)
  const setBinnenkantMaterialId = useClosetStore((s) => s.setBinnenkantMaterialId)

  const [activeTab, setActiveTab] = useState<'buitenkant' | 'binnenkant'>('buitenkant')

  useEffect(() => {
    useClosetStore.setState({ doorsOpen: activeTab === 'binnenkant' })
  }, [activeTab])

  const materialId = activeTab === 'buitenkant' ? buitenkantMaterialId : binnenkantMaterialId
  const setMaterialId = activeTab === 'buitenkant' ? setBuitenkantMaterialId : setBinnenkantMaterialId

  const selectedMaterial = MATERIALS.find((m) => m.id === materialId)

  return (
    <div className="space-y-6">
      <div>
        {/* <h2 className="text-base font-semibold">Materiaal</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kies een kleur of materiaal voor je kast.
        </p> */}
        <p className='text-sm text-green-700 font-bold'>Tip: Klik op een module om de kleur te wijzigen voor die module.</p>
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
      </div>

      <div className="flex flex-col items-center gap-3">
        <MaterialColorWheel materialId={materialId} onSelect={setMaterialId} size={300} hideOutsideOnly={activeTab === 'binnenkant'} />
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
        className="w-full text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 py-2"
      >
        Scroll naar beneden om de kast in het echt te zien met je gekozen materiaal
      </button>
    </div>
  )
}
