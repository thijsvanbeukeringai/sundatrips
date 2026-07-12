/**
 * Works showcase data.
 *
 * This is the single source of truth for the 3D works section. To use your own
 * media, edit the entries below:
 *
 *   - `mediaUrl`         optional mp4/webm played as a video texture on desktop.
 *                        Leave undefined to always use the still image.
 *   - `fallbackImageUrl` still image used on mobile, when reduced motion is on,
 *                        or when the video fails to load. Kept ≤ 1024px.
 *   - `detailUrl`        where the "view project" link points.
 *
 * The placeholder .svg files in /public/works are generated stand-ins — swap
 * them (or point `fallbackImageUrl` / `mediaUrl` elsewhere) whenever you like.
 * The scene, camera travel and overlays all derive from this array, so adding
 * or removing an entry is all that's needed to reshape the showcase.
 */

export interface Project {
  /** Stable identifier, also used as a React key. */
  id: string
  title: string
  /** Free-form date label, e.g. a year or "2024 — ongoing". */
  date: string
  tags: string[]
  /** Video texture source (mp4/webm). Optional — omit for image-only. */
  mediaUrl?: string
  /** Still image, ≤ 1024px. Used as the video fallback and on mobile. */
  fallbackImageUrl: string
  detailUrl: string
  /** Accent colour reused by the overlay + placeholder art. */
  accent: string
}

export const projects: Project[] = [
  {
    id: 'meridian',
    title: 'Meridian',
    date: '2023',
    tags: ['WebGL', 'Brand'],
    mediaUrl: undefined,
    fallbackImageUrl: '/works/meridian.svg',
    detailUrl: '#meridian',
    accent: '#7c8cff',
  },
  {
    id: 'kaiho',
    title: 'Kaihō',
    date: '2024',
    tags: ['Editorial', 'Type'],
    mediaUrl: undefined,
    fallbackImageUrl: '/works/kaiho.svg',
    detailUrl: '#kaiho',
    accent: '#ff8a5c',
  },
  {
    id: 'nocturne',
    title: 'Nocturne',
    date: '2023',
    tags: ['Film', 'Sound'],
    mediaUrl: undefined,
    fallbackImageUrl: '/works/nocturne.svg',
    detailUrl: '#nocturne',
    accent: '#c9c9c9',
  },
  {
    id: 'halcyon',
    title: 'Halcyon',
    date: '2024',
    tags: ['Interaction', '3D'],
    mediaUrl: undefined,
    fallbackImageUrl: '/works/halcyon.svg',
    detailUrl: '#halcyon',
    accent: '#5cd2ff',
  },
  {
    id: 'tessellate',
    title: 'Tessellate',
    date: '2022',
    tags: ['Generative', 'Data'],
    mediaUrl: undefined,
    fallbackImageUrl: '/works/tessellate.svg',
    detailUrl: '#tessellate',
    accent: '#4fe0b0',
  },
  {
    id: 'umbra',
    title: 'Umbra',
    date: '2024',
    tags: ['AR', 'Spatial'],
    mediaUrl: undefined,
    fallbackImageUrl: '/works/umbra.svg',
    detailUrl: '#umbra',
    accent: '#c88bff',
  },
]

/** Distance between consecutive planes along the z-axis (default; Leva can override). */
export const DEFAULT_PLANE_SPACING = 8

/** Plane count on mobile is reduced for performance. */
export const MOBILE_PLANE_COUNT = 4
