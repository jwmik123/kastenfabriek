'use client'

import { useEffect } from 'react'

// Same breakpoint as useIsMobile — below Tailwind's `md`.
const MOBILE_QUERY = '(max-width: 767px)'

/**
 * Locks the page to the visual viewport on phones while a configurator route
 * is mounted. The root layout sizes <body> with min-h-screen (100vh, LARGE
 * viewport); on mobile with the browser toolbar visible that is taller than
 * the configurator's svh/dvh container, leaving white space below the wizard
 * footer and making the whole page scrollable. Capping html/body at 100dvh
 * with overflow hidden pins the footer and confines scrolling to the step
 * ScrollArea.
 *
 * Desktop is left alone: the configurator pages render extra sections below
 * the canvas (ColorwayPreview, summary) that must stay reachable by scrolling.
 */
export default function LockViewport() {
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prev = {
      htmlHeight: html.style.height,
      htmlOverflow: html.style.overflow,
      bodyHeight: body.style.height,
      bodyMinHeight: body.style.minHeight,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
    }

    const lock = () => {
      html.style.height = '100dvh'
      html.style.overflow = 'hidden'
      body.style.height = '100dvh'
      body.style.minHeight = '0'
      body.style.overflow = 'hidden'
      body.style.overscrollBehavior = 'none'
    }

    const unlock = () => {
      html.style.height = prev.htmlHeight
      html.style.overflow = prev.htmlOverflow
      body.style.height = prev.bodyHeight
      body.style.minHeight = prev.bodyMinHeight
      body.style.overflow = prev.bodyOverflow
      body.style.overscrollBehavior = prev.bodyOverscroll
    }

    const mql = window.matchMedia(MOBILE_QUERY)
    const apply = () => (mql.matches ? lock() : unlock())
    apply()
    mql.addEventListener('change', apply)

    // overflow:hidden does not stop the browser from scrolling the page itself:
    // iOS pans the layout viewport when the keyboard opens for a dimension
    // input (and scrollIntoView can do the same), and never pans back. That
    // leaves the whole configurator shifted with the wizard footer off-screen.
    // Snap the page back whenever the keyboard closes or the viewport settles.
    const resetScroll = () => {
      if (!mql.matches) return
      // While typing, the pan is what keeps the input above the keyboard.
      const active = document.activeElement
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return
      if (window.scrollY !== 0 || html.scrollTop !== 0 || body.scrollTop !== 0) {
        window.scrollTo(0, 0)
        html.scrollTop = 0
        body.scrollTop = 0
      }
    }
    const onFocusOut = () => setTimeout(resetScroll, 50)
    document.addEventListener('focusout', onFocusOut)
    window.addEventListener('scroll', resetScroll, { passive: true })
    window.visualViewport?.addEventListener('resize', resetScroll)

    return () => {
      document.removeEventListener('focusout', onFocusOut)
      window.removeEventListener('scroll', resetScroll)
      window.visualViewport?.removeEventListener('resize', resetScroll)
      mql.removeEventListener('change', apply)
      unlock()
    }
  }, [])

  return null
}
