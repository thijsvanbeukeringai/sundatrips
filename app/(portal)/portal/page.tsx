'use client'

import { useState, useEffect } from 'react'
import { getPartnerBookings } from '@/app/actions/partner'
import Link from 'next/link'
import { CalendarDays, Clock, Users, ChevronRight, TrendingUp, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  confirmed:  'bg-jungle-50 text-jungle-700 border-jungle-200',
  checked_in: 'bg-blue-50 text-blue-700 border-blue-200',
  completed:  'bg-gray-50 text-gray-500 border-gray-200',
  cancelled:  'bg-red-50 text-red-600 border-red-200',
}

export default function PortalHomePage() {
  const { t, lang } = useI18n()
  const [bookings, setBookings] = useState<any[]>([])
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [bData] = await Promise.all([
        getPartnerBookings('upcoming'),
      ])
      setBookings(bData)

      // Get name from supabase client
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()
        setFirstName(profile?.full_name?.split(' ')[0] ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  function greeting() {
    const h = new Date().getHours()
    if (h < 12) return t.dashboard.greeting.morning
    if (h < 17) return t.dashboard.greeting.afternoon
    return t.dashboard.greeting.evening
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const todayBookings    = bookings.filter(b => b.check_in === today)
  const upcomingBookings = bookings.filter(b => b.check_in > today).slice(0, 10)

  const thisMonth = new Date().toISOString().slice(0, 7)
  const allThisMonth = bookings.filter(b => b.check_in.startsWith(thisMonth))
  const revenueMonth = allThisMonth.reduce((s: number, b: any) => s + (b.base_amount ?? 0), 0)

  const locale = lang === 'id' ? 'id-ID' : 'en-GB'
  const statusLabel = (status: string) =>
    t.myBookings.statuses[status as keyof typeof t.myBookings.statuses] ?? status.replace('_', ' ')

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <p className="text-gray-400 text-sm">{greeting()},</p>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900">{firstName} 👋</h1>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1">{t.portal.home.thisMonth}</p>
          <p className="font-display text-xl font-bold text-jungle-800">{allThisMonth.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t.portal.home.bookings}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <TrendingUp className="w-4 h-4 text-jungle-400 mb-1" />
          <p className="font-display text-xl font-bold text-jungle-800">
            Rp {revenueMonth.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{t.portal.home.revenue}</p>
        </div>
      </div>

      {/* Today */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-4 h-4 text-jungle-600" />
          <h2 className="font-semibold text-gray-900">{t.portal.home.today}</h2>
          <span className="text-xs text-gray-400">{new Date().toLocaleDateString(locale, { day: 'numeric', month: 'long' })}</span>
        </div>

        {todayBookings.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-6 text-center">
            <p className="text-gray-400 text-sm">{t.portal.home.noBookingsToday}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayBookings.map((b: any) => (
              <Link
                key={b.id}
                href={`/portal/bookings/${b.id}`}
                className="flex items-center gap-3 sm:gap-4 bg-white border border-gray-100 rounded-2xl px-3 sm:px-4 py-3 hover:border-jungle-200 hover:bg-jungle-50/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                    {b.property?.name ?? t.portal.bookingDetail.service}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                    <span className="truncate">{b.guest_name}</span>
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <Users className="w-3 h-3" />
                      {b.guests_count} {b.guests_count === 1 ? t.portal.home.person : t.portal.home.people}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[b.status]}`}>
                    {statusLabel(b.status)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 hidden sm:block" />
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
            <h2 className="font-semibold text-gray-900">{t.portal.home.comingUp}</h2>
          </div>

          <div className="space-y-2">
            {upcomingBookings.map((b: any) => (
              <Link
                key={b.id}
                href={`/portal/bookings/${b.id}`}
                className="flex items-center gap-3 sm:gap-4 bg-white border border-gray-100 rounded-2xl px-3 sm:px-4 py-3 hover:border-jungle-200 hover:bg-jungle-50/30 transition-colors"
              >
                <div className="w-12 text-center flex-shrink-0">
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                    {new Date(b.check_in).toLocaleDateString(locale, { month: 'short' })}
                  </p>
                  <p className="font-display text-xl font-bold text-jungle-800 leading-none">
                    {new Date(b.check_in).getDate()}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                    {b.property?.name ?? t.portal.bookingDetail.service}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {b.guest_name} · {b.guests_count} {b.guests_count === 1 ? t.portal.home.person : t.portal.home.people}
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
            {t.portal.home.viewAll} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-10 text-center">
          <CalendarDays className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">{t.portal.home.noUpcoming}</p>
          <p className="text-sm text-gray-400 mt-1">{t.portal.home.noUpcomingSub}</p>
          <Link
            href="/portal/bookings/new"
            className="inline-flex items-center gap-2 mt-4 bg-jungle-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-jungle-900 transition-colors"
          >
            {t.portal.home.createBooking}
          </Link>
        </div>
      )}
    </div>
  )
}
