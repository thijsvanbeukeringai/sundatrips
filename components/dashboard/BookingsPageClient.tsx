'use client'

import Link from 'next/link'
import { CalendarDays, Plus, ShoppingBag } from 'lucide-react'
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
  extras_amount: number
  extras_paid: boolean
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
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-jungle-800 truncate">{bp.title}</h1>
          <p className="text-gray-400 text-sm mt-1">{counts.all ?? 0} {bp.totalLabel}</p>
        </div>
        <Link
          href="/dashboard/bookings/new"
          className="flex-shrink-0 flex items-center gap-2 bg-jungle-800 hover:bg-jungle-900 text-white font-semibold px-4 py-2.5 rounded-xl transition-all text-sm hover:shadow-lg hover:shadow-jungle-800/25"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{bp.newBooking}</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Filters */}
      <BookingStatusFilter counts={counts} current={currentStatus} q={q} />

      {/* List */}
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
          <>
            {/* ── Mobile compact list (< md) — one tight row per booking ── */}
            <div className="md:hidden divide-y divide-gray-50">
              {bookings.map((b) => (
                <Link
                  key={b.id}
                  href={b.status === 'checked_in' ? `/dashboard/pos?booking=${b.id}` : `/dashboard/bookings/${b.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  {/* Status dot */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    b.status === 'checked_in' ? 'bg-jungle-500' :
                    b.status === 'confirmed'  ? 'bg-blue-400' :
                    b.status === 'pending'    ? 'bg-yellow-400' :
                    b.status === 'completed'  ? 'bg-gray-300' : 'bg-red-400'
                  }`} />

                  {/* Name + property + date */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{b.guest_name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {b.property?.name ?? '—'} · {formatDate(b.check_in)}
                    </p>
                  </div>

                  {/* Right: amount + badge */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-semibold text-jungle-700">{formatPriceRaw(b.net_payout, lang)}</p>
                    {b.extras_amount > 0 && !b.extras_paid && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                        <ShoppingBag className="w-2.5 h-2.5" />
                        bill
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* ── Desktop table (≥ md) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-widest text-gray-400 border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 font-semibold">{bp.guest}</th>
                    <th className="text-left px-5 py-3 font-semibold">{bp.property}</th>
                    <th className="text-left px-5 py-3 font-semibold">{bp.checkIn}</th>
                    <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">{bp.guests}</th>
                    <th className="text-right px-5 py-3 font-semibold">Total</th>
                    <th className="text-right px-5 py-3 font-semibold">{bp.yourCut}</th>
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
                      <td className="px-5 py-3.5 text-gray-500 text-xs hidden lg:table-cell">{b.guests_count}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-800">{formatPriceRaw(b.total_amount, lang)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-jungle-700">{formatPriceRaw(b.net_payout, lang)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold capitalize whitespace-nowrap ${STATUS_STYLE[b.status]}`}>
                            {b.status.replace('_', ' ')}
                          </span>
                          {b.extras_amount > 0 && !b.extras_paid && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 whitespace-nowrap">
                              <ShoppingBag className="w-2.5 h-2.5" />
                              Open bill
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {b.status === 'checked_in' && (
                            <Link
                              href={`/dashboard/pos?booking=${b.id}`}
                              className="flex items-center gap-1.5 text-xs bg-jungle-800 hover:bg-jungle-900 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                            >
                              <ShoppingBag className="w-3 h-3" />
                              Open bill
                            </Link>
                          )}
                          <Link
                            href={`/dashboard/bookings/${b.id}`}
                            className="text-xs text-jungle-700 hover:text-jungle-900 font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {bp.view}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
