'use client'

import { useClosetStore } from '../../store'
import { cn } from '@/lib/utils'

const HANDLES = [
  {
    id: 'default',
    name: 'Standaard',
    description: 'Eenvoudige rechte greep',
    icon: (
      <svg viewBox="0 0 40 40" width={32} height={32} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <line x1={12} y1={20} x2={28} y2={20} />
        <line x1={12} y1={17} x2={12} y2={23} />
        <line x1={28} y1={17} x2={28} y2={23} />
      </svg>
    ),
  },
  {
    id: 'round',
    name: 'Rond',
    description: 'Ronde knop',
    icon: (
      <svg viewBox="0 0 40 40" width={32} height={32} fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx={20} cy={20} r={6} />
        <circle cx={20} cy={20} r={2} fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'minimal',
    name: 'Minimaal',
    description: 'Ingefreesde greep',
    icon: (
      <svg viewBox="0 0 40 40" width={32} height={32} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <rect x={16} y={14} width={8} height={12} rx={1} />
        <line x1={20} y1={14} x2={20} y2={26} strokeWidth={0.8} strokeOpacity={0.5} />
      </svg>
    ),
  },
  {
    id: 'none',
    name: 'Geen',
    description: 'Push-to-open',
    icon: (
      <svg viewBox="0 0 40 40" width={32} height={32} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <rect x={14} y={12} width={12} height={16} rx={2} />
        <path d="M20 16 L20 24" strokeWidth={1} strokeOpacity={0.4} />
      </svg>
    ),
  },
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
        {HANDLES.map((h) => {
          const isSelected = doorHandleId === h.id
          return (
            <button
              key={h.id}
              onClick={() => setDoorHandleId(h.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-md border-2 transition-all text-left',
                isSelected
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-foreground hover:border-foreground/40 hover:bg-muted',
              )}
            >
              <div className="opacity-80">{h.icon}</div>
              <div>
                <span className="text-sm font-medium block">{h.name}</span>
                <span className="text-[11px] opacity-60">{h.description}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
