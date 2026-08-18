import { MATERIALS } from '../../kledingkast/materials'

/** One label/value line in a configurator's specifications card. */
export function SpecRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground shrink-0 w-40">{label}</span>
      <span className="text-sm text-foreground text-right">{children}</span>
    </div>
  )
}

/** Material name preceded by its colour dot or texture thumbnail. */
export function MaterialSwatch({ id }: { id: string }) {
  const material = MATERIALS.find((m) => m.id === id)
  if (!material) return <span className="text-sm text-foreground">{id}</span>

  return (
    <span className="inline-flex items-center gap-2">
      {material.type === 'color' ? (
        <span
          className="inline-block w-4 h-4 rounded-full border border-border shrink-0"
          style={{ backgroundColor: material.color }}
        />
      ) : (
        <img
          src={material.preview}
          alt={material.name}
          className="w-4 h-4 rounded-full object-cover border border-border shrink-0"
        />
      )}
      {material.name}
    </span>
  )
}
