'use client'

import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { projects, MOBILE_PLANE_COUNT } from '@/lib/works/projects'
import { cameraTravel } from './layout'
import type { WorksConfig } from './useWorksControls'
import CameraRig from './CameraRig'
import GridEnvironment from './GridEnvironment'
import ProjectPlane from './ProjectPlane'
import Effects from './Effects'

interface SceneProps {
  config: WorksConfig
  isMobile: boolean
  reducedMotion: boolean
}

export default function Scene({ config, isMobile, reducedMotion }: SceneProps) {
  // Fewer planes on mobile; video/parallax/glitch only on capable, motion-ok
  // desktops.
  const count = isMobile ? Math.min(MOBILE_PLANE_COUNT, projects.length) : projects.length
  const rich = !isMobile && !reducedMotion

  const { spacing, travel, gridLength, gridCenter } = useMemo(() => {
    const spacing = config.planeSpacing
    const travel = cameraTravel(count, spacing)
    return {
      spacing,
      travel,
      gridLength: travel.start - travel.end + 60,
      gridCenter: (travel.start + travel.end) / 2,
    }
  }, [config.planeSpacing, count])

  const visible = projects.slice(0, count)

  return (
    <Canvas
      className="!fixed inset-0"
      dpr={[1, 2]}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
      camera={{ position: [0, 0, travel.start], fov: 50, near: 0.1, far: gridLength + 60 }}
    >
      <color attach="background" args={['#000000']} />
      <fogExp2 attach="fog" args={['#000000', config.fogDensity]} />

      <GridEnvironment centerZ={gridCenter} length={gridLength} />

      <Suspense fallback={null}>
        {visible.map((project, i) => (
          <ProjectPlane
            key={project.id}
            project={project}
            index={i}
            spacing={spacing}
            useVideo={rich}
            reducedMotion={reducedMotion}
          />
        ))}
      </Suspense>

      <CameraRig travel={travel} lerpFactor={config.cameraLerp} parallax={rich} />

      <Effects
        bloomIntensity={config.bloomIntensity}
        caRest={config.chromaticAberration}
        enableGlitch={rich}
      />
    </Canvas>
  )
}
