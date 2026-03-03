'use client'

import { useClosetStore } from '../../store'
import { cn } from '@/lib/utils'
import { HANDLE_TYPES } from '../objects/Handles'

const ALL_OPTIONS = [
  ...HANDLE_TYPES,
  { id: 'none', name: 'Geen (push-to-open)' },
]

export default function DoorHandlesStep() {
  const doorHandleId = useClosetStore((s) => s.doorHandleId)
  const setDoorHandleId = useClosetStore((s) => s.setDoorHandleId)

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-base font-semibold">Handgrepen</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kies het type handgreep voor de deuren.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ALL_OPTIONS.map((h) => {
          const isSelected = doorHandleId === h.id
          return (
            <button
              key={h.id}
              onClick={() => setDoorHandleId(h.id)}
              className={cn(
                'flex items-center justify-center p-4 rounded-md border-2 transition-all text-center',
                isSelected
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-foreground hover:border-foreground/40 hover:bg-muted',
              )}
            >
              <span className="text-sm font-medium">{h.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
