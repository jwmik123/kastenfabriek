'use client'

import { useClosetStore } from '../../store'

const HANDLES = [
  { id: 'default', name: 'Standaard', description: 'Eenvoudige rechte greep' },
  { id: 'round', name: 'Rond', description: 'Ronde knop' },
  { id: 'minimal', name: 'Minimaal', description: 'Ingefreesde greep' },
  { id: 'none', name: 'Geen', description: 'Push-to-open' },
]

export default function DoorHandlesStep() {
  const doorHandleId = useClosetStore((s) => s.doorHandleId)
  const setDoorHandleId = useClosetStore((s) => s.setDoorHandleId)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Handgrepen</h2>
      <p className="text-sm text-gray-500">
        Kies het type handgreep voor de deuren.
      </p>

      <div className="space-y-3">
        {HANDLES.map((h) => (
          <button
            key={h.id}
            onClick={() => setDoorHandleId(h.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-colors ${
              doorHandleId === h.id
                ? 'border-black'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <div className="w-6 h-1 bg-gray-400 rounded-full" />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-900 block">
                {h.name}
              </span>
              <span className="text-xs text-gray-500">{h.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
