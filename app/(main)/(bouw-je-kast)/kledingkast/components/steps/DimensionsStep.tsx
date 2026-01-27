'use client'

import { useClosetStore } from '../../store'

function DimensionInput({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-black"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  )
}

export default function DimensionsStep() {
  const width = useClosetStore((s) => s.width)
  const height = useClosetStore((s) => s.height)
  const depth = useClosetStore((s) => s.depth)
  const setWidth = useClosetStore((s) => s.setWidth)
  const setHeight = useClosetStore((s) => s.setHeight)
  const setDepth = useClosetStore((s) => s.setDepth)
  const needsTopCabinet = useClosetStore((s) => s.needsTopCabinet())
  const minModules = useClosetStore((s) => s.minModules())
  const maxModules = useClosetStore((s) => s.maxModules())
  const constraints = useClosetStore((s) => s.constraints)

  const sc = constraints?.singleCorpus
  const topMax = constraints?.topCabinet.maxHeight ?? 110
  const minW = sc?.minWidth ?? 15
  const maxW = (sc?.maxWidth ?? 65) * 8

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Afmetingen</h2>
      <p className="text-sm text-gray-500">
        Stel de totale breedte, hoogte en diepte van je kast in.
      </p>

      <div className="space-y-5">
        <div>
          <DimensionInput
            label="Breedte"
            value={width}
            min={minW}
            max={maxW}
            unit="cm"
            onChange={setWidth}
          />
          <div className="text-xs text-gray-400 mt-1">
            Past {minModules}–{maxModules} modules
          </div>
        </div>
        <DimensionInput
          label="Hoogte"
          value={height}
          min={sc?.minHeight ?? 200}
          max={(sc?.maxHeight ?? 275) + topMax}
          unit="cm"
          onChange={setHeight}
        />
        <DimensionInput
          label="Diepte"
          value={depth}
          min={sc?.minDepth ?? 15}
          max={sc?.maxDepth ?? 90}
          unit="cm"
          onChange={setDepth}
        />
      </div>

      {needsTopCabinet && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Bovenkast wordt automatisch toegevoegd (hoogte {'>'} 275 cm).
        </div>
      )}
    </div>
  )
}
