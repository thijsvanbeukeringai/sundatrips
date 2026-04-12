export const revalidate = 60

import nextDynamic from 'next/dynamic'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import { createClient } from '@/lib/supabase/server'
import type { Property } from '@/lib/types'

const FeaturedProperties = nextDynamic(() => import('@/components/FeaturedProperties'))
const TrustSection       = nextDynamic(() => import('@/components/TrustSection'))
const OwnerCTA           = nextDynamic(() => import('@/components/OwnerCTA'))
const ContactSection     = nextDynamic(() => import('@/components/ContactSection'), { ssr: false })
const Footer             = nextDynamic(() => import('@/components/Footer'))

export default async function Home() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('properties')
    .select('*, owner:profiles!owner_id(company_name, company_logo, company_location, company_island, languages)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // For transfers: show one card per owner (the one with the lowest price)
  // This prevents 100 separate routes from cluttering the homepage
  const all = (data ?? []) as Property[]
  const nonTransfers = all.filter(p => p.type !== 'transfer')
  const transfers = all.filter(p => p.type === 'transfer')
  const transferByOwner = new Map<string, Property>()
  for (const t of transfers) {
    const existing = transferByOwner.get(t.owner_id)
    if (!existing || t.price_per_unit < existing.price_per_unit) {
      transferByOwner.set(t.owner_id, t)
    }
  }
  const properties = [...nonTransfers, ...transferByOwner.values()]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <Navbar transparent />
      <Hero />
      <FeaturedProperties properties={properties} />
      <TrustSection />
      <OwnerCTA />
      <ContactSection />
      <Footer />
    </main>
  )
}
