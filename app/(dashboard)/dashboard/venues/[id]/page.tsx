import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, MapPin, Pencil, Bed, Compass, Activity, Car, Plus } from 'lucide-react'
import AssignPropertyPanel from '@/components/admin/AssignPropertyPanel'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  stay:     <Bed className="w-3.5 h-3.5" />,
  trip:     <Compass className="w-3.5 h-3.5" />,
  activity: <Activity className="w-3.5 h-3.5" />,
  transfer: <Car className="w-3.5 h-3.5" />,
}
const TYPE_COLORS: Record<string, string> = {
  stay:     'bg-blue-50 text-blue-700',
  trip:     'bg-jungle-50 text-jungle-700',
  activity: 'bg-sunset-50 text-sunset-600',
  transfer: 'bg-gray-100 text-gray-700',
}

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  // Fetch venue (owners can only see their own)
  let venueQuery = supabase.from('venues').select('*').eq('id', id)
  if (profile?.role !== 'admin') venueQuery = venueQuery.eq('owner_id', user.id)
  const { data: venue } = await venueQuery.single()
  if (!venue) notFound()

  // Properties in this venue
  const { data: venueProperties } = await supabase
    .from('properties')
    .select('id, name, type, location, island, is_active, price_per_unit, price_unit, images')
    .eq('venue_id', id)
    .order('name')

  // Unlinked properties: for admins show ALL unlinked, for owners show only their own
  let unlinkedQuery = supabase
    .from('properties')
    .select('id, name, type, location, is_active, owner_id')
    .is('venue_id', null)
    .order('name')
  if (profile?.role !== 'admin') unlinkedQuery = unlinkedQuery.eq('owner_id', user.id)
  const { data: unlinkedProperties } = await unlinkedQuery

  const editHref = profile?.role === 'admin' ? `/admin/companies/${id}` : null

  return (
    <div className="p-6 sm:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <Link href="/dashboard/venues" className="mt-1 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-jungle-800">{venue.name}</h1>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
              venue.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {venue.is_active ? 'Active' : 'Hidden'}
            </span>
          </div>
          <p className="flex items-center gap-1 text-sm text-gray-400 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            {venue.location || '—'} · {venue.island}
          </p>
          {venue.description && (
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{venue.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(venue.allowed_types as string[]).map((t: string) => (
              <span key={t} className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{t}</span>
            ))}
          </div>
        </div>
        {editHref && (
          <Link href={editHref} className="flex items-center gap-1.5 text-xs font-semibold text-jungle-700 hover:text-jungle-900 hover:bg-jungle-50 px-3 py-2 rounded-xl transition-colors flex-shrink-0">
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Link>
        )}
      </div>

      {/* Listings in this company */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Listings ({(venueProperties ?? []).length})</h2>
          <Link
            href={`/dashboard/properties/new?venue_id=${id}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-jungle-700 hover:text-jungle-900 hover:bg-jungle-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New listing
          </Link>
        </div>

        {(!venueProperties || venueProperties.length === 0) ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center">
            <Building2 className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No listings in this company yet.</p>
            <Link
              href={`/dashboard/properties/new?venue_id=${id}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-jungle-700 hover:text-jungle-900 mt-3"
            >
              <Plus className="w-4 h-4" />
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {venueProperties.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-4 flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Building2 className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[p.type]}`}>
                        {TYPE_ICONS[p.type]}
                        {p.type}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.location}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {p.is_active ? 'Active' : 'Hidden'}
                    </span>
                    <Link
                      href={`/dashboard/properties/${p.id}/edit`}
                      className="p-2 text-gray-400 hover:text-jungle-700 hover:bg-jungle-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <AssignPropertyPanel propertyId={p.id} venueId={null} label="Remove" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unlinked properties that could be added */}
      {unlinkedProperties && unlinkedProperties.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-800 mb-1">Add Existing Listings</h2>
          <p className="text-xs text-gray-400 mb-4">These listings aren't linked to any company yet.</p>
          <div className="space-y-2">
            {unlinkedProperties.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLORS[p.type]}`}>
                  {TYPE_ICONS[p.type]}
                  {p.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.location}</p>
                </div>
                <AssignPropertyPanel propertyId={p.id} venueId={id} label="Add to company" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
