import { getCachedProfile } from '@/lib/supabase/server'
import { getPartnerBookings } from '@/app/actions/partner'
import Link from 'next/link'
import { CalendarDays, Clock, Users, ChevronRight, TrendingUp } from 'lucide-react'
import type { Profile } from '@/lib/types'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  confirmed:  'bg-jungle-50 text-jungle-700 border-jungle-200',
  checked_in: 'bg-blue-50 text-blue-700 border-blue-200',
  completed:  'bg-gray-50 text-gray-500 border-gray-200',
  cancelled:  'bg-red-50 text-red-600 border-red-200',
}

export default async function PortalHomePage() {
  const [profile, bookings] = await Promise.all([
    getCachedProfile() as Promise<Profile>,
    getPartnerBookings('upcoming'),
  ])

  const today = new Date().toISOString().split('T')[0]
  const todayBookings    = bookings.filter(b => b.check_in === today)
  const upcomingBookings = bookings.filter(b => b.check_in > today).slice(0, 10)

  // Stats: this month
  const thisMonth = new Date().toISOString().slice(0, 7)
  const allThisMonth = bookings.filter(b => b.check_in.startsWith(thisMonth))
  const revenueMonth = allThisMonth.reduce((s, b) => s + (b.base_amount ?? 0), 0)

  const firstName = profile.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-8">

      {/* Greeting */}
      <div>
        <p className="text-gray-400 text-sm">{greeting()},</p>
        <h1 className="font-display text-2xl font-bold text-gray-900">{firstName} 👋</h1>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1">This month</p>
          <p className="font-display text-xl font-bold text-jungle-800">{allThisMonth.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">bookings</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <TrendingUp className="w-4 h-4 text-jungle-400 mb-1" />
          <p className="font-display text-xl font-bold text-jungle-800">
            €{revenueMonth.toLocaleString('en-EU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">revenue</p>
        </div>
      </div>

      {/* Today */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-4 h-4 text-jungle-600" />
          <h2 className="font-semibold text-gray-900">Today</h2>
          <span className="text-xs text-gray-400">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</span>
        </div>

        {todayBookings.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-6 text-center">
            <p className="text-gray-400 text-sm">No bookings today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayBookings.map(b => (
              <Link
                key={b.id}
                href={`/portal/bookings/${b.id}`}
                className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-4 py-3.5 hover:border-jungle-200 hover:bg-jungle-50/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {(b as any).property?.name ?? 'Service'}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {b.guest_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {b.guests_count} {b.guests_count === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[b.status]}`}>
                    {b.status.replace('_', ' ')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      {upcomingBookings.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Coming up</h2>
          </div>

          <div className="space-y-2">
            {upcomingBookings.map(b => (
              <Link
                key={b.id}
                href={`/portal/bookings/${b.id}`}
                className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-4 py-3.5 hover:border-jungle-200 hover:bg-jungle-50/30 transition-colors"
              >
                <div className="w-12 text-center flex-shrink-0">
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                    {new Date(b.check_in).toLocaleDateString('en-GB', { month: 'short' })}
                  </p>
                  <p className="font-display text-xl font-bold text-jungle-800 leading-none">
                    {new Date(b.check_in).getDate()}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {(b as any).property?.name ?? 'Service'}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {b.guest_name} · {b.guests_count} {b.guests_count === 1 ? 'person' : 'people'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>

          <Link
            href="/portal/bookings"
            className="flex items-center justify-center gap-1 mt-3 text-xs text-jungle-700 font-medium hover:underline"
          >
            View all bookings <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-10 text-center">
          <CalendarDays className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">No upcoming bookings</p>
          <p className="text-sm text-gray-400 mt-1">New bookings will appear here</p>
          <Link
            href="/portal/bookings/new"
            className="inline-flex items-center gap-2 mt-4 bg-jungle-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-jungle-900 transition-colors"
          >
            Create booking
          </Link>
        </div>
      )}
    </div>
  )
}
