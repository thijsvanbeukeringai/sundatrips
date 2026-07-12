'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Noise,
  Glitch,
} from '@react-three/postprocessing'
import {
  BlendFunction,
  GlitchMode,
  type ChromaticAberrationEffect,
  type GlitchEffect,
} from 'postprocessing'
import * as THREE from 'three'
import { scrollStore } from '@/lib/works/store'

interface EffectsProps {
  bloomIntensity: number
  /** Resting chromatic-aberration offset. */
  caRest: number
  /** Enable the fast-scroll glitch burst (off on mobile / reduced motion). */
  enableGlitch: boolean
}

/** Extra CA offset added at full scroll speed. */
const CA_BOOST = 0.004
/** Scroll speed above which the glitch kicks in. */
const GLITCH_THRESHOLD = 0.55

export default function Effects({ bloomIntensity, caRest, enableGlitch }: EffectsProps) {
  const caRef = useRef<ChromaticAberrationEffect>(null)
  const glitchRef = useRef<GlitchEffect>(null)
  const currentCA = useRef(caRest)

  // The postprocessing components want three Vector2 instances, not tuples.
  const caOffset = useMemo(() => new THREE.Vector2(caRest, caRest), [caRest])
  const glitchDelay = useMemo(() => new THREE.Vector2(1.5, 3.5), [])
  const glitchDuration = useMemo(() => new THREE.Vector2(0.1, 0.25), [])
  const glitchStrength = useMemo(() => new THREE.Vector2(0.05, 0.2), [])

  useFrame(() => {
    const speed = scrollStore.speed

    // Ease the chromatic aberration toward its speed-driven target. The ~0.1
    // factor gives roughly a half-second settle back to rest.
    const targetCA = caRest + speed * CA_BOOST
    currentCA.current = THREE.MathUtils.lerp(currentCA.current, targetCA, 0.1)
    caRef.current?.offset.set(currentCA.current, currentCA.current)

    // Toggle glitch mode by ref so no React state churns in the frame loop.
    if (glitchRef.current) {
      glitchRef.current.mode =
        enableGlitch && speed > GLITCH_THRESHOLD ? GlitchMode.SPORADIC : GlitchMode.DISABLED
    }
  })

  const children: JSX.Element[] = [
    <Bloom
      key="bloom"
      intensity={bloomIntensity}
      luminanceThreshold={0.85}
      luminanceSmoothing={0.25}
      mipmapBlur
    />,
    <ChromaticAberration
      key="ca"
      // drei mistypes this ref as the constructor rather than the instance.
      ref={caRef as unknown as never}
      offset={caOffset}
      radialModulation={false}
      modulationOffset={0}
    />,
    <Noise key="noise" premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.025} />,
  ]

  if (enableGlitch) {
    children.splice(
      2,
      0,
      <Glitch
        key="glitch"
        ref={glitchRef}
        mode={GlitchMode.DISABLED}
        active
        delay={glitchDelay}
        duration={glitchDuration}
        strength={glitchStrength}
        ratio={0.85}
      />,
    )
  }

  return (
    <EffectComposer multisampling={0}>
      {children}
    </EffectComposer>
  )
}
