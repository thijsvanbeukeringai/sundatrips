'use client'

import Link from 'next/link'
import { CalendarDays, Plus } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'
import BookingStatusFilter from './BookingStatusFilter'

const STATUS_STYLE: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  checked_in: 'bg-jungle-100 text-jungle-800',
  completed:  'bg-gray-100 text-gray-600',
  cancelled:  'bg-red-100 text-red-600',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface BookingRow {
  id: string
  guest_name: string
  guest_email: string
  check_in: string
  guests_count: number
  total_amount: number
  net_payout: number
  status: string
  property: { name: string; type: string } | null
}

interface Props {
  bookings: BookingRow[]
  counts: Record<string, number>
  currentStatus: string
  q: string
}

export default function BookingsPageClient({ bookings, counts, currentStatus, q }: Props) {
  const { t, lang } = useI18n()
  const bp = t.dashboard.bookings_page

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-jungle-800">{bp.title}</h1>
          <p className="text-gray-400 text-sm mt-1">{counts.all ?? 0} {bp.total}</p>
        </div>
        <Link
          href="/dashboard/bookings/new"
          className="flex items-center gap-2 bg-jungle-800 hover:bg-jungle-900 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm hover:shadow-lg hover:shadow-jungle-800/25"
        >
          <Plus className="w-4 h-4" />
          {bp.newBooking}
        </Link>
      </div>

      {/* Filters */}
      <BookingStatusFilter counts={counts} current={currentStatus} q={q} />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {bookings.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">{bp.noBookings}</p>
            <Link href="/dashboard/bookings/new" className="text-jungle-700 text-sm underline mt-1 inline-block">
              {bp.createFirst}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-widest text-gray-400 border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 font-semibold">{bp.guest}</th>
                  <th className="text-left px-5 py-3 font-semibold">{bp.property}</th>
                  <th className="text-left px-5 py-3 font-semibold">{bp.checkIn}</th>
                  <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">{bp.guests}</th>
                  <th className="text-right px-5 py-3 font-semibold">Total</th>
                  <th className="text-right px-5 py-3 font-semibold hidden sm:table-cell">{bp.yourCut}</th>
                  <th className="text-left px-5 py-3 font-semibold">{bp.status}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{b.guest_name}</p>
                      <p className="text-xs text-gray-400">{b.guest_email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">{b.property?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs whitespace-nowrap">{formatDate(b.check_in)}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs hidden md:table-cell">{b.guests_count}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-800">{formatPriceRaw(b.total_amount, lang)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-jungle-700 hidden sm:table-cell">{formatPriceRaw(b.net_payout, lang)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold capitalize whitespace-nowrap ${STATUS_STYLE[b.status]}`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/dashboard/bookings/${b.id}`}
                        className="text-xs text-jungle-700 hover:text-jungle-900 font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {bp.view}
                      </Link>
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
