'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PortableText } from '@portabletext/react'

import { Button } from '@/components/ui/button'
import type { Product } from '@/sanity/lib/products'
import {
  calcSimpleProductPrice,
  resolveSimpleOptions,
  type SimpleOptionSelection,
} from '@/lib/products/pricing'
import { urlFor } from '@/sanity/lib/image'
import {
  addItem as addLocalCartItem,
  replaceItem as replaceLocalCartItem,
  getCart,
} from '@/lib/cart/cart-store'
import { addProductCartItem, updateProductCartItem } from '@/lib/actions/cart'
import type { ProductCartItem } from '@/lib/cart/types'
import { useSession } from '@/lib/auth-client'
import ProductImageGallery from './ProductImageGallery'

function formatEuro(amount: number) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const DEFAULT_MAX_QTY = 10

/**
 * A plain webshop article or service — a drawer, a hanger, montage. Photos, a
 * description, optional choices (kleur, maat, …) and a quantity.
 */
export default function SimpleProductConfigurator({
  product,
  editItemId,
  editItem,
}: {
  product: Product
  editItemId: string | null
  editItem: ProductCartItem | null
}) {
  const router = useRouter()
  const session = useSession()
  const [isAdding, startAddTransition] = useTransition()

  const cfg = product.simpleConfig
  const isService = cfg?.isService ?? false
  // A service is ordered once: no stepper, always one.
  const maxQty = isService ? 1 : (cfg?.maxQuantity ?? DEFAULT_MAX_QTY)

  // Anon edit: the line only exists in localStorage, so look it up there.
  const localSeed = useMemo(() => {
    if (!editItemId || editItem) return null
    if (typeof window === 'undefined') return null
    const found = getCart().items.find((i) => i.id === editItemId)
    return found && found.kind === 'product' ? found : null
  }, [editItemId, editItem])
  const seed = editItem ?? localSeed

  const [qty, setQty] = useState<number>(isService ? 1 : (seed?.quantity ?? 1))
  const activeEditId = seed?.id ?? null

  // Snapshots store names, not keys (they must read well on an order years
  // later), so an edited line finds its picks back by group name and label.
  const [selection, setSelection] = useState<SimpleOptionSelection>(() => {
    const picked: SimpleOptionSelection = {}
    for (const o of seed?.configuration.selectedOptions ?? []) {
      const group = cfg?.optionGroups?.find((g) => g.name === o.group)
      const value = group?.values?.find((v) => v.label === o.value)
      if (group && value) picked[group._key] = value._key
    }
    return picked
  })
  const resolved = useMemo(
    () => (cfg ? resolveSimpleOptions(cfg, selection) : []),
    [cfg, selection],
  )
  const optionImage = resolved.find((o) => o.value.image)?.value

  const images = useMemo(
    () => [
      ...(optionImage?.image
        ? [
            {
              url: urlFor(optionImage.image).width(1600).height(1600).url(),
              alt: `${product.title} — ${optionImage.label}`,
            },
          ]
        : []),
      ...(product.heroImage
        ? [
            {
              url: urlFor(product.heroImage).width(1600).height(1600).url(),
              alt: product.title,
            },
          ]
        : []),
      ...(product.gallery ?? []).map((img, i) => ({
        url: urlFor(img).width(1600).height(1600).url(),
        alt: `${product.title} — afbeelding ${i + 1}`,
      })),
    ],
    [product, optionImage],
  )

  if (!cfg) return null

  const priceSnapshot = calcSimpleProductPrice(product, selection)
  const unitPrice = priceSnapshot.unitPrice
  const lineTotal = unitPrice * qty

  const handleAddToCart = () => {
    const isEditing = activeEditId !== null
    const itemId =
      activeEditId ??
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`)
    const now = new Date().toISOString()
    const cartItem: ProductCartItem = {
      id: itemId,
      addedAt: seed?.addedAt ?? now,
      kind: 'product',
      configuration: {
        id: itemId,
        capturedAt: now,
        sanityProductId: product._id,
        productType: product.productType,
        productSlug: product.slug,
        productName: product.title,
        imageUrl: images[0]?.url,
        sku: cfg.sku,
        isService: isService || undefined,
        selectedOptions: resolved.length
          ? resolved.map((o) => ({ group: o.group.name, value: o.value.label }))
          : undefined,
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

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <ProductImageGallery images={images} />

      <div>
        <h1 className="text-4xl font-serif text-gray-900 mb-3">{product.title}</h1>
        <p className="text-lg text-gray-600 mb-6">{product.shortDescription}</p>

        <div className="text-3xl font-serif mb-8">{formatEuro(unitPrice)}</div>

        <div className="prose prose-sm max-w-none text-gray-700 mb-8">
          <PortableText value={product.longDescription} />
        </div>

        {cfg.sku && (
          <p className="text-sm text-muted-foreground mb-8">
            Artikelnummer: {cfg.sku}
          </p>
        )}

        <div className="space-y-8">
          {resolved.map(({ group, value: selected }) => (
            <div key={group._key}>
              <h3 className="text-sm font-medium mb-2">
                {group.name}
                <span className="font-normal text-muted-foreground">: {selected.label}</span>
              </h3>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={group.name}>
                {group.values.map((v) => {
                  const active = v._key === selected._key
                  const delta = v.priceDeltaEur ?? 0
                  return (
                    <button
                      key={v._key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelection((s) => ({ ...s, [group._key]: v._key }))}
                      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                        active
                          ? 'border-primary bg-primary/5 text-gray-900'
                          : 'border-gray-300 text-gray-700 hover:border-gray-500'
                      }`}
                    >
                      {v.colorHex && (
                        <span
                          aria-hidden="true"
                          className="size-4 rounded-full border border-black/15"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      )}
                      {v.label}
                      {delta !== 0 && (
                        <span className="text-muted-foreground">
                          {delta > 0 ? '+' : '−'}
                          {formatEuro(Math.abs(delta))}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {!isService && (
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
                disabled={qty >= maxQty}
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                aria-label="Plus"
              >
                +
              </Button>
            </div>
          </div>
          )}

          <div className="border-t pt-6 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Totaal</div>
              <div className="text-3xl font-serif">{formatEuro(lineTotal)}</div>
            </div>
            <Button
              type="button"
              size="lg"
              onClick={handleAddToCart}
              disabled={isAdding}
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
