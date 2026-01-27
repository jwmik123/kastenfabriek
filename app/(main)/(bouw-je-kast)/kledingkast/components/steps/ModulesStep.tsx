'use client'

import { useState } from 'react'
import { useClosetStore } from '../../store'

export default function ModulesStep() {
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const modules = useClosetStore((s) => s.modules)
  const moduleLayouts = useClosetStore((s) => s.moduleLayouts)
  const setModuleCount = useClosetStore((s) => s.setModuleCount)
  const setModuleLayout = useClosetStore((s) => s.setModuleLayout)
  const minModules = useClosetStore((s) => s.minModules())
  const maxModules = useClosetStore((s) => s.maxModules())
  const moduleWidthCm = useClosetStore((s) => s.moduleWidthCm())

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Modules</h2>
      <p className="text-sm text-gray-500">
        Kies het aantal modules en vul elk vak met een indeling.
      </p>

      {/* Module count slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">Aantal modules</span>
          <span className="text-gray-500">{moduleCount}</span>
        </div>
        <input
          type="range"
          min={minModules}
          max={maxModules}
          value={moduleCount}
          onChange={(e) => setModuleCount(Number(e.target.value))}
          className="w-full accent-black"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>{minModules}</span>
          <span>{maxModules}</span>
        </div>
        <div className="text-xs text-gray-400">
          {moduleWidthCm.toFixed(1)} cm per module
        </div>
      </div>

      {/* Slot grid */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Klik op een vak om een indeling te kiezen
        </label>
        <div className="flex flex-wrap gap-2">
          {modules.map((m) => (
            <button
              key={m.slotIndex}
              onClick={() => setSelectedSlot(m.slotIndex === selectedSlot ? null : m.slotIndex)}
              className={`flex-1 min-w-[3rem] h-14 rounded-lg text-xs font-medium transition-colors border-2 ${
                selectedSlot === m.slotIndex
                  ? 'border-black bg-gray-50'
                  : m.layoutId !== null
                    ? 'border-gray-300 bg-gray-100 text-gray-700'
                    : 'border-dashed border-gray-300 text-gray-400'
              }`}
            >
              <div>{m.slotIndex + 1}</div>
              {m.layoutId !== null && (
                <div className="text-[10px] opacity-60">
                  {moduleLayouts.find((l) => l.layoutId === m.layoutId)?.name ?? ''}
                </div>
              )}
              {m.layoutId === null && <div className="text-[10px]">Leeg</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Layout picker for selected slot */}
      {selectedSlot !== null && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Indeling voor vak {selectedSlot + 1}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {moduleLayouts.map((layout) => (
              <button
                key={layout.layoutId}
                onClick={() => {
                  setModuleLayout(selectedSlot, layout.layoutId)
                }}
                className={`px-2 py-2 rounded-lg text-xs transition-colors text-left ${
                  modules[selectedSlot]?.layoutId === layout.layoutId
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="font-medium">{layout.name}</div>
                <div className="opacity-70 mt-0.5">{layout.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
