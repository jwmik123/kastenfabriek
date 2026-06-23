'use client'

import { useEffect, useState } from 'react'

// Below Tailwind's `md` breakpoint (768px).
const MOBILE_QUERY = '(max-width: 767px)'

/**
 * Reactive phone-viewport flag. Starts `false` for SSR/first paint and updates
 * on mount and on viewport changes. Only used inside client-only configurator
 * components, so the initial `false` never causes a hydration mismatch.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const update = () => setIsMobile(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  return isMobile
}
