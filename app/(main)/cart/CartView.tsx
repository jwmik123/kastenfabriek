'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, ShoppingBag, ArrowRight, Pencil } from 'lucide-react'
import type { CartItem, ClosetCartItem, ProductCartItem } from '@/lib/cart/types'
import { getCart, removeItem, clearCart } from '@/lib/cart/cart-store'
import { syncCartItems, removeDbCartItem } from '@/lib/actions/cart'
import { getDeliveryWindow } from '@/lib/delivery-window'

const COLORWAY_SLUGS: Record<string, string> = {
  'h1199-thermo-eik': 'thermo-eik-zwartbruin',
  'h3165-vicenza-eik-licht': 'vicenza-eik-licht',
  'h3158-vicenza-eik-grijs': 'vicenza-eik-grijs',
  'h1714-lincoln-notelaar': 'lincoln-notelaar',
  'h3190-fineline-antraciet': 'fineline-metallic-antraciet',
}

const fmt = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 })

interface CartViewProps {
  isAuthenticated: boolean
  initialDbItems: CartItem[]
}

export default function CartView({ isAuthenticated, initialDbItems }: CartViewProps) {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>(initialDbItems)
  const [synced, setSynced] = useState(false)
  const [isPending, startTransition] = useTransition()

  // On mount: if authenticated and localStorage has items, sync them then refresh
  useEffect(() => {
    if (!isAuthenticated || synced) return

    const localCart = getCart()
    if (localCart.items.length === 0) {
      setSynced(true)
      return
    }

    startTransition(async () => {
      await syncCartItems(localCart.items)
      clearCart()
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

    const localCart = getCart()
    setItems(localCart.items)

    const handleUpdate = () => setItems(getCart().items)
    window.addEventListener('cart-updated', handleUpdate)
    return () => window.removeEventListener('cart-updated', handleUpdate)
  }, [isAuthenticated])

  const handleRemove = (item: CartItem) => {
    if (isAuthenticated) {
      startTransition(async () => {
        await removeDbCartItem(item.id)
        setItems((prev) => prev.filter((i) => i.id !== item.id))
      })
    } else {
      removeItem(item.id)
    }
  }

  const totals = items.reduce(
    (acc, item) => {
      if (item.kind === 'closet') {
        return {
          subtotal: acc.subtotal + item.priceSnapshot.subtotal * item.quantity,
          installation: acc.installation + item.priceSnapshot.installationCost * item.quantity,
          total: acc.total + item.priceSnapshot.total * item.quantity,
        }
      }
      // Product line: total excludes delivery; show under subtotal.
      return {
        subtotal: acc.subtotal + (item.priceSnapshot.total + item.priceSnapshot.deliveryCost) * item.quantity,
        installation: acc.installation,
        total: acc.total + (item.priceSnapshot.total + item.priceSnapshot.deliveryCost) * item.quantity,
      }
    },
    { subtotal: 0, installation: 0, total: 0 }
  )

  if (isPending && items.length === 0) {
    return <div className="text-center pt-24 py-20 text-gray-500">Laden...</div>
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Je winkelwagen is leeg</h2>
          <p className="text-gray-500 mb-8">Configureer een kast om te beginnen.</p>
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8 pt-20">Winkelwagen</h1>

      <div className="space-y-4 mb-8">
        {items.map((item) =>
          item.kind === 'product' ? (
            <ProductItemCard
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item)}
              editHref={`/producten/${item.configuration.productSlug}?edit=${item.id}`}
            />
          ) : (
            <CartItemCard
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item)}
              editHref={`/kledingkast?edit=${item.id}`}
            />
          )
        )}
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overzicht</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Kast(en) + bezorging</span>
            <span>{fmt.format(totals.subtotal)}</span>
          </div>
          {totals.installation > 0 && (
            <div className="flex justify-between">
              <span>Installatie</span>
              <span>{fmt.format(totals.installation)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100 text-base">
            <span>Totaal</span>
            <span>{fmt.format(totals.total)}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-gray-500">Geschatte aankomst</span>
            <span className="text-gray-700">{getDeliveryWindow(new Date())}</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {isAuthenticated ? (
            <Link
              href="/checkout"
              className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Afrekenen
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="space-y-3">
              <Link
                href="/login?callbackUrl=/cart"
                className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Inloggen om af te rekenen
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-center text-sm text-gray-500">
                Je winkelwagen blijft bewaard tijdens het inloggen.
              </p>
            </div>
          )}
          <Link
            href={`/kledingkast${items.length === 1 && items[0].kind === 'closet' ? `?edit=${items[0].id}` : ''}`}
            className="flex items-center justify-center w-full py-3 px-6 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            Verder configureren
          </Link>
        </div>
      </div>
    </div>
  )
}

function CartItemCard({ item, onRemove, editHref }: { item: ClosetCartItem; onRemove: () => void; editHref: string }) {
  const config = item.configuration
  const price = item.priceSnapshot
  const [expanded, setExpanded] = useState(false)

  const configuredModules = config.modules.filter((m) => m.layoutId !== null)

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex gap-0">
      {/* Thumbnail */}
      {item.screenshotClosedUrl || item.screenshotOpenUrl ? (
        <div className="shrink-0 w-1/4 self-stretch flex flex-col overflow-hidden bg-gray-100">
          {item.screenshotClosedUrl && (
            <img
              src={item.screenshotClosedUrl}
              alt="Deuren dicht"
              className="w-full flex-1 object-cover"
            />
          )}
          {item.screenshotOpenUrl && (
            <img
              src={item.screenshotOpenUrl}
              alt="Deuren open"
              className="w-full flex-1 object-cover"
            />
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
          <h3 className="font-semibold text-gray-900 text-lg">Maatwerkkast</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {config.widthCm} × {config.heightCm} × {config.depthCm} cm
            {' · '}{config.moduleCount} {config.moduleCount === 1 ? 'module' : 'modules'}
            {config.hasTopCabinet && ` · bovenkast ${config.topCabinetHeightCm} cm`}
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
            aria-label="Verwijder item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Module list */}
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

      {/* Price breakdown (collapsible) */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="text-sm text-primary hover:underline mb-2"
      >
        {expanded ? 'Verberg prijsopbouw' : 'Toon prijsopbouw'}
      </button>

      {expanded && (
        <div className="text-sm text-gray-500 space-y-1 bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between"><span>Modules</span><span>{fmt.format(price.moduleCost)}</span></div>
          <div className="flex justify-between"><span>Deuren</span><span>{fmt.format(price.doorCost)}</span></div>
          <div className="flex justify-between"><span>Scharnieren/grepen</span><span>{fmt.format(price.mechanismCost)}</span></div>
          <div className="flex justify-between"><span>Bezorging</span><span>{fmt.format(price.deliveryCost)}</span></div>
          {price.installationCost > 0 && (
            <div className="flex justify-between"><span>Installatie ({price.installationTierName})</span><span>{fmt.format(price.installationCost)}</span></div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <span className="font-semibold text-gray-900">{fmt.format(price.total)}</span>
      </div>
      </div>
    </div>
  )
}

function ProductItemCard({
  item,
  onRemove,
  editHref,
}: {
  item: ProductCartItem
  onRemove: () => void
  editHref: string
}) {
  const { configuration: cfg, priceSnapshot: price, quantity } = item
  const slug = COLORWAY_SLUGS[cfg.materialId] ?? cfg.materialId
  const lineTotal = (price.total + price.deliveryCost) * quantity

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
              {' · '}{quantity} {quantity === 1 ? 'stuk' : 'stuks'}
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
              aria-label="Verwijder item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-500 space-y-1 mb-4">
          <div className="flex justify-between"><span>Stuksprijs</span><span>{fmt.format(price.unitPrice)}</span></div>
          {price.materialSurcharge > 0 && (
            <div className="flex justify-between"><span>Materiaal-toeslag</span><span>{fmt.format(price.materialSurcharge)}</span></div>
          )}
          <div className="flex justify-between"><span>Bezorging</span><span>{fmt.format(price.deliveryCost)}</span></div>
        </div>

        <div className="flex justify-end">
          <span className="font-semibold text-gray-900">{fmt.format(lineTotal)}</span>
        </div>
      </div>
    </div>
  )
}
