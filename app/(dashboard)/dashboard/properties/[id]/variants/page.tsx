import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Property, ListingVariant } from '@/lib/types'
import VariantManager from '@/components/dashboard/VariantManager'

export default async function VariantsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: property }, { data: variants }] = await Promise.all([
    supabase
      .from('properties')
      .select('*')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single(),
    supabase
      .from('listing_variants')
      .select('*')
      .eq('property_id', params.id)
      .order('sort_order'),
  ])

  if (!property) notFound()

  const p = property as Property
  const variantList = (variants ?? []) as ListingVariant[]

  const TYPE_LABEL: Record<string, string> = {
    stay:     'Room / Unit Types',
    trip:     'Tour Packages',
    activity: 'Ticket Options',
    transfer: 'Routes & Pricing',
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      {/* Back */}
      <Link
        href="/dashboard/properties"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to properties
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-jungle-800">
          {TYPE_LABEL[p.type] ?? 'Variants'}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{p.name}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <VariantManager
          propertyId={p.id}
          propertyType={p.type}
          initialVariants={variantList}
          userId={user.id}
        />
      </div>

      {/* Nav links */}
      <div className="mt-4 flex gap-3 text-sm">
        <Link
          href={`/dashboard/properties/${p.id}/edit`}
          className="text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Edit listing details
        </Link>
        <span className="text-gray-200">|</span>
        <Link
          href={`/dashboard/properties/${p.id}/availability`}
          className="text-gray-500 hover:text-gray-800 transition-colors"
        >
          Availability calendar →
        </Link>
      </div>
    </div>
  )
}
