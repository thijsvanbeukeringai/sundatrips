import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Users, Building2, CalendarDays, DollarSign,
  TrendingUp, CheckCircle, Clock, XCircle, UserPlus, Bed, Compass, Activity,
} from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const currentUserId = user.id

  // Parallel data fetch
  const [
    { data: profiles },
    { data: properties },
    { data: bookings },
    { data: invites },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }),
    supabase.from('properties').select('id, name, type, island, location, is_active, owner_id, price_per_unit, price_unit, created_at').order('created_at', { ascending: false }),
    supabase.from('bookings').select('id, guest_name, total_amount, net_payout, platform_fee, status, check_in, created_at, owner_id').order('created_at', { ascending: false }).limit(50),
    supabase.from('invites').select('id, email, property_name, accepted_at, expires_at, created_at').order('created_at', { ascending: false }).limit(20),
  ])

  // Show everyone with listings + all owners; admins who created listings count too
  const allUsers      = (profiles ?? [])
  const owners        = allUsers.filter(p => p.role === 'owner')
  const admins        = allUsers.filter(p => p.role === 'admin')
  const activeProps   = (properties ?? []).filter(p => p.is_active)
  const totalRevenue  = (bookings ?? []).reduce((s, b) => s + (b.total_amount ?? 0), 0)
  const totalFees     = (bookings ?? []).reduce((s, b) => s + (b.platform_fee ?? 0), 0)
  const pendingInvites = (invites ?? []).filter(i => !i.accepted_at && new Date(i.expires_at) > new Date())

  const statusCounts = (bookings ?? []).reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1
    return acc
  }, {})

  const TYPE_ICONS: Record<string, React.ReactNode> = {
    stay:     <Bed className="w-3.5 h-3.5" />,
    trip:     <Compass className="w-3.5 h-3.5" />,
    activity: <Activity className="w-3.5 h-3.5" />,
  }
  const TYPE_COLORS: Record<string, string> = {
    stay:     'bg-blue-50 text-blue-700',
    trip:     'bg-jungle-50 text-jungle-700',
    activity: 'bg-sunset-50 text-sunset-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-jungle-900 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display font-bold text-white text-lg">Admin Overview</h1>
      </header>

      <div className="max-w-6xl mx-auto p-6 sm:p-8 space-y-8">

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Users',       value: allUsers.length,       icon: Users,        color: 'text-jungle-700', bg: 'bg-jungle-50' },
            { label: 'Active Listings',  value: activeProps.length,    icon: Building2,    color: 'text-blue-700',   bg: 'bg-blue-50' },
            { label: 'Total Bookings',   value: (bookings ?? []).length, icon: CalendarDays, color: 'text-amber-700',  bg: 'bg-amber-50' },
            { label: 'Platform Fees',    value: `€${totalFees.toFixed(0)}`, icon: TrendingUp, color: 'text-sunset-600', bg: 'bg-sunset-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Booking status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Booking Status Breakdown</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5">
                {status === 'confirmed' && <CheckCircle className="w-4 h-4 text-blue-500" />}
                {status === 'checked_in' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {status === 'pending' && <Clock className="w-4 h-4 text-amber-500" />}
                {status === 'completed' && <CheckCircle className="w-4 h-4 text-gray-400" />}
                {status === 'cancelled' && <XCircle className="w-4 h-4 text-red-400" />}
                <span className="text-sm font-medium text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
            {Object.keys(statusCounts).length === 0 && (
              <p className="text-sm text-gray-400">No bookings yet.</p>
            )}
          </div>
        </div>

        {/* Revenue summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Revenue Summary (all time)</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Gross Revenue</p>
              <p className="font-display text-2xl font-bold text-gray-900">€{totalRevenue.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Platform Fees (1%)</p>
              <p className="font-display text-2xl font-bold text-jungle-700">€{totalFees.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Owner Payouts (99%)</p>
              <p className="font-display text-2xl font-bold text-gray-700">€{(totalRevenue - totalFees).toFixed(0)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Listing owners — everyone who has listings, plus all owner-role profiles */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">Listing Owners ({allUsers.length})</h2>
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/admin/owners"
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Manage →
                </Link>
                <Link
                  href="/admin/invite"
                  className="flex items-center gap-1.5 text-xs font-semibold text-jungle-700 hover:text-jungle-900 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Invite
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              {allUsers.length === 0 && <p className="text-sm text-gray-400">No users yet.</p>}
              {allUsers.map((o) => {
                const ownerProps = (properties ?? []).filter(p => p.owner_id === o.id)
                const isYou      = o.id === currentUserId
                return (
                  <div key={o.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isYou ? 'bg-jungle-100' : 'bg-sunset-100'}`}>
                      <span className={`text-sm font-bold ${isYou ? 'text-jungle-700' : 'text-sunset-600'}`}>
                        {(o.full_name || o.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">{o.full_name || '—'}</p>
                        {isYou && (
                          <span className="text-[10px] font-bold bg-jungle-100 text-jungle-700 px-1.5 py-0.5 rounded-full flex-shrink-0">You</span>
                        )}
                        {o.role === 'admin' && !isYou && (
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full flex-shrink-0">admin</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{o.email}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {ownerProps.length} listing{ownerProps.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* All listings */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-700 mb-4">All Listings ({(properties ?? []).length})</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(properties ?? []).length === 0 && <p className="text-sm text-gray-400">No listings yet.</p>}
              {(properties ?? []).map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLORS[p.type]}`}>
                    {TYPE_ICONS[p.type]}
                    {p.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.location} · {p.island}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${p.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {p.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Recent Bookings</h2>
          {(bookings ?? []).length === 0 && <p className="text-sm text-gray-400">No bookings yet.</p>}
          {(bookings ?? []).length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-3 font-semibold">Guest</th>
                    <th className="pb-3 font-semibold">Check-in</th>
                    <th className="pb-3 font-semibold">Total</th>
                    <th className="pb-3 font-semibold">Fee</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(bookings ?? []).slice(0, 10).map((b) => (
                    <tr key={b.id}>
                      <td className="py-3 font-medium text-gray-800">{b.guest_name}</td>
                      <td className="py-3 text-gray-500">{new Date(b.check_in).toLocaleDateString('en-GB')}</td>
                      <td className="py-3 font-semibold text-gray-900">€{b.total_amount?.toFixed(0)}</td>
                      <td className="py-3 text-jungle-700 font-semibold">€{b.platform_fee?.toFixed(0)}</td>
                      <td className="py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          b.status === 'confirmed'  ? 'bg-blue-50 text-blue-700' :
                          b.status === 'checked_in' ? 'bg-green-50 text-green-700' :
                          b.status === 'completed'  ? 'bg-gray-100 text-gray-500' :
                          b.status === 'cancelled'  ? 'bg-red-50 text-red-500' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending invites */}
        {pendingInvites.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-700 mb-4">Pending Invites ({pendingInvites.length})</h2>
            <div className="space-y-2">
              {pendingInvites.map((i) => (
                <div key={i.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{i.email}</p>
                    {i.property_name && <p className="text-xs text-gray-400">{i.property_name}</p>}
                  </div>
                  <span className="text-xs text-gray-400">
                    Expires {new Date(i.expires_at).toLocaleDateString('en-GB')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
