import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Bed, Compass, Activity, Car, MapPin, ArrowLeft,
  CreditCard, LayoutList, Mail, Phone, ExternalLink,
} from 'lucide-react'
import PaymentMethodControl   from '@/components/dashboard/admin/PaymentMethodControl'
import ListingTypeControl     from '@/components/dashboard/admin/ListingTypeControl'
import StripeSettingsForm     from '@/components/dashboard/admin/StripeSettingsForm'

// ─── helpers ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  stay:     'bg-blue-50 text-blue-700',
  trip:     'bg-jungle-50 text-jungle-700',
  activity: 'bg-sunset-50 text-sunset-600',
  transfer: 'bg-gray-100 text-gray-600',
}
const TYPE_ICONS: Record<string, React.ReactNode> = {
  stay:     <Bed className="w-3 h-3" />,
  trip:     <Compass className="w-3 h-3" />,
  activity: <Activity className="w-3 h-3" />,
  transfer: <Car className="w-3 h-3" />,
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function AdminOwnersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const currentUserId = user.id

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (me?.role !== 'admin') redirect('/dashboard')

  const [{ data: owners }, { data: properties }] = await Promise.all([
    supabase
      .from('profiles')
      .select(`
        id, full_name, email, phone, role,
        allowed_payment_methods, allowed_listing_types,
        stripe_account_id, stripe_onboarding_done, stripe_charges_enabled,
        created_at
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('properties')
      .select('id, name, type, island, location, is_active, owner_id')
      .order('created_at', { ascending: false }),
  ])

  const allProfiles = (owners ?? []).sort((a, b) => {
    if (a.id === currentUserId) return -1
    if (b.id === currentUserId) return 1
    return 0
  })
  const allProperties = properties ?? []

  return (
    <div className="p-6 sm:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold text-jungle-800">Owner Management</h1>
          <p className="text-gray-400 text-sm mt-1">{allProfiles.length} account{allProfiles.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="space-y-6">
        {allProfiles.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
            No accounts yet.
          </div>
        )}

        {allProfiles.map(owner => {
          const listings   = allProperties.filter(p => p.owner_id === owner.id)
          const allowed    = (owner.allowed_listing_types as string[]) ?? ['stay', 'trip', 'activity', 'transfer']
          const payMethod  = (owner.allowed_payment_methods ?? 'all') as 'all' | 'cash_only' | 'online_only'
          const isYou      = owner.id === currentUserId

          return (
            <div
              key={owner.id}
              className={`bg-white rounded-2xl overflow-hidden border ${
                isYou ? 'border-jungle-200 ring-1 ring-jungle-100' : 'border-gray-100'
              }`}
            >

              {/* ── Identity header ────────────────────────────────── */}
              <div className="px-6 py-5 flex items-start gap-4 border-b border-gray-50">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold ${
                  isYou ? 'bg-jungle-100 text-jungle-700' : 'bg-sunset-100 text-sunset-600'
                }`}>
                  {(owner.full_name || owner.email).charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-gray-900">{owner.full_name || '—'}</p>
                    {isYou && (
                      <span className="text-[10px] font-bold bg-jungle-100 text-jungle-700 px-2 py-0.5 rounded-full">You</span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      owner.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {owner.role}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />{owner.email}
                    </span>
                    {owner.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />{owner.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Listing count badge */}
                <div className="flex-shrink-0 text-right">
                  <p className="font-display text-2xl font-bold text-jungle-800">{listings.length}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">listing{listings.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* ── Platform access ────────────────────────────────── */}
              <div className="px-6 py-4 border-b border-gray-50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                  <LayoutList className="w-3 h-3" /> Platform Access
                </p>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-[11px] text-gray-500 mb-2">Allowed listing types</p>
                    <ListingTypeControl ownerId={owner.id} current={allowed} />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 mb-2">Payment methods</p>
                    <PaymentMethodControl ownerId={owner.id} current={payMethod} />
                  </div>
                </div>
              </div>

              {/* ── Stripe payout setup ───────────────────────────── */}
              <div className="px-6 py-4 border-b border-gray-50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" /> Stripe Payout
                </p>
                <StripeSettingsForm
                  ownerId={owner.id}
                  stripeAccountId={owner.stripe_account_id ?? null}
                  onboardingDone={owner.stripe_onboarding_done ?? false}
                  chargesEnabled={owner.stripe_charges_enabled ?? false}
                />
              </div>

              {/* ── Listings ──────────────────────────────────────── */}
              <div className="px-6 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Listings
                </p>
                {listings.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No listings yet</p>
                ) : (
                  <div className="space-y-2">
                    {listings.map(p => (
                      <div key={p.id} className="flex items-center gap-3 py-2 rounded-xl hover:bg-gray-50 px-2 -mx-2 transition-colors">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLORS[p.type]}`}>
                          {TYPE_ICONS[p.type]}
                          {p.type}
                        </span>
                        <p className="text-sm font-medium text-gray-800 flex-1 min-w-0 truncate">{p.name}</p>
                        <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                          <MapPin className="w-3 h-3" />{p.island}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {p.is_active ? 'Active' : 'Hidden'}
                        </span>
                        <Link
                          href={`/listings/${p.id}`}
                          target="_blank"
                          className="text-gray-300 hover:text-jungle-600 transition-colors flex-shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}
