import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Plus, MapPin, Check, X } from 'lucide-react'
import DeleteVenueButton from '@/components/admin/DeleteVenueButton'

export default async function AdminCompaniesPage() {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [
    { data: venues },
    { data: profiles },
    { data: properties },
  ] = await Promise.all([
    supabase.from('venues').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name, email'),
    supabase.from('properties').select('id, venue_id, is_active'),
  ])

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-jungle-900 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display font-bold text-white text-lg flex-1">Companies</h1>
        <Link
          href="/admin/companies/new"
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </Link>
      </header>

      <div className="max-w-5xl mx-auto p-6 sm:p-8">
        {(!venues || venues.length === 0) ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
            <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">No companies yet</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">Create a company to group properties under an owner.</p>
            <Link
              href="/admin/companies/new"
              className="inline-flex items-center gap-2 bg-jungle-800 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-jungle-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Company
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {venues.map(venue => {
              const owner = profileMap[venue.owner_id]
              const venueProperties = (properties ?? []).filter(p => p.venue_id === venue.id)
              const activeCount = venueProperties.filter(p => p.is_active).length
              return (
                <div key={venue.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-5 flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-jungle-50 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-jungle-700" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-gray-900">{venue.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          venue.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {venue.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      <p className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />
                        {venue.location || '—'} · {venue.island}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Owner: <span className="text-gray-600 font-medium">{owner?.full_name || owner?.email || 'Unknown'}</span>
                        {owner?.email && <span className="text-gray-400"> ({owner.email})</span>}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(venue.allowed_types as string[]).map((t: string) => (
                          <span key={t} className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-shrink-0 text-right">
                      <p className="font-display font-bold text-2xl text-jungle-800">{venueProperties.length}</p>
                      <p className="text-xs text-gray-400">{activeCount} active listings</p>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="border-t border-gray-50 px-4 py-2.5 flex items-center gap-2 bg-gray-50/50">
                    <Link
                      href={`/admin/companies/${venue.id}`}
                      className="text-xs font-semibold text-jungle-700 hover:text-jungle-900 hover:bg-white px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                    >
                      Edit / Manage →
                    </Link>
                    <DeleteVenueButton id={venue.id} name={venue.name} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
