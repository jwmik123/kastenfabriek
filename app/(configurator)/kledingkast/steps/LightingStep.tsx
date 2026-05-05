'use client'

import { useClosetStore } from '../store'
import { Toggle } from '@/components/ui/Toggle'

export default function LightingStep() {
  const lightStripsEnabled = useClosetStore((s) => s.lightStripsEnabled)
  const setLightStripsEnabled = useClosetStore((s) => s.setLightStripsEnabled)

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-base font-semibold">Verlichting</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Voeg LED-lichtstrips toe aan de binnenzijde van de modules.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 p-4 rounded-md border">
        <div>
          <p className="text-sm font-medium">LED-lichtstrips</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Warm wit licht, 10 cm van de voorzijde ingebouwd in de zijwanden.
          </p>
        </div>
        <Toggle checked={lightStripsEnabled} onCheckedChange={setLightStripsEnabled} />
      </div>
    </div>
  )
}
