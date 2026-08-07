'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Menu, X, User, ShoppingBasket, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONFIGURATORS_HREF } from '@/lib/configurators'

const priceFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/producten', label: 'Producten' },
  { href: '/contact', label: 'Blog' },
]

const ICON_LINKS = [
  { href: '/wishlist', icon: Heart, label: 'Wishlist' },
  { href: '/cart', icon: ShoppingBasket, label: 'Winkelwagen' },
  { href: '/account', icon: User, label: 'Account' },
]

interface Props {
  /** Running total in euros; shown on the left of the header. */
  price: number
  productName?: string
}

/**
 * Mobile-only configurator header: running total on the left, hamburger menu on
 * the right. The menu opens a full-screen site-navigation overlay (mirrors the
 * site `Navigation` hamburger). The draft is autosaved, so navigating away does
 * not lose the configuration.
 */
export default function ConfiguratorMobileHeader({ price, productName }: Props) {
  const [open, setOpen] = useState(false)

  // Lock body scroll while the overlay is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <header className="md:hidden h-14 shrink-0 border-b border-border bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        {/* Back out of the configurator; the draft autosaves. */}
        <Link
          href={CONFIGURATORS_HREF}
          data-testid="configurator-back"
          aria-label="Terug naar overzicht"
          className="flex items-center justify-center w-9 h-9 -ml-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex flex-col leading-none">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
            {productName ?? 'Totaalprijs'}
          </span>
          <span className="text-lg font-medium leading-none">{priceFormatter.format(price)}</span>
        </div>
      </div>

      <button
        type="button"
        aria-label="Menu openen"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-11 h-11 -mr-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
      >
        <Menu className="size-6" />
      </button>

      <div
        className={cn(
          'fixed inset-0 z-50 bg-primary flex flex-col items-center justify-center gap-8 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      >
        <button
          type="button"
          aria-label="Menu sluiten"
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 flex items-center justify-center w-11 h-11 rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="size-7" />
        </button>

        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className="text-white text-3xl font-medium hover:opacity-80 transition-opacity"
          >
            {label}
          </Link>
        ))}

        <div className="w-16 h-px bg-white/30 my-2" />

        <div className="flex items-center gap-6">
          {ICON_LINKS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              onClick={() => setOpen(false)}
              className="text-white hover:opacity-80 transition-opacity"
            >
              <Icon size={28} />
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
