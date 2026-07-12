'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Lenis from 'lenis'
import { Leva } from 'leva'
import { scrollStore, pointerStore } from '@/lib/works/store'
import { useIsMobile, usePrefersReducedMotion } from '@/lib/works/hooks'
import { useWorksControls } from './useWorksControls'
import DomOverlay from './DomOverlay'

// The R3F canvas is client-only: dynamic import with ssr:false keeps three.js
// out of the server bundle and avoids any hydration of WebGL state.
const Scene = dynamic(() => import('./Scene'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 -z-10 bg-black" />,
})

const IS_PROD = process.env.NODE_ENV === 'production'
/** Divisor that maps raw Lenis velocity to a normalised 0–1 speed. */
const SPEED_SCALE = 45

export default function WorksShowcase() {
  const isMobile = useIsMobile()
  const reducedMotion = usePrefersReducedMotion()
  const config = useWorksControls()

  const progressRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  // Lenis smooth scroll + the single rAF loop that feeds the frame-loop store
  // and mutates the DOM overlay imperatively.
  useEffect(() => {
    const prevBodyBg = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#000000'

    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 })

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)

      const progress = Number.isFinite(lenis.progress) ? lenis.progress : 0
      scrollStore.progress = progress
      scrollStore.velocity = lenis.velocity
      const instant = Math.min(Math.abs(lenis.velocity) / SPEED_SCALE, 1)
      scrollStore.speed += (instant - scrollStore.speed) * 0.2

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleY(${progress})`
      }
      if (hintRef.current) {
        hintRef.current.style.opacity = progress > 0.02 ? '0' : '1'
      }

      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      document.body.style.backgroundColor = prevBodyBg
    }
  }, [])

  // Cursor tracking for camera parallax (consumed only when parallax is on).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerStore.x = (e.clientX / window.innerWidth) * 2 - 1
      pointerStore.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div className="bg-black text-white">
      <Leva hidden={IS_PROD} collapsed />

      {/* Fixed fullscreen canvas behind everything */}
      <Scene config={config} isMobile={isMobile} reducedMotion={reducedMotion} />

      {/* DOM layer on top */}
      <DomOverlay progressRef={progressRef} hintRef={hintRef} />

      {/* Tall scroll container — gives Lenis its scroll range (~500vh) */}
      <div aria-hidden style={{ height: '500vh' }} />
    </div>
  )
}
