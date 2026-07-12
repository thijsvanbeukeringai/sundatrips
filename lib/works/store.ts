/**
 * Frame-loop shared state.
 *
 * These are plain module-level singletons intentionally kept out of React
 * state. Lenis (scroll) and a window pointer listener write to them every
 * frame; `useFrame` callbacks read from them. Because nothing here triggers a
 * React re-render, the R3F render loop stays allocation-free and stable at
 * 60fps regardless of how fast the user scrolls or moves the mouse.
 */

export const scrollStore = {
  /** Normalised scroll progress through the page, 0 → 1. */
  progress: 0,
  /** Raw Lenis velocity (px/frame-ish, signed). */
  velocity: 0,
  /** Normalised absolute scroll speed, 0 → 1, eased toward 0 when idle. */
  speed: 0,
}

export const pointerStore = {
  /** Normalised cursor position, -1 → 1 on both axes (0,0 = centre). */
  x: 0,
  y: 0,
}
