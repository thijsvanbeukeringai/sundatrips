'use client'

import { Suspense, useMemo, useRef, Component, type ReactNode, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, useTexture, useVideoTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { Project } from '@/lib/works/projects'
import { PLANE_WIDTH, PLANE_HEIGHT, planeLayout } from './layout'

/** Distance (world units) at which the info overlay reaches full opacity. */
const OVERLAY_RANGE = 5

/** Shared texture setup: sRGB, capped anisotropy, mobile-friendly filtering. */
function useConfiguredTexture(tex: THREE.Texture): THREE.Texture {
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy())
  return useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = Math.min(8, maxAniso)
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.needsUpdate = true
    return tex
  }, [tex, maxAniso])
}

type MaterialRef = RefObject<THREE.MeshBasicMaterial>

function ImageMaterial({ url, materialRef }: { url: string; materialRef: MaterialRef }) {
  const raw = useTexture(url)
  const tex = useConfiguredTexture(raw)
  return (
    <meshBasicMaterial
      ref={materialRef}
      map={tex}
      toneMapped={false}
      transparent
      side={THREE.DoubleSide}
    />
  )
}

function VideoMaterial({ url, materialRef }: { url: string; materialRef: MaterialRef }) {
  const raw = useVideoTexture(url, {
    muted: true,
    loop: true,
    playsInline: true,
    crossOrigin: 'anonymous',
    start: true,
  })
  const tex = useConfiguredTexture(raw)
  return (
    <meshBasicMaterial
      ref={materialRef}
      map={tex}
      toneMapped={false}
      transparent
      side={THREE.DoubleSide}
    />
  )
}

/**
 * Catches a failed video texture and swaps in the still image. Video load
 * errors reject the suspense promise, which surfaces here rather than at the
 * Suspense boundary.
 */
class MediaErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function PlaneMedia({
  project,
  useVideo,
  materialRef,
}: {
  project: Project
  useVideo: boolean
  materialRef: MaterialRef
}) {
  const image = <ImageMaterial url={project.fallbackImageUrl} materialRef={materialRef} />

  if (!useVideo || !project.mediaUrl) return image

  return (
    <MediaErrorBoundary fallback={image}>
      <Suspense fallback={image}>
        <VideoMaterial url={project.mediaUrl} materialRef={materialRef} />
      </Suspense>
    </MediaErrorBoundary>
  )
}

interface ProjectPlaneProps {
  project: Project
  index: number
  spacing: number
  useVideo: boolean
  reducedMotion: boolean
}

export default function ProjectPlane({
  project,
  index,
  spacing,
  useVideo,
  reducedMotion,
}: ProjectPlaneProps) {
  const layout = useMemo(() => planeLayout(index, spacing), [index, spacing])
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    // Sine float (skipped under reduced motion).
    const t = state.clock.elapsedTime
    mesh.position.y = reducedMotion
      ? 0
      : Math.sin(t * 0.6 + layout.phase) * layout.floatAmplitude

    // Depth fade of the plane itself + proximity fade of the overlay.
    const dz = Math.abs(state.camera.position.z - layout.position[2])
    if (materialRef.current) {
      const depth = THREE.MathUtils.clamp(1 - (dz - OVERLAY_RANGE) / 24, 0.12, 1)
      materialRef.current.opacity = depth
    }
    if (overlayRef.current) {
      const near = THREE.MathUtils.clamp(1 - dz / OVERLAY_RANGE, 0, 1)
      overlayRef.current.style.opacity = String(near)
    }
  })

  return (
    <group position={layout.position} rotation={layout.rotation}>
      <mesh ref={meshRef}>
        <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT]} />
        <PlaneMedia project={project} useVideo={useVideo} materialRef={materialRef} />
      </mesh>

      <Html
        position={[-PLANE_WIDTH / 2, -PLANE_HEIGHT / 2 - 0.25, 0.05]}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'none' }}
        prepend
      >
        <div
          ref={overlayRef}
          style={{ opacity: 0 }}
          className="w-[220px] select-none font-mono text-[11px] leading-relaxed text-white"
        >
          <div className="flex items-baseline gap-3">
            <span
              className="text-[13px] tracking-[0.2em]"
              style={{ color: project.accent }}
            >
              {project.title.toUpperCase()}
            </span>
            <span className="text-white/40">{project.date}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 text-white/50">
            {project.tags.map((tag) => (
              <span key={tag}>/ {tag}</span>
            ))}
          </div>
        </div>
      </Html>
    </group>
  )
}
