'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { Material } from '@/lib/materials'
import { useMaterials } from '@/lib/materials/MaterialsProvider'
import { cn } from '@/lib/utils'

function Swatch({
  material,
  active,
  onClick,
  onPrefetch,
}: {
  material: Material
  active: boolean
  onClick: () => void
  onPrefetch: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      onTouchStart={onPrefetch}
      title={material.name}
      aria-label={material.name}
      className={cn(
        'w-6 h-6 rounded-md border shrink-0 transition-all',
        active ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-foreground',
      )}
      style={
        material.type === 'color'
          ? { backgroundColor: material.color }
          : { backgroundImage: `url("${encodeURI(material.preview)}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
      }
    />
  )
}

/**
 * Room renders of the selected buitenkant colour. Presentational: each product
 * passes its own store's buitenkantMaterialId, so the section can sit outside
 * the configurator's store provider.
 */
export default function ColorwayPreview({ buitenkantMaterialId }: { buitenkantMaterialId: string }) {
  const [activeId, setActiveId] = useState(buitenkantMaterialId)
  const [prefetched, setPrefetched] = useState<Set<string>>(() => new Set([buitenkantMaterialId]))

  useEffect(() => {
    setActiveId(buitenkantMaterialId)
    setPrefetched((p) => (p.has(buitenkantMaterialId) ? p : new Set(p).add(buitenkantMaterialId)))
  }, [buitenkantMaterialId])

  const prefetch = (id: string) => {
    setPrefetched((p) => (p.has(id) ? p : new Set(p).add(id)))
  }

  // Only materials with room renders can be previewed; a buitenkant without
  // renders (e.g. a new colour) opens on the first one that has them.
  const { selectable, find } = useMaterials()
  const withRenders = selectable.filter((m) => (m.roomImages?.length ?? 0) > 0)
  const active = withRenders.find((m) => m.id === activeId) ?? withRenders[0]
  if (!active) return null

  return (
    <section id="material-preview" className="w-full bg-primary/10 py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-start justify-between gap-6 mb-6 flex-wrap">
          <div>
            <h2 className="text-xl md:text-2xl lg:text-4xl font-semibold">Bekijk in {active.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">Zo ziet je buitenkant eruit in deze kleur.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 max-w-[280px] justify-end">
            {withRenders.map((m) => (
              <Swatch
                key={m.id}
                material={m}
                active={m.id === active.id}
                onClick={() => setActiveId(m.id)}
                onPrefetch={() => prefetch(m.id)}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {active.roomImages!.map((src, i) => (
            <div key={src} className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={src}
                alt={`${active.name} ${i + 1}`}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <div aria-hidden className="absolute pointer-events-none opacity-0" style={{ width: 0, height: 0, overflow: 'hidden' }}>
          {[...prefetched]
            .filter((id) => id !== active.id)
            .map((id) => {
              return (find(id)?.roomImages ?? []).map((src) => (
                <Image
                  key={src}
                  src={src}
                  alt=""
                  width={1}
                  height={1}
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              ))
            })}
        </div>
      </div>
    </section>
  )
}
