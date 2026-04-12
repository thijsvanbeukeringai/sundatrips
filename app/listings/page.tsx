import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ListingsGrid from '@/components/ListingsGrid'
import { SlidersHorizontal } from 'lucide-react'
import type { Property } from '@/lib/types'

export const revalidate = 60

// ─── Config ──────────────────────────────────────────────────────────────────

const TYPE_MAP: Record<string, string> = {
  stays:     'stay',
  trips:     'trip',
  activities: 'activity',
  transfers:  'transfer',
}

const TYPE_LABELS: Record<string, string> = {
  all:        'All',
  stays:      'Stays',
  trips:      'Trips',
  activities: 'Activities',
  transfers:  'Transfers',
}

const ISLANDS = ['All Islands', 'Lombok', 'Bali', 'Gili Islands']

// ─── Page ─────────────────────────────────────────────────────────────────────

interface SearchParams {
  type?:   string
  island?: string
  q?:      string
  guests?: string
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()

  const typeParam   = searchParams.type   ?? 'all'
  const islandParam = searchParams.island ?? ''
  const qParam      = (searchParams.q ?? '').trim()
  const guestsParam = parseInt(searchParams.guests ?? '0') || 0

  let query = supabase
    .from('properties')
    .select('*')
    .eq('is_active', true)

  if (typeParam !== 'all' && TYPE_MAP[typeParam]) {
    query = query.eq('type', TYPE_MAP[typeParam])
  }
  if (islandParam && islandParam !== 'All Islands') {
    query = query.eq('island', islandParam)
  }
  if (qParam) {
    query = query.or(`location.ilike.%${qParam}%,name.ilike.%${qParam}%,island.ilike.%${qParam}%`)
  }
  if (guestsParam > 0) {
    query = query.gte('max_capacity', guestsParam)
  }

  const { data } = await query.order('created_at', { ascending: false })

  const all = (data ?? []) as Property[]

  // For transfers: fetch owner profiles to get company data
  const transferOwnerIds = [...new Set(all.filter(p => p.type === 'transfer').map(p => p.owner_id))]
  if (transferOwnerIds.length > 0) {
    const admin = createAdminClient()
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, company_name, company_logo, company_location, company_island, languages')
      .in('id', transferOwnerIds)
    const ownerMap = new Map<string, any>()
    for (const pr of profiles ?? []) ownerMap.set(pr.id, pr)
    for (const p of all) {
      if (p.type === 'transfer' && ownerMap.has(p.owner_id)) {
        ;(p as any).owner = ownerMap.get(p.owner_id)
      }
    }
  }

  // For transfers: show one card per owner (lowest price as "from" price)
  const nonTransfers = all.filter(p => p.type !== 'transfer')
  const transfers = all.filter(p => p.type === 'transfer')
  const transferByOwner = new Map<string, Property>()
  for (const tr of transfers) {
    const existing = transferByOwner.get(tr.owner_id)
    if (!existing || tr.price_per_unit < existing.price_per_unit) {
      transferByOwner.set(tr.owner_id, tr)
    }
  }
  const properties = [...nonTransfers, ...transferByOwner.values()]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const heading = qParam
    ? `Results for "${qParam}"`
    : typeParam !== 'all'
      ? TYPE_LABELS[typeParam] ?? 'Listings'
      : 'All Listings'

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-20">
        {/* Filter bar */}
        <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-2">
            {/* Type tabs */}
            <div className="flex gap-1">
              {Object.keys(TYPE_LABELS).map(t => {
                const params = new URLSearchParams(searchParams as Record<string, string>)
                params.set('type', t)
                return (
                  <Link
                    key={t}
                    href={`/listings?${params}`}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      typeParam === t
                        ? 'bg-jungle-800 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {TYPE_LABELS[t]}
                  </Link>
                )
              })}
            </div>

            <div className="w-px h-4 bg-gray-200 hidden sm:block mx-1" />

            {/* Island filter */}
            <div className="flex gap-1">
              {ISLANDS.map(isle => {
                const params = new URLSearchParams(searchParams as Record<string, string>)
                const v = isle === 'All Islands' ? '' : isle
                params.set('island', v)
                return (
                  <Link
                    key={isle}
                    href={`/listings?${params}`}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      (islandParam || 'All Islands') === isle
                        ? 'bg-sunset-100 text-sunset-700 font-semibold'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {isle === 'All Islands' ? 'All' : isle}
                  </Link>
                )
              })}
            </div>

            <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {properties.length} listing{properties.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-jungle-800 mb-8">{heading}</h1>

          <ListingsGrid properties={properties} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
