'use client'

import { useClosetStore } from '../../store'

const MATERIALS = [
  { id: 'white', name: 'Wit', color: '#ffffff' },
  { id: 'oak', name: 'Eiken', color: '#c4a96a' },
  { id: 'walnut', name: 'Walnoot', color: '#6b4c3b' },
  { id: 'black', name: 'Zwart', color: '#1a1a1a' },
]

export default function MaterialStep() {
  const materialId = useClosetStore((s) => s.materialId)
  const setMaterialId = useClosetStore((s) => s.setMaterialId)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Materiaal</h2>
      <p className="text-sm text-gray-500">Kies een kleur voor je kast.</p>

      <div className="grid grid-cols-2 gap-3">
        {MATERIALS.map((mat) => (
          <button
            key={mat.id}
            onClick={() => setMaterialId(mat.id)}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
              materialId === mat.id
                ? 'border-black'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div
              className="w-8 h-8 rounded-full border border-gray-300"
              style={{ backgroundColor: mat.color }}
            />
            <span className="text-sm font-medium text-gray-700">
              {mat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
