'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { getPartnerBookings } from '@/app/actions/partner'
import { ChevronRight, PlusCircle, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

type Filter = 'upcoming' | 'past' | 'all'

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  confirmed:  'bg-jungle-50 text-jungle-700 border-jungle-200',
  checked_in: 'bg-blue-50 text-blue-700 border-blue-200',
  completed:  'bg-gray-50 text-gray-500 border-gray-200',
  cancelled:  'bg-red-50 text-red-600 border-red-200',
}

export default function PartnerBookingsPage() {
  const { t, lang } = useI18n()
  const [filter, setFilter]     = useState<Filter>('upcoming')
  const [bookings, setBookings] = useState<Awaited<ReturnType<typeof getPartnerBookings>>>([])
  const [isPending, startFetch] = useTransition()

  useEffect(() => {
    startFetch(async () => {
      const data = await getPartnerBookings(filter)
      setBookings(data)
    })
  }, [filter])

  const locale = lang === 'id' ? 'id-ID' : 'en-GB'
  const filterLabels: Record<Filter, string> = {
    upcoming: t.portal.bookings.upcoming,
    past:     t.portal.bookings.past,
    all:      t.portal.bookings.all,
  }
  const statusLabel = (status: string) =>
    t.myBookings.statuses[status as keyof typeof t.myBookings.statuses] ?? status.replace('_', ' ')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900">{t.portal.bookings.title}</h1>
        <Link
          href="/portal/bookings/new"
          className="flex items-center gap-1.5 bg-jungle-800 text-white text-sm font-semibold px-3.5 py-2 rounded-xl hover:bg-jungle-900 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          {t.portal.bookings.new}
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {(['upcoming', 'past', 'all'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 text-sm font-semibold py-1.5 rounded-lg transition-colors ${
              filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
        </div>
      )}

      {/* Empty */}
      {!isPending && bookings.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          {t.portal.bookings.noBookings}
        </div>
      )}

      {/* List */}
      {!isPending && (
        <div className="space-y-2">
          {bookings.map(b => (
            <Link
              key={b.id}
              href={`/portal/bookings/${b.id}`}
              className="flex items-center gap-3 sm:gap-4 bg-white border border-gray-100 rounded-2xl px-3 sm:px-4 py-3 sm:py-3.5 hover:border-jungle-200 hover:bg-jungle-50/30 transition-colors"
            >
              {/* Date block */}
              <div className="w-12 text-center flex-shrink-0">
                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                  {new Date(b.check_in).toLocaleDateString(locale, { month: 'short' })}
                </p>
                <p className="font-display text-xl font-bold text-jungle-800 leading-none">
                  {new Date(b.check_in).getDate()}
                </p>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                  {b.guest_name}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {(b as any).property?.name ?? t.portal.bookingDetail.service}
                  {(b as any).variant?.name ? ` · ${(b as any).variant.name}` : ''}
                  {' · '}{b.guests_count} {b.guests_count === 1 ? t.portal.bookings.person : t.portal.bookings.people}
                </p>
              </div>

              {/* Status + price */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[b.status]}`}>
                  {statusLabel(b.status)}
                </span>
                <p className="text-xs font-semibold text-gray-700">
                  €{b.base_amount.toLocaleString(locale, { minimumFractionDigits: 0 })}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 hidden sm:block" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
