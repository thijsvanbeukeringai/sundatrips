'use client'

import { useEffect, useState } from 'react'

/**
 * Tracks a `matchMedia` query as React state, SSR-safe (starts `false`, then
 * corrects on mount). Shared by the mobile and reduced-motion hooks below.
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** True below the 768px breakpoint — drives the mobile quality path. */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}

/** True when the user has requested reduced motion. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
