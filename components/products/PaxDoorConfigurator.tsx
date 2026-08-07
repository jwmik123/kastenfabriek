'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { PortableText } from '@portabletext/react'

import { MATERIALS, type Material } from '@/app/(configurator)/kledingkast/materials'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PaxDoorType, Product } from '@/sanity/lib/products'
import { calcProductPrice, numericVariantsForType } from '@/lib/products/pricing'
import {
  addItem as addLocalCartItem,
  replaceItem as replaceLocalCartItem,
  getCart,
} from '@/lib/cart/cart-store'
import {
  addProductCartItem,
  updateProductCartItem,
} from '@/lib/actions/cart'
import type { ProductCartItem } from '@/lib/cart/types'
import { useSession } from '@/lib/auth-client'
import Lightbox from './Lightbox'
import { PAX_TYPE_SVGS } from './PaxTypeSvgs'

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

function sortedUnique(nums: number[]): number[] {
  return [...new Set(nums)].sort((a, b) => a - b)
}

function uniqueStrings(arr: string[]): string[] {
  return [...new Set(arr)]
}

const TYPE_LABELS: Record<PaxDoorType, string> = {
  deuren: 'Deuren',
  hoekdeuren: 'Hoekdeuren',
  afwerkpaneel: 'Zijpaneel',
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

export default function PaxDoorConfigurator({
  product,
  editItemId = null,
  editItem = null,
}: {
  product: Product
  editItemId?: string | null
  editItem?: ProductCartItem | null
}) {
  const router = useRouter()
  const session = useSession()
  const [isAdding, startAddTransition] = useTransition()
  const cfg = product.paxConfig

  const availableTypes = useMemo<PaxDoorType[]>(() => {
    const types: PaxDoorType[] = ['deuren']
    if ((cfg?.hoekVariants?.length ?? 0) > 0) types.push('hoekdeuren')
    if ((cfg?.afwerkVariants?.length ?? 0) > 0) types.push('afwerkpaneel')
    return types
  }, [cfg?.hoekVariants, cfg?.afwerkVariants])

  const verlengdeMinHeight = cfg?.verlengdeMinHeightCm ?? 200
  const verlengdeMaxHeight = cfg?.verlengdeMaxHeightCm ?? 300

  const allowedMaterials = useMemo<Material[]>(() => {
    if (cfg?.allowedMaterialIds && cfg.allowedMaterialIds.length > 0) {
      const set = new Set(cfg.allowedMaterialIds)
      return MATERIALS.filter((m) => set.has(m.id))
    }
    return MATERIALS
  }, [cfg?.allowedMaterialIds])

  // Server-fetched edit (authed) seeds initial state synchronously.
  const seed = editItem
  const [doorType, setDoorType] = useState<PaxDoorType>(
    seed?.configuration.doorType ?? 'deuren',
  )
  const [isVerlengd, setIsVerlengd] = useState<boolean>(
    seed?.configuration.isVerlengd ?? false,
  )

  const isHoek = doorType === 'hoekdeuren'
  const hoekVariants = useMemo(() => cfg?.hoekVariants ?? [], [cfg?.hoekVariants])

  // Verlengde is per-width for numeric types, a flat price for hoekdeuren.
  const verlengdeAvailable = isHoek
    ? cfg?.verlengdeHoekPrice != null
    : (cfg?.verlengdePrices?.length ?? 0) > 0

  // Numeric matrix for deuren/afwerk. Hoekdeuren use hoekVariants (label-keyed).
  const numericVariants = useMemo(
    () => (cfg ? numericVariantsForType(cfg, doorType) : []),
    [cfg, doorType],
  )

  // Width options for the current selection. `key` is a number for numeric
  // types, a label string for hoekdeuren.
  const widthOptions = useMemo<{ key: string | number; label: string }[]>(() => {
    if (isHoek) {
      return uniqueStrings(hoekVariants.map((v) => v.widthLabel)).map((l) => ({
        key: l,
        label: l,
      }))
    }
    const nums = isVerlengd
      ? (cfg?.verlengdePrices ?? []).map((p) => p.widthCm)
      : numericVariants.map((v) => v.widthCm)
    return sortedUnique(nums).map((n) => ({ key: n, label: `${n} cm` }))
  }, [isHoek, isVerlengd, hoekVariants, cfg?.verlengdePrices, numericVariants])

  // Heights available for a given width key (standard matrix only).
  const heightsForWidth = (key: string | number) =>
    isHoek
      ? sortedUnique(
          hoekVariants
            .filter((v) => v.widthLabel === key)
            .map((v) => v.heightCm),
        )
      : sortedUnique(
          numericVariants
            .filter((v) => v.widthCm === key)
            .map((v) => v.heightCm),
        )

  const [widthKey, setWidthKey] = useState<string | number>(() => {
    if (seed)
      return seed.configuration.widthLabel ?? seed.configuration.widthCm
    const deuren = cfg?.variants ?? []
    return sortedUnique(deuren.map((v) => v.widthCm))[0] ?? 0
  })
  const [heightCm, setHeightCm] = useState<number>(() => {
    if (seed) return seed.configuration.heightCm
    const deuren = cfg?.variants ?? []
    const w = sortedUnique(deuren.map((v) => v.widthCm))[0] ?? 0
    return (
      sortedUnique(
        deuren.filter((v) => v.widthCm === w).map((v) => v.heightCm),
      )[0] ?? 0
    )
  })

  // Numeric width / label split derived from the unified key.
  const widthCm = typeof widthKey === 'number' ? widthKey : 0
  const widthLabel = typeof widthKey === 'string' ? widthKey : undefined

  const [materialId, setMaterialId] = useState<string>(
    seed?.configuration.materialId ?? allowedMaterials[0]?.id ?? MATERIALS[0].id,
  )
  const [qty, setQty] = useState<number>(seed?.quantity ?? 1)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxStart, setLightboxStart] = useState(0)
  // The id we will replace on save. Null = create-new flow.
  const [activeEditId, setActiveEditId] = useState<string | null>(
    seed ? seed.id : null,
  )

  // Anon path: editItemId is in URL but editItem wasn't fetched server-side.
  // Look it up in localStorage and prefill. If not found, drop edit mode.
  useEffect(() => {
    if (!editItemId || seed) return
    const found = getCart().items.find((i) => i.id === editItemId)
    if (found && found.kind === 'product') {
      setDoorType(found.configuration.doorType ?? 'deuren')
      setIsVerlengd(found.configuration.isVerlengd ?? false)
      setWidthKey(
        found.configuration.widthLabel ?? found.configuration.widthCm,
      )
      setHeightCm(found.configuration.heightCm)
      setMaterialId(found.configuration.materialId)
      setQty(found.quantity)
      setActiveEditId(found.id)
    }
    // Not found → silently fall back to fresh state (no error, no edit mode).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Snap to a valid selection when width, type, or verlengd toggle changes.
  useEffect(() => {
    // Verlengde may not be offered for the current type.
    if (isVerlengd && !verlengdeAvailable) {
      setIsVerlengd(false)
      return
    }
    // Width must exist in the current option set.
    if (widthOptions.length && !widthOptions.some((o) => o.key === widthKey)) {
      setWidthKey(widthOptions[0].key)
      return
    }
    if (isVerlengd) {
      // Custom height: clamp into bounds on first switch.
      if (heightCm < verlengdeMinHeight || heightCm > verlengdeMaxHeight) {
        setHeightCm(verlengdeMinHeight)
      }
      return
    }
    // Standard matrix: snap height to a valid one for the active type/width.
    if (!heightsForWidth(widthKey).includes(heightCm)) {
      const next = heightsForWidth(widthKey)[0]
      if (next != null) setHeightCm(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widthKey, doorType, isVerlengd, widthOptions, verlengdeAvailable])

  const priceSnapshot = useMemo(() => {
    try {
      return calcProductPrice({
        product,
        widthCm,
        widthLabel,
        heightCm,
        materialId,
        qty,
        doorType,
        isVerlengd,
      })
    } catch {
      return null
    }
  }, [product, widthCm, widthLabel, heightCm, materialId, qty, doorType, isVerlengd])

  const verlengdHeightValid =
    !isVerlengd ||
    (Number.isFinite(heightCm) &&
      heightCm >= verlengdeMinHeight &&
      heightCm <= verlengdeMaxHeight)
  const canAdd = !!priceSnapshot && verlengdHeightValid

  const lineTotal = priceSnapshot ? priceSnapshot.total * qty : 0

  const activeMaterial =
    allowedMaterials.find((m) => m.id === materialId) ?? allowedMaterials[0]
  const slug = activeMaterial ? slugFor(activeMaterial.id) : null

  const handleAddToCart = () => {
    if (!canAdd || !activeMaterial) return
    const isEditing = activeEditId !== null
    const itemId =
      activeEditId ??
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`)
    const now = new Date().toISOString()
    const cartItem: ProductCartItem = {
      id: itemId,
      addedAt: editItem?.addedAt ?? now,
      kind: 'product',
      configuration: {
        id: itemId,
        capturedAt: now,
        sanityProductId: product._id,
        productType: product.productType,
        productSlug: product.slug,
        productName: product.title,
        widthCm,
        widthLabel,
        heightCm,
        materialId: activeMaterial.id,
        materialName: activeMaterial.name,
        doorType,
        isVerlengd,
      },
      priceSnapshot,
      quantity: qty,
    }

    if (session.data?.user) {
      startAddTransition(async () => {
        if (isEditing) {
          await updateProductCartItem(cartItem)
        } else {
          await addProductCartItem(cartItem)
        }
        router.push('/cart')
      })
    } else {
      if (isEditing) {
        replaceLocalCartItem(cartItem)
      } else {
        addLocalCartItem(cartItem)
      }
      router.push('/cart')
    }
  }

  if (!cfg) return null

  return (
    <div className="grid gap-10 md:grid-cols-2">
      {/* Left: stacked colorway images, reactive to material selection */}
      <div className="space-y-4">
        {slug
          ? [1, 2].map((n, i) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setLightboxStart(i)
                  setLightboxOpen(true)
                }}
                aria-label="Afbeelding vergroten"
                className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted cursor-zoom-in group"
              >
                <Image
                  src={`/colorways/${slug}-${n}.webp`}
                  alt={`${activeMaterial?.name ?? ''} ${n}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={n === 1}
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </button>
            ))
          : null}
      </div>

      {slug && (
        <Lightbox
          images={[1, 2].map((n) => ({
            url: `/colorways/${slug}-${n}.webp`,
            alt: `${activeMaterial?.name ?? ''} ${n}`,
          }))}
          startIndex={lightboxStart}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}

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
          {/* Type */}
          {availableTypes.length > 1 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Type</h3>
              <div className="flex flex-wrap gap-2">
                {availableTypes.map((t) => {
                  const TypeSvg = PAX_TYPE_SVGS[t]
                  const active = t === doorType
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDoorType(t)}
                      title={TYPE_LABELS[t]}
                      aria-label={TYPE_LABELS[t]}
                      aria-pressed={active}
                      className={cn(
                        'flex flex-col items-center gap-2 w-32 px-2 py-4 rounded-md border text-xs font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-foreground',
                      )}
                    >
                      <TypeSvg className="h-24 w-auto" />
                      {TYPE_LABELS[t]}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

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

          {/* Width */}
          <div>
            <h3 className="text-sm font-medium mb-2">Breedte</h3>
            <div className="flex flex-wrap gap-2">
              {widthOptions.map((o) => (
                <PillButton
                  key={o.key}
                  active={o.key === widthKey}
                  onClick={() => setWidthKey(o.key)}
                >
                  {o.label}
                </PillButton>
              ))}
            </div>
          </div>

          {/* Height */}
          <div>
            <h3 className="text-sm font-medium mb-2">Hoogte</h3>
            {isVerlengd ? (
              <div>
                <div className="inline-flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={verlengdeMinHeight}
                    max={verlengdeMaxHeight}
                    value={heightCm || ''}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="h-10 w-28 rounded-md border border-border bg-background px-3 text-sm"
                  />
                  <span className="text-sm text-muted-foreground">cm</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tussen {verlengdeMinHeight} en {verlengdeMaxHeight} cm.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {heightsForWidth(widthKey).map((h) => (
                  <PillButton
                    key={h}
                    active={h === heightCm}
                    onClick={() => setHeightCm(h)}
                  >
                    {h} cm
                  </PillButton>
                ))}
              </div>
            )}
          </div>

          {/* Verlengde deuren */}
          {verlengdeAvailable && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={isVerlengd}
                onChange={(e) => setIsVerlengd(e.target.checked)}
              />
              <span className="text-sm font-medium">
                Verlengde deuren{' '}
                <span className="text-muted-foreground font-normal">
                  — eigen hoogte invoeren
                </span>
              </span>
            </label>
          )}

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
            <Button
              type="button"
              size="lg"
              onClick={handleAddToCart}
              disabled={!canAdd || isAdding}
            >
              {isAdding
                ? 'Bezig…'
                : activeEditId
                  ? 'Wijzigingen opslaan'
                  : 'Voeg toe aan winkelwagen'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
