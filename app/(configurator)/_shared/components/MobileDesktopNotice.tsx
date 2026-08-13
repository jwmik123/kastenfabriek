'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from './useIsMobile'

// Once dismissed, stay quiet for the rest of the browsing session.
const STORAGE_KEY = 'kf-desktop-notice-dismissed'
const SWIPE_DISMISS_PX = 40

/**
 * Phone-only banner styled after an OS push notification: slides in when a
 * configurator mounts, tells the visitor the experience is best on desktop,
 * and goes away on close or on a swipe up.
 */
export default function MobileDesktopNotice() {
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)
  const [shown, setShown] = useState(false)
  const [dragY, setDragY] = useState(0)
  const dragStartY = useRef<number | null>(null)
  // State lags behind within a burst of pointer events, so the release check
  // reads the offset from a ref instead.
  const dragOffset = useRef(0)

  useEffect(() => {
    if (!isMobile) return
    if (sessionStorage.getItem(STORAGE_KEY) === '1') return
    setMounted(true)
    // Next frame, so the entry transition actually runs.
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [isMobile])

  function dismiss() {
    setShown(false)
    sessionStorage.setItem(STORAGE_KEY, '1')
    // Let the exit transition finish before unmounting.
    setTimeout(() => setMounted(false), 250)
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragStartY.current = e.clientY
    dragOffset.current = 0
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragStartY.current === null) return
    // Upward only; downward drag rubber-bands.
    const dy = e.clientY - dragStartY.current
    dragOffset.current = dy < 0 ? dy : dy * 0.2
    setDragY(dragOffset.current)
  }

  function onPointerUp() {
    const dragged = dragStartY.current !== null
    dragStartY.current = null
    if (dragged && dragOffset.current <= -SWIPE_DISMISS_PX) {
      dismiss()
      return
    }
    dragOffset.current = 0
    setDragY(0)
  }

  if (!mounted) return null

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="mobile-desktop-notice"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        'md:hidden fixed inset-x-3 z-[60] touch-none',
        'top-[max(0.75rem,env(safe-area-inset-top))]',
        dragStartY.current === null && 'transition-all duration-300 ease-out',
        shown ? 'opacity-100' : 'opacity-0',
      )}
      style={{
        transform: `translateY(${shown ? dragY : -24}px)`,
      }}
    >
      <div className="flex items-start gap-3 rounded-2xl bg-background/85 backdrop-blur-md border border-border/60 shadow-lg px-3.5 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary">
          <Image src="/logo.svg" alt="" width={20} height={20} className="invert" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Kastenfabriek
          </p>
          <p className="text-sm font-medium leading-snug mt-0.5">
            Configureren gaat het fijnst op desktop
          </p>
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">
            Op een groter scherm zie je je kast groter in 3D en staan alle opties
            naast elkaar.
          </p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Melding sluiten"
          data-testid="mobile-desktop-notice-close"
          className="-m-1 p-1 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
