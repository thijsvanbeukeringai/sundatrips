import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, MapPin } from 'lucide-react'
import VenueForm from '@/components/admin/VenueForm'
import AssignPropertyPanel from '@/components/admin/AssignPropertyPanel'

export default async function AdminEditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [
    { data: venue },
    { data: profiles },
    { data: properties },
  ] = await Promise.all([
    supabase.from('venues').select('*').eq('id', id).single(),
    supabase.from('profiles').select('id, full_name, email, role').order('full_name'),
    supabase.from('properties').select('id, name, type, island, location, is_active, venue_id, owner_id').order('name'),
  ])

  if (!venue) notFound()

  const venueProperties = (properties ?? []).filter(p => p.venue_id === id)
  const ownerProperties = (properties ?? []).filter(p => p.owner_id === venue.owner_id && p.venue_id !== id)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-jungle-900 px-6 py-4 flex items-center gap-4">
        <Link href="/admin/companies" className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-white text-lg truncate">{venue.name}</h1>
          <p className="text-white/50 text-xs flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {venue.island}
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6 sm:p-8 space-y-6">
        {/* Edit form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-jungle-50 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-jungle-700" />
            </div>
            <h2 className="font-semibold text-gray-800">Edit Company Details</h2>
          </div>
          <VenueForm venue={venue} profiles={profiles ?? []} />
        </div>

        {/* Properties in this venue */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">
            Listings in this Company ({venueProperties.length})
          </h2>
          {venueProperties.length === 0 ? (
            <p className="text-sm text-gray-400">No listings assigned to this company yet.</p>
          ) : (
            <div className="space-y-2">
              {venueProperties.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{p.type} · {p.location}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {p.is_active ? 'Active' : 'Hidden'}
                  </span>
                  <AssignPropertyPanel propertyId={p.id} venueId={null} label="Remove" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assign unlinked owner properties */}
        {ownerProperties.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-1">Add Existing Listings</h2>
            <p className="text-xs text-gray-400 mb-4">These listings belong to the same owner but are not yet linked to this company.</p>
            <div className="space-y-2">
              {ownerProperties.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{p.type} · {p.location}</p>
                  </div>
                  <AssignPropertyPanel propertyId={p.id} venueId={id} label="Add to company" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
