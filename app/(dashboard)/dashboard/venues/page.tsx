import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, MapPin, Plus, Pencil } from 'lucide-react'

export default async function VenuesPage() {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Fetch all three in parallel; filter venues client-side based on role
  const [{ data: profile }, { data: allVenues }, { data: properties }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('venues').select('*').order('created_at', { ascending: false }),
    supabase.from('properties').select('id, venue_id, is_active, type'),
  ])

  const venues = profile?.role === 'admin'
    ? allVenues
    : (allVenues ?? []).filter((v: { owner_id: string }) => v.owner_id === user.id)

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-jungle-800">Companies</h1>
          <p className="text-gray-400 text-sm mt-1">
            {(venues ?? []).length} {(venues ?? []).length !== 1 ? 'companies' : 'company'}
          </p>
        </div>
        {profile?.role === 'admin' && (
          <Link
            href="/admin/companies/new"
            className="flex items-center gap-2 bg-jungle-800 hover:bg-jungle-900 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-jungle-800/25 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Company
          </Link>
        )}
      </div>

      {/* Empty state */}
      {(!venues || venues.length === 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">No companies yet</p>
          <p className="text-gray-400 text-sm mt-1">
            {profile?.role === 'admin'
              ? 'Create a company from the admin panel to group listings.'
              : 'Your admin will create a company for your listings.'}
          </p>
        </div>
      )}

      {/* Venue list */}
      {venues && venues.length > 0 && (
        <div className="space-y-4">
          {venues.map(venue => {
            const venueProps = (properties ?? []).filter(p => p.venue_id === venue.id)
            const activeCount = venueProps.filter(p => p.is_active).length
            const typeCounts = venueProps.reduce<Record<string, number>>((acc, p) => {
              acc[p.type] = (acc[p.type] ?? 0) + 1
              return acc
            }, {})

            return (
              <Link
                key={venue.id}
                href={`/dashboard/venues/${venue.id}`}
                className="block bg-white rounded-2xl border border-gray-100 hover:border-jungle-200 hover:shadow-md transition-all overflow-hidden group"
              >
                <div className="p-5 flex items-start gap-4">
                  {/* Cover image or icon */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-jungle-50 flex items-center justify-center">
                    {venue.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={venue.images[0]} alt={venue.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-7 h-7 text-jungle-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="font-semibold text-gray-900 group-hover:text-jungle-800 transition-colors">{venue.name}</h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        venue.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {venue.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    <p className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                      <MapPin className="w-3 h-3" />
                      {venue.location || '—'} · {venue.island}
                    </p>
                    {venueProps.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(typeCounts).map(([type, count]) => (
                          <span key={type} className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                            {count} {type}{count !== 1 ? 's' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex-shrink-0 text-right">
                    <p className="font-display font-bold text-2xl text-jungle-800">{venueProps.length}</p>
                    <p className="text-xs text-gray-400">{activeCount} active</p>
                    <Pencil className="w-3.5 h-3.5 text-gray-300 group-hover:text-jungle-500 transition-colors mt-2 ml-auto" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
