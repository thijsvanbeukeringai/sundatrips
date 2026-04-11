import { createClient, getCachedUser } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Property, ListingVariant, Room } from '@/lib/types'
import RoomManager from '@/components/dashboard/RoomManager'

export default async function PropertyRoomsPage({ params }: { params: { id: string } }) {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [{ data: property }, { data: variants }, { data: rooms }] = await Promise.all([
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
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('rooms')
      .select('*')
      .eq('property_id', params.id)
      .eq('owner_id', user.id)
      .order('sort_order')
      .order('room_number'),
  ])

  if (!property) notFound()

  const p = property as Property

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <Link
        href="/dashboard/properties"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to properties
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-jungle-800">Rooms</h1>
        <p className="text-gray-400 text-sm mt-1">{p.name}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <RoomManager
          propertyId={p.id}
          initialRooms={(rooms ?? []) as Room[]}
          variants={(variants ?? []) as ListingVariant[]}
        />
      </div>

      {/* Nav links */}
      <div className="mt-4 flex gap-3 text-sm flex-wrap">
        <Link href={`/dashboard/properties/${p.id}/variants`} className="text-gray-500 hover:text-gray-800 transition-colors">
          ← Room types
        </Link>
        <span className="text-gray-200">|</span>
        <Link href={`/dashboard/properties/${p.id}/availability`} className="text-gray-500 hover:text-gray-800 transition-colors">
          Availability →
        </Link>
      </div>
    </div>
  )
}
