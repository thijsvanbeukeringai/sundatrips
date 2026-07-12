/**
 * Deterministic scene layout maths. Everything here is a pure function of the
 * plane index + spacing, so the layout is identical on every render and between
 * server and client — no Math.random(), no hydration drift.
 */

export const PLANE_WIDTH = 5.4
export const PLANE_HEIGHT = PLANE_WIDTH * (9 / 16)

/** Cheap deterministic hash → [0, 1). */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

export interface PlaneLayout {
  position: [number, number, number]
  rotation: [number, number, number]
  /** Unique phase for the floating sine animation. */
  phase: number
  floatAmplitude: number
}

/**
 * Scatters plane `i` a little in x/y and rotates it a few degrees so the set
 * reads as drifting through space rather than lined up on a rail.
 */
export function planeLayout(i: number, spacing: number): PlaneLayout {
  const side = i % 2 === 0 ? 1 : -1
  const x = side * (1.6 + hash(i) * 1.7)
  const y = (hash(i + 10) - 0.5) * 1.6
  const z = -i * spacing

  const rotX = (hash(i + 20) - 0.5) * 0.14
  const rotY = -side * (0.06 + hash(i + 30) * 0.1)
  const rotZ = (hash(i + 40) - 0.5) * 0.1

  return {
    position: [x, y, z],
    rotation: [rotX, rotY, rotZ],
    phase: hash(i + 50) * Math.PI * 2,
    floatAmplitude: 0.12 + hash(i + 60) * 0.12,
  }
}

export interface CameraTravel {
  start: number
  end: number
}

/**
 * The camera flies from just in front of the first plane to just past the last.
 * Progress 0 → 1 maps linearly across this range.
 */
export function cameraTravel(count: number, spacing: number): CameraTravel {
  const lead = spacing * 0.7
  return {
    start: lead,
    end: -(count - 1) * spacing - lead,
  }
}
