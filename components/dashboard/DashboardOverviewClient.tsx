'use client'

import { TrendingUp, CalendarDays, ShoppingBag, Banknote, ArrowUpRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'

interface RecentBooking {
  id: string
  guest_name: string
  guest_email: string
  check_in: string
  total_amount: number
  net_payout: number
  status: string
  property: { name: string; type: string } | null
}

interface Props {
  profileName: string
  todayCount: number
  revenueToday: number
  activeCount: number
  posToday: number
  revenueMonth: number
  netMonth: number
  recentBookings: RecentBooking[]
}

const STATUS_STYLE: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  checked_in: 'bg-jungle-100 text-jungle-800',
  completed:  'bg-gray-100 text-gray-600',
  cancelled:  'bg-red-100 text-red-600',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getGreeting(t: { morning: string; afternoon: string; evening: string }) {
  const h = new Date().getHours()
  if (h < 12) return t.morning
  if (h < 17) return t.afternoon
  return t.evening
}

export default function DashboardOverviewClient({
  profileName,
  todayCount,
  revenueToday,
  activeCount,
  posToday,
  revenueMonth,
  netMonth,
  recentBookings,
}: Props) {
  const { t, lang } = useI18n()
  const op = t.dashboard.overview_page
  const gr = t.dashboard.greeting

  const stats = [
    {
      label: op.todayBookings,
      value: String(todayCount),
      sub: formatPriceRaw(revenueToday, lang),
      icon: CalendarDays,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: op.activeStays,
      value: String(activeCount),
      sub: op.activeStaysSub,
      icon: Clock,
      color: 'bg-jungle-50 text-jungle-700',
    },
    {
      label: op.posToday,
      value: formatPriceRaw(posToday, lang),
      sub: op.posToday_sub,
      icon: ShoppingBag,
      color: 'bg-sunset-50 text-sunset-600',
    },
    {
      label: op.monthPayout,
      value: formatPriceRaw(netMonth, lang),
      sub: `${formatPriceRaw(revenueMonth, lang)} ${op.grossDeducted}`,
      icon: Banknote,
      color: 'bg-amber-50 text-amber-600',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-jungle-800">
            {getGreeting(gr)}, {profileName} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link
          href="/dashboard/bookings/new"
          className="inline-flex items-center gap-2 bg-sunset-500 hover:bg-sunset-600 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-all hover:shadow-lg hover:shadow-sunset-500/25"
        >
          {op.newBooking}
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <TrendingUp className="w-4 h-4 text-gray-300" />
              </div>
              <p className="font-display text-2xl font-bold text-gray-900 mt-3">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              <p className="text-[11px] text-gray-300 mt-1">{s.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-800">{op.recentBookings}</h2>
          <Link href="/dashboard/bookings" className="text-sm text-jungle-700 hover:text-jungle-900 flex items-center gap-1">
            {op.viewAll} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{op.noBookings}</p>
            <Link href="/dashboard/bookings/new" className="text-jungle-700 text-sm underline mt-1 inline-block">
              {op.createFirst}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-widest text-gray-400 border-b border-gray-50">
                  <th className="text-left px-6 py-3 font-semibold">{t.dashboard.bookings_page.guest}</th>
                  <th className="text-left px-6 py-3 font-semibold">{t.dashboard.bookings_page.property}</th>
                  <th className="text-left px-6 py-3 font-semibold">{t.dashboard.bookings_page.checkIn}</th>
                  <th className="text-right px-6 py-3 font-semibold">Total</th>
                  <th className="text-right px-6 py-3 font-semibold">{t.dashboard.bookings_page.yourCut}</th>
                  <th className="text-left px-6 py-3 font-semibold">{t.dashboard.bookings_page.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-gray-800">{b.guest_name}</p>
                      <p className="text-gray-400 text-xs">{b.guest_email}</p>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">{b.property?.name ?? '—'}</td>
                    <td className="px-6 py-3.5 text-gray-600">{formatDate(b.check_in)}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-gray-800">
                      {formatPriceRaw(b.total_amount, lang)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-jungle-700">
                      {formatPriceRaw(b.net_payout, lang)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${STATUS_STYLE[b.status] ?? ''}`}>
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

      {/* Financial snapshot */}
      <div className="bg-jungle-800 rounded-2xl p-6 text-white">
        <h2 className="font-semibold mb-4 text-white/80 text-sm uppercase tracking-widest">
          {op.thisMonth}
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: op.grossRevenue,  value: formatPriceRaw(revenueMonth, lang), dim: false },
            { label: op.platformFee,   value: formatPriceRaw(revenueMonth * 0.01, lang), dim: true },
            { label: op.netPayout,     value: formatPriceRaw(netMonth, lang), dim: false, highlight: true },
          ].map((item) => (
            <div key={item.label}>
              <p className={`text-xs uppercase tracking-widest mb-1 ${item.dim ? 'text-white/40' : 'text-white/60'}`}>
                {item.label}
              </p>
              <p className={`font-display text-2xl font-bold ${item.highlight ? 'text-sunset-400' : 'text-white'}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
