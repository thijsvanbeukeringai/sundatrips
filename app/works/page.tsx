import type { Metadata } from 'next'
import WorksShowcase from '@/components/works/WorksShowcase'

export const metadata: Metadata = {
  title: 'Works — Sunda',
  description:
    'A 3D showcase of selected works. Scroll to fly through the projects floating in space.',
  robots: { index: true, follow: true },
}

export default function WorksPage() {
  return <WorksShowcase />
}
