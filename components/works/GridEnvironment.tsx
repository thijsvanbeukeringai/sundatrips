'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uCameraZ;
  uniform float uLength;
  uniform vec3  uColor;

  // Anti-aliased grid line coverage for a given tiling of the uv space.
  float gridLines(vec2 uv, float scaleX, float scaleY, float width) {
    vec2 c = vec2(uv.x * scaleX, uv.y * scaleY);
    vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
    float line = min(g.x, g.y);
    return 1.0 - clamp(line - width, 0.0, 1.0);
  }

  void main() {
    // Scroll the grid along the tube with the camera + a slow drift so it
    // never feels static, and layer a coarse grid over a fine one.
    float scroll = uCameraZ / uLength - uTime * 0.008;
    vec2 uv = vec2(vUv.x, vUv.y + scroll);

    float fine   = gridLines(uv, 60.0, 90.0, 0.6);
    float coarse = gridLines(uv, 12.0, 18.0, 0.9);
    float g = max(fine * 0.35, coarse * 0.7);

    // Gentle emissive pulse.
    float pulse = 0.75 + 0.25 * sin(uTime * 0.6 + vUv.y * 6.2831);

    // Fade the seam at the very ends of the cylinder so it reads as depth.
    float endFade = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);

    float alpha = g * 0.5 * pulse * endFade;
    vec3 col = uColor * (0.6 + g * 0.8);
    gl_FragColor = vec4(col, alpha);
  }
`

interface GridEnvironmentProps {
  centerZ: number
  length: number
  radius?: number
}

/**
 * A large open cylinder wrapped around the camera path, rendered from the
 * inside with a scrolling emissive grid shader. Gives the "flying through a
 * technical space" backdrop. Additive, depth-write off, so planes read cleanly
 * on top and the fog swallows distant lines.
 */
export default function GridEnvironment({
  centerZ,
  length,
  radius = 18,
}: GridEnvironmentProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCameraZ: { value: 0 },
      uLength: { value: length },
      uColor: { value: new THREE.Color('#5a7cff') },
    }),
    [length],
  )

  useFrame((state) => {
    const mat = materialRef.current
    if (!mat) return
    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uCameraZ.value = state.camera.position.z
  })

  return (
    <mesh position={[0, 0, centerZ]} rotation={[Math.PI / 2, 0, 0]}>
      {/* radius, radius, height, radialSegments, heightSegments, openEnded */}
      <cylinderGeometry args={[radius, radius, length, 64, 1, true]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}
