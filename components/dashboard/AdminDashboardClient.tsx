'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Users, CalendarDays, TrendingUp, Building2,
  CheckCircle, Clock, XCircle, Filter,
} from 'lucide-react'

type AdminUser = {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
  listing_count: number
}

type AdminBooking = {
  id: string
  guest_name: string
  total_amount: number
  platform_fee: number
  status: string
  check_in: string
  property_name: string
  venue_id: string | null
  venue_name: string | null
}

type Venue = { id: string; name: string }

interface Props {
  profiles: AdminUser[]
  bookings: AdminBooking[]
  venues: Venue[]
}

const STATUS_STYLES: Record<string, string> = {
  confirmed:  'bg-blue-50 text-blue-700',
  checked_in: 'bg-green-50 text-green-700',
  completed:  'bg-gray-100 text-gray-500',
  cancelled:  'bg-red-50 text-red-500',
  pending:    'bg-amber-50 text-amber-700',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  confirmed:  <CheckCircle className="w-3 h-3" />,
  checked_in: <CheckCircle className="w-3 h-3" />,
  completed:  <CheckCircle className="w-3 h-3" />,
  cancelled:  <XCircle className="w-3 h-3" />,
  pending:    <Clock className="w-3 h-3" />,
}

export default function AdminDashboardClient({ profiles, bookings, venues }: Props) {
  const [venueFilter, setVenueFilter] = useState('')
  const [dateFrom,    setDateFrom]    = useState('')
  const [dateTo,      setDateTo]      = useState('')

  const owners = profiles.filter(p => p.role === 'owner')
  const admins = profiles.filter(p => p.role === 'admin')

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (venueFilter && b.venue_id !== venueFilter) return false
      if (dateFrom && b.check_in < dateFrom) return false
      if (dateTo   && b.check_in > dateTo)   return false
      return true
    })
  }, [bookings, venueFilter, dateFrom, dateTo])

  const totalRevenue = filteredBookings.reduce((s, b) => s + (b.total_amount ?? 0), 0)
  const totalFees    = filteredBookings.reduce((s, b) => s + (b.platform_fee ?? 0), 0)
  const active       = filteredBookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in').length

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Company Users',   value: owners.length,             icon: Building2,    color: 'text-jungle-700', bg: 'bg-jungle-50' },
          { label: 'Total Bookings',  value: filteredBookings.length,   icon: CalendarDays, color: 'text-blue-700',   bg: 'bg-blue-50' },
          { label: 'Active Now',      value: active,                    icon: Users,        color: 'text-green-700',  bg: 'bg-green-50' },
          { label: 'Platform Fees',   value: `Rp ${Math.round(totalFees).toLocaleString('id-ID')}`, icon: TrendingUp,  color: 'text-sunset-600', bg: 'bg-sunset-50' },
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

      {/* Users grouped */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Company users (owners) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Company Users ({owners.length})</h2>
            <Link href="/admin/users" className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
              Manage →
            </Link>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {owners.length === 0 && <p className="text-sm text-gray-400">No company users yet.</p>}
            {owners.map(u => (
              <div key={u.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-sunset-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-sunset-600">
                    {(u.full_name || u.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{u.full_name || '—'}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {u.listing_count} listing{u.listing_count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin users */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Admin Users ({admins.length})</h2>
          <div className="space-y-2">
            {admins.map(u => (
              <div key={u.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-jungle-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-jungle-700">
                    {(u.full_name || u.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{u.full_name || '—'}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full flex-shrink-0">
                  admin
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bookings with filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <h2 className="font-semibold text-gray-700 flex-1">
            All Bookings
            {(venueFilter || dateFrom || dateTo) && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                {filteredBookings.length} result{filteredBookings.length !== 1 ? 's' : ''}
                {' '}· Rp {Math.round(totalRevenue).toLocaleString('id-ID')} gross
              </span>
            )}
          </h2>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />

            {venues.length > 0 && (
              <select
                value={venueFilter}
                onChange={e => setVenueFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-jungle-500/30 bg-white"
              >
                <option value="">All venues</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            )}

            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-jungle-500/30"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-jungle-500/30"
              placeholder="To"
            />

            {(venueFilter || dateFrom || dateTo) && (
              <button
                onClick={() => { setVenueFilter(''); setDateFrom(''); setDateTo('') }}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {filteredBookings.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center">No bookings match the current filters.</p>
        )}

        {filteredBookings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-3 font-semibold">Guest</th>
                  <th className="pb-3 font-semibold">Check-in</th>
                  <th className="pb-3 font-semibold">Property</th>
                  <th className="pb-3 font-semibold">Venue</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Fee</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBookings.map(b => (
                  <tr key={b.id}>
                    <td className="py-3 font-medium text-gray-800">{b.guest_name}</td>
                    <td className="py-3 text-gray-500">{new Date(b.check_in).toLocaleDateString('en-GB')}</td>
                    <td className="py-3 text-gray-600 truncate max-w-[120px]">{b.property_name}</td>
                    <td className="py-3 text-gray-500 truncate max-w-[100px]">{b.venue_name ?? '—'}</td>
                    <td className="py-3 font-semibold text-gray-900">Rp {Math.round(b.total_amount ?? 0).toLocaleString('id-ID')}</td>
                    <td className="py-3 text-jungle-700 font-semibold">Rp {Math.round(b.platform_fee ?? 0).toLocaleString('id-ID')}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_ICONS[b.status]}
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

    </div>
  )
}
