'use client'

import { useEffect } from 'react'

/**
 * Locks the page to the visual viewport while a configurator route is
 * mounted. The root layout sizes <body> with min-h-screen (100vh, LARGE
 * viewport); on mobile with the browser toolbar visible that is taller than
 * the configurator's svh/dvh container, leaving white space below the wizard
 * footer and making the whole page scrollable. Capping html/body at 100dvh
 * with overflow hidden pins the footer and confines scrolling to the step
 * ScrollArea.
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
    html.style.height = '100dvh'
    html.style.overflow = 'hidden'
    body.style.height = '100dvh'
    body.style.minHeight = '0'
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    return () => {
      html.style.height = prev.htmlHeight
      html.style.overflow = prev.htmlOverflow
      body.style.height = prev.bodyHeight
      body.style.minHeight = prev.bodyMinHeight
      body.style.overflow = prev.bodyOverflow
      body.style.overscrollBehavior = prev.bodyOverscroll
    }
  }, [])

  return null
}
