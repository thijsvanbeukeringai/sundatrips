import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PartnersPageClient from '@/components/PartnersPageClient'

export const metadata = {
  title: 'Partner with Sunda Trips — Free for Drivers, Guides, Trip Organizers & Hotels',
  description:
    'List your services on Sunda Trips for free. A non-profit platform for Indonesian drivers, activity organizers, trip guides and guesthouse owners.',
}

export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <Navbar solid />
      <PartnersPageClient />
      <Footer />
    </main>
  )
}
