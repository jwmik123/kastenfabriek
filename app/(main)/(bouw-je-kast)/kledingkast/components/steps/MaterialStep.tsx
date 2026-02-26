'use client'

import { useClosetStore } from '../../store'
import { MATERIALS } from '../../materials'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

/** Decide whether to show a dark or light checkmark based on color luminance */
function isLightColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

export default function MaterialStep() {
  const materialId = useClosetStore((s) => s.materialId)
  const setMaterialId = useClosetStore((s) => s.setMaterialId)

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-base font-semibold">Materiaal</h2>
        <p className="text-sm text-muted-foreground mt-1">Kies een kleur voor je kast.</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {MATERIALS.map((mat) => {
          const isSelected = materialId === mat.id
          return (
            <button
              key={mat.id}
              onClick={() => setMaterialId(mat.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-md border-2 transition-all',
                isSelected
                  ? 'border-foreground'
                  : 'border-border hover:border-foreground/40',
              )}
            >
              <div className="relative">
                <div
                  className="w-9 h-9 rounded-full border border-black/10"
                  style={{ backgroundColor: mat.color }}
                />
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check
                      className="w-4 h-4 drop-shadow"
                      style={{ color: isLightColor(mat.color) ? '#000' : '#fff' }}
                      strokeWidth={3}
                    />
                  </div>
                )}
              </div>
              <span className="text-[11px] font-medium text-center leading-tight">
                {mat.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
