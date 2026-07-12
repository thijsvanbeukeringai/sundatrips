'use client'

import { useControls } from 'leva'
import { DEFAULT_PLANE_SPACING } from '@/lib/works/projects'

export interface WorksConfig {
  cameraLerp: number
  bloomIntensity: number
  chromaticAberration: number
  fogDensity: number
  planeSpacing: number
}

/**
 * Dev-time tuning panel. `useControls` registers into Leva's global store, so
 * this works whether or not the <Leva/> panel is actually mounted (it is
 * hidden in production). The returned object is stable between changes, so
 * passing it as props does not thrash the render loop.
 */
export function useWorksControls(): WorksConfig {
  const config = useControls('works', {
    cameraLerp: { value: 0.05, min: 0.01, max: 0.2, step: 0.005 },
    bloomIntensity: { value: 0.45, min: 0, max: 2, step: 0.05 },
    chromaticAberration: { value: 0.0006, min: 0, max: 0.01, step: 0.0001 },
    fogDensity: { value: 0.018, min: 0, max: 0.08, step: 0.001 },
    planeSpacing: { value: DEFAULT_PLANE_SPACING, min: 4, max: 16, step: 0.5 },
  })

  return config
}
