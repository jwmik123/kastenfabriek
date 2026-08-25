'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PortableText } from '@portabletext/react'

import { Button } from '@/components/ui/button'
import type { Product } from '@/sanity/lib/products'
import { calcSimpleProductPrice } from '@/lib/products/pricing'
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
 * A plain webshop article — a drawer, a hanger, a doorstop. No options to pick:
 * photos, a description, one price and a quantity.
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
  const maxQty = cfg?.maxQuantity ?? DEFAULT_MAX_QTY

  // Anon edit: the line only exists in localStorage, so look it up there.
  const localSeed = useMemo(() => {
    if (!editItemId || editItem) return null
    if (typeof window === 'undefined') return null
    const found = getCart().items.find((i) => i.id === editItemId)
    return found && found.kind === 'product' ? found : null
  }, [editItemId, editItem])
  const seed = editItem ?? localSeed

  const [qty, setQty] = useState<number>(seed?.quantity ?? 1)
  const activeEditId = seed?.id ?? null

  const images = useMemo(
    () => [
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
    [product],
  )

  if (!cfg) return null

  const unitPrice = cfg.priceEur
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
      },
      priceSnapshot: calcSimpleProductPrice(product),
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
