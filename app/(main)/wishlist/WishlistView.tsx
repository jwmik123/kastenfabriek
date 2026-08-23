'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Heart, ShoppingCart, Pencil } from 'lucide-react'
import type { CartItem, ClosetCartItem, ProductCartItem } from '@/lib/cart/types'
import { summarizeCloset } from '@/lib/order/closet-spec'
import { addItem } from '@/lib/cart/cart-store'
import { getWishlist, removeWishlistItem } from '@/lib/wishlist/wishlist-store'
import { syncLocalWishlistToServer } from '@/lib/wishlist/wishlist-sync'
import { removeDbWishlistItem, moveDbWishlistItemToCart } from '@/lib/actions/wishlist'
import ShowroomCta, { type ShowroomCtaProps } from '@/components/ShowroomCta'

const COLORWAY_SLUGS: Record<string, string> = {
  'h1199-thermo-eik': 'thermo-eik-zwartbruin',
  'h3165-vicenza-eik-licht': 'vicenza-eik-licht',
  'h3158-vicenza-eik-grijs': 'vicenza-eik-grijs',
  'h1714-lincoln-notelaar': 'lincoln-notelaar',
  'h3190-fineline-antraciet': 'fineline-metallic-antraciet',
}

const fmt = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 })

interface WishlistViewProps {
  isAuthenticated: boolean
  initialDbItems: CartItem[]
  showroom: ShowroomCtaProps
}

export default function WishlistView({ isAuthenticated, initialDbItems, showroom }: WishlistViewProps) {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>(initialDbItems)
  const [synced, setSynced] = useState(false)
  const [isPending, startTransition] = useTransition()

  // On mount: if authenticated and localStorage has items, sync them then refresh
  useEffect(() => {
    if (!isAuthenticated || synced) return

    const local = getWishlist()
    if (local.items.length === 0) {
      setSynced(true)
      return
    }

    startTransition(async () => {
      await syncLocalWishlistToServer()
      setSynced(true)
      router.refresh()
    })
  }, [isAuthenticated, synced, router])

  // Sync server-fetched items into state after router.refresh() updates props
  useEffect(() => {
    if (isAuthenticated) setItems(initialDbItems)
  }, [initialDbItems, isAuthenticated])

  // If not authenticated, read from localStorage
  useEffect(() => {
    if (isAuthenticated) return

    setItems(getWishlist().items)

    const handleUpdate = () => setItems(getWishlist().items)
    window.addEventListener('wishlist-updated', handleUpdate)
    return () => window.removeEventListener('wishlist-updated', handleUpdate)
  }, [isAuthenticated])

  const handleRemove = (item: CartItem) => {
    if (isAuthenticated) {
      startTransition(async () => {
        await removeDbWishlistItem(item.id)
        setItems((prev) => prev.filter((i) => i.id !== item.id))
      })
    } else {
      removeWishlistItem(item.id)
    }
  }

  const handleMoveToCart = (item: CartItem) => {
    if (isAuthenticated) {
      startTransition(async () => {
        await moveDbWishlistItemToCart(item.id)
        router.push('/cart')
      })
    } else {
      addItem(item)
      removeWishlistItem(item.id)
      router.push('/cart')
    }
  }

  if (isPending && items.length === 0) {
    return <div className="text-center pt-24 py-20 text-gray-500">Laden...</div>
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Je verlanglijst is leeg</h2>
          <p className="text-gray-500 mb-8">
            Sla je favoriete ontwerpen op met de Bewaar-knop in de configurator.
          </p>
          <Link
            href="/kledingkast"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Configureer je kast
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 pt-20">Verlanglijst</h1>
      <p className="text-gray-500 mb-8">
        {items.length} {items.length === 1 ? 'opgeslagen ontwerp' : 'opgeslagen ontwerpen'}
        {!isAuthenticated && ' · log in om je lijst op elk apparaat te bewaren'}
      </p>

      <div className="space-y-4">
        {items.map((item) =>
          item.kind === 'product' ? (
            <ProductWishCard
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item)}
              onMoveToCart={() => handleMoveToCart(item)}
              editHref={`/producten/${item.configuration.productSlug}?edit=${item.id}`}
            />
          ) : (
            <ClosetWishCard
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item)}
              onMoveToCart={() => handleMoveToCart(item)}
            />
          )
        )}
      </div>

      <ShowroomCta {...showroom} />
    </div>
  )
}

function MoveToCartButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
    >
      <ShoppingCart className="w-4 h-4" />
      In winkelwagen
    </button>
  )
}

function ClosetWishCard({
  item,
  onRemove,
  onMoveToCart,
}: {
  item: ClosetCartItem
  onRemove: () => void
  onMoveToCart: () => void
}) {
  const config = item.configuration
  const headline = summarizeCloset(config)
  const price = item.priceSnapshot

  const configuredModules = config.modules.filter((m) => m.layoutId !== null)

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex gap-0">
      {/* Thumbnail */}
      {item.screenshotClosedUrl || item.screenshotOpenUrl ? (
        <div className="shrink-0 w-1/4 self-stretch flex flex-col overflow-hidden bg-gray-100">
          {item.screenshotClosedUrl && (
            <img src={item.screenshotClosedUrl} alt="Deuren dicht" className="w-full flex-1 object-cover" />
          )}
          {item.screenshotOpenUrl && (
            <img src={item.screenshotOpenUrl} alt="Deuren open" className="w-full flex-1 object-cover" />
          )}
        </div>
      ) : (
        <div className="shrink-0 w-36 self-stretch bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
          Geen preview
        </div>
      )}

      <div className="flex-1 min-w-0 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{headline.typeLabel}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {headline.totalWidthCm} × {headline.maxHeightCm} × {config.depthCm} cm
              {' · '}{headline.moduleTotal} {headline.moduleTotal === 1 ? 'module' : 'modules'}
              {config.hasTopCabinet && ` · bovenkast ${config.topCabinetHeightCm} cm`}
            </p>
          </div>
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            aria-label="Verwijder van verlanglijst"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {configuredModules.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {configuredModules.map((m) => (
              <span key={m.slotIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                {m.layoutName ?? `Layout ${m.layoutId}`}
                {m.span === 2 ? ' (breed)' : ''}
                {!m.hasDoor ? ' (geen deur)' : ''}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <MoveToCartButton onClick={onMoveToCart} />
          <span className="font-semibold text-gray-900">{fmt.format(price.total)}</span>
        </div>
      </div>
    </div>
  )
}

function ProductWishCard({
  item,
  onRemove,
  onMoveToCart,
  editHref,
}: {
  item: ProductCartItem
  onRemove: () => void
  onMoveToCart: () => void
  editHref: string
}) {
  const { configuration: cfg, priceSnapshot: price } = item
  const slug = COLORWAY_SLUGS[cfg.materialId] ?? cfg.materialId

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex gap-0">
      <div className="shrink-0 w-1/4 self-stretch bg-gray-100 relative min-h-[160px]">
        <Image
          src={`/colorways/${slug}-1.webp`}
          alt={cfg.materialName}
          fill
          sizes="(max-width: 768px) 25vw, 200px"
          className="object-cover"
        />
      </div>

      <div className="flex-1 min-w-0 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{cfg.productName}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {cfg.widthCm} × {cfg.heightCm} cm · {cfg.materialName}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={editHref}
              className="text-gray-400 hover:text-primary transition-colors p-1"
              aria-label="Aanpassen"
            >
              <Pencil className="w-4 h-4" />
            </Link>
            <button
              onClick={onRemove}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              aria-label="Verwijder van verlanglijst"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <MoveToCartButton onClick={onMoveToCart} />
          <span className="font-semibold text-gray-900">{fmt.format(price.total)}</span>
        </div>
      </div>
    </div>
  )
}
