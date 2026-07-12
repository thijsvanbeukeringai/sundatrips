'use client'

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollStore, pointerStore } from '@/lib/works/store'
import type { CameraTravel } from './layout'

/** Max parallax rotation ≈ 2°. */
const MAX_PARALLAX = THREE.MathUtils.degToRad(2)

interface CameraRigProps {
  travel: CameraTravel
  lerpFactor: number
  parallax: boolean
}

/**
 * Drives the camera. Scroll progress (read from the Lenis-fed store, never
 * React state) maps to a target z; the camera eases toward it with a low lerp
 * factor so movement feels heavy and slightly delayed. Optional mouse parallax
 * tilts the camera up to ~2° toward the cursor.
 */
export default function CameraRig({ travel, lerpFactor, parallax }: CameraRigProps) {
  useFrame((state, delta) => {
    const cam = state.camera

    // Frame-rate independent lerp toward the scroll target.
    const targetZ = THREE.MathUtils.lerp(travel.start, travel.end, scrollStore.progress)
    const t = 1 - Math.pow(1 - lerpFactor, delta * 60)
    cam.position.z = THREE.MathUtils.lerp(cam.position.z, targetZ, t)

    // Parallax tilt.
    const targetRotY = parallax ? pointerStore.x * MAX_PARALLAX : 0
    const targetRotX = parallax ? -pointerStore.y * MAX_PARALLAX : 0
    cam.rotation.y = THREE.MathUtils.lerp(cam.rotation.y, targetRotY, 0.05)
    cam.rotation.x = THREE.MathUtils.lerp(cam.rotation.x, targetRotX, 0.05)
  })

  return null
}
