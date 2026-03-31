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
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const properties = (data ?? []) as Property[]

  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <FeaturedProperties properties={properties} />
      <TrustSection />
      <OwnerCTA />
      <ContactSection />
      <Footer />
    </main>
  )
}
