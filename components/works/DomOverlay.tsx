'use client'

import type { RefObject } from 'react'

interface DomOverlayProps {
  progressRef: RefObject<HTMLDivElement>
  hintRef: RefObject<HTMLDivElement>
}

/**
 * The DOM layer that sits on top of the canvas. The whole layer is
 * `pointer-events-none` so scrolling passes straight through to the page;
 * only the nav links opt back in. The progress bar and scroll hint are
 * mutated imperatively (via the passed refs) from the Lenis loop — no React
 * state, no re-renders.
 */
export default function DomOverlay({ progressRef, hintRef }: DomOverlayProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 font-mono text-white">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-5 mix-blend-difference sm:px-10">
        <a
          href="/"
          className="pointer-events-auto text-sm tracking-[0.35em]"
          aria-label="Sunda home"
        >
          SUNDA<span className="align-top text-[0.6em]">°</span>
        </a>
        <nav className="flex gap-5 text-[11px] tracking-[0.2em] text-white/80 sm:gap-8">
          <span className="hidden sm:inline">INDEX</span>
          <span className="text-white">WORKS</span>
          <a href="/" className="pointer-events-auto hidden transition-colors hover:text-white sm:inline">
            ABOUT
          </a>
          <a href="/#contact" className="pointer-events-auto transition-colors hover:text-white">
            CONTACT
          </a>
        </nav>
      </header>

      {/* Scroll-to-explore indicator (fades out after first scroll) */}
      <div
        ref={hintRef}
        className="absolute bottom-6 left-6 flex items-center gap-3 text-[10px] tracking-[0.3em] text-white/60 transition-opacity duration-500 sm:left-10"
      >
        <span>SCROLL TO EXPLORE</span>
        <span className="inline-block h-6 w-px animate-pulse bg-white/50" aria-hidden />
      </div>

      {/* Vertical scroll progress bar on the right edge */}
      <div className="absolute right-0 top-0 h-screen w-px bg-white/10">
        <div ref={progressRef} className="h-full w-full origin-top scale-y-0 bg-white/70" />
      </div>

      {/* Section caption, bottom-right */}
      <div className="absolute bottom-6 right-4 text-right text-[10px] tracking-[0.3em] text-white/40 sm:right-8">
        SELECTED WORKS
        <br />
        2022 — 2024
      </div>
    </div>
  )
}
