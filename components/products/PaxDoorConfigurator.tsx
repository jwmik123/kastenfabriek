'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'

import { MATERIALS, type Material } from '@/app/(configurator)/kledingkast/materials'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Product } from '@/sanity/lib/products'
import { calcProductPrice } from '@/lib/products/pricing'

const COLORWAY_SLUGS: Record<string, string> = {
  'h1199-thermo-eik': 'thermo-eik-zwartbruin',
  'h3165-vicenza-eik-licht': 'vicenza-eik-licht',
  'h3158-vicenza-eik-grijs': 'vicenza-eik-grijs',
  'h1714-lincoln-notelaar': 'lincoln-notelaar',
  'h3190-fineline-antraciet': 'fineline-metallic-antraciet',
}

function slugFor(id: string) {
  return COLORWAY_SLUGS[id] ?? id
}

function formatEuro(amount: number) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount)
}

function PillButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'h-10 px-4 rounded-md border text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-foreground border-border hover:border-foreground',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  )
}

function MaterialSwatch({
  material,
  active,
  onClick,
}: {
  material: Material
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={material.name}
      aria-label={material.name}
      className={cn(
        'w-10 h-10 rounded-md border shrink-0 transition-all',
        active
          ? 'border-primary ring-2 ring-primary'
          : 'border-border hover:border-foreground',
      )}
      style={
        material.type === 'color'
          ? { backgroundColor: material.color }
          : {
              backgroundImage: `url("${encodeURI(material.preview)}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
      }
    />
  )
}

export default function PaxDoorConfigurator({ product }: { product: Product }) {
  const cfg = product.paxConfig
  const widths = cfg?.widths ?? []
  const heights = cfg?.heights ?? []
  const variants = cfg?.variants ?? []

  const allowedMaterials = useMemo<Material[]>(() => {
    if (cfg?.allowedMaterialIds && cfg.allowedMaterialIds.length > 0) {
      const set = new Set(cfg.allowedMaterialIds)
      return MATERIALS.filter((m) => set.has(m.id))
    }
    return MATERIALS
  }, [cfg?.allowedMaterialIds])

  const variantHas = (w: number, h: number) =>
    variants.some((v) => v.widthCm === w && v.heightCm === h)

  const [widthCm, setWidthCm] = useState<number>(widths[0] ?? 0)
  const [heightCm, setHeightCm] = useState<number>(() => {
    const firstHeight = heights.find((h) => variantHas(widths[0], h))
    return firstHeight ?? heights[0] ?? 0
  })
  const [materialId, setMaterialId] = useState<string>(
    allowedMaterials[0]?.id ?? MATERIALS[0].id,
  )
  const [qty, setQty] = useState(1)

  // Snap height to a valid one when width changes
  useEffect(() => {
    if (!variantHas(widthCm, heightCm)) {
      const next = heights.find((h) => variantHas(widthCm, h))
      if (next != null) setHeightCm(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widthCm])

  const priceSnapshot = useMemo(() => {
    try {
      return calcProductPrice({ product, widthCm, heightCm, materialId, qty })
    } catch {
      return null
    }
  }, [product, widthCm, heightCm, materialId, qty])

  const lineTotal = priceSnapshot ? priceSnapshot.total * qty : 0

  const activeMaterial =
    allowedMaterials.find((m) => m.id === materialId) ?? allowedMaterials[0]
  const slug = activeMaterial ? slugFor(activeMaterial.id) : null

  if (!cfg) return null

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {/* Left: stacked colorway images, reactive to material selection */}
      <div className="space-y-4">
        {slug
          ? [1, 2].map((n) => (
              <div
                key={n}
                className="relative aspect-square overflow-hidden rounded-xl bg-muted"
              >
                <Image
                  src={`/colorways/${slug}-${n}.webp`}
                  alt={`${activeMaterial?.name ?? ''} ${n}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={n === 1}
                  className="object-cover"
                />
              </div>
            ))
          : null}
      </div>

      {/* Right: title, description, controls */}
      <div>
        <h1 className="text-4xl font-serif text-gray-900 mb-3">
          {product.title}
        </h1>
        <p className="text-lg text-gray-600 mb-8">{product.shortDescription}</p>

        <div className="prose prose-sm max-w-none text-gray-700 mb-8">
          <PortableText value={product.longDescription} />
        </div>

        <div className="space-y-8">
          {/* Width */}
          <div>
            <h3 className="text-sm font-medium mb-2">Breedte</h3>
            <div className="flex flex-wrap gap-2">
              {cfg.widths.map((w) => (
                <PillButton
                  key={w}
                  active={w === widthCm}
                  onClick={() => setWidthCm(w)}
                >
                  {w} cm
                </PillButton>
              ))}
            </div>
          </div>

          {/* Height */}
          <div>
            <h3 className="text-sm font-medium mb-2">Hoogte</h3>
            <div className="flex flex-wrap gap-2">
              {cfg.heights.map((h) => {
                const enabled = variantHas(widthCm, h)
                return (
                  <PillButton
                    key={h}
                    active={h === heightCm}
                    disabled={!enabled}
                    onClick={() => enabled && setHeightCm(h)}
                  >
                    {h} cm
                  </PillButton>
                )
              })}
            </div>
          </div>

          {/* Material */}
          <div>
            <h3 className="text-sm font-medium mb-2">
              Materiaal{' '}
              <span className="text-muted-foreground font-normal">
                — {activeMaterial?.name}
              </span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {allowedMaterials.map((m) => (
                <MaterialSwatch
                  key={m.id}
                  material={m}
                  active={m.id === materialId}
                  onClick={() => setMaterialId(m.id)}
                />
              ))}
            </div>
          </div>

          {/* Qty */}
          <div>
            <h3 className="text-sm font-medium mb-2">Aantal</h3>
            <div className="inline-flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                disabled={qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Min"
              >
                −
              </Button>
              <span className="w-10 text-center text-base">{qty}</span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                disabled={qty >= 10}
                onClick={() => setQty((q) => Math.min(10, q + 1))}
                aria-label="Plus"
              >
                +
              </Button>
            </div>
          </div>

          {/* Total + CTA */}
          <div className="border-t pt-6 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Totaal</div>
              <div className="text-3xl font-serif">{formatEuro(lineTotal)}</div>
              {priceSnapshot && priceSnapshot.materialSurcharge > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  incl. {formatEuro(priceSnapshot.materialSurcharge)} materiaal-toeslag per stuk
                </div>
              )}
            </div>
            <Button type="button" size="lg" disabled aria-disabled>
              Voeg toe aan winkelwagen
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
