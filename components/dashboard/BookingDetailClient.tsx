'use client'

import Link from 'next/link'
import { ArrowLeft, User, Calendar, CreditCard, FileText } from 'lucide-react'
import type { Booking, Property } from '@/lib/types'
import BookingStatusActions from '@/components/dashboard/BookingStatusActions'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'

const STATUS_STYLE: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  checked_in: 'bg-jungle-100 text-jungle-800',
  completed:  'bg-gray-100 text-gray-600',
  cancelled:  'bg-red-100 text-red-600',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

type FullBooking = Booking & { property: Property | null }

interface Props {
  booking: FullBooking
  posItems: any[]
}

export default function BookingDetailClient({ booking: b, posItems }: Props) {
  const { t, lang } = useI18n()
  const bd = t.bookingDetail

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/bookings" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl font-bold text-jungle-800">{b.guest_name}</h1>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold capitalize ${STATUS_STYLE[b.status]}`}>
              {b.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-0.5">{b.property?.name ?? bd.unknownProperty}</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Status actions */}
        <BookingStatusActions bookingId={b.id} currentStatus={b.status} />

        {/* Guest info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> {bd.guest}
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{bd.name}</p>
              <p className="font-medium text-gray-800">{b.guest_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{bd.email}</p>
              <a href={`mailto:${b.guest_email}`} className="font-medium text-jungle-700 hover:underline">{b.guest_email}</a>
            </div>
            {b.guest_phone && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{bd.phone}</p>
                <p className="font-medium text-gray-800">{b.guest_phone}</p>
              </div>
            )}
            {b.guest_nationality && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{bd.nationality}</p>
                <p className="font-medium text-gray-800">{b.guest_nationality}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {bd.dates}
          </h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{bd.checkIn}</p>
              <p className="font-medium text-gray-800">{formatDate(b.check_in)}</p>
            </div>
            {b.check_out && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{bd.checkOut}</p>
                <p className="font-medium text-gray-800">{formatDate(b.check_out)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{bd.guests}</p>
              <p className="font-medium text-gray-800">{b.guests_count} {b.guests_count === 1 ? bd.person : bd.people}</p>
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> {bd.financials}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">{bd.baseAmount}</span>
              <span className="font-medium text-gray-800">{formatPriceRaw(b.base_amount, lang)}</span>
            </div>
            {b.extras_amount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">{bd.posExtras}</span>
                <span className="font-medium text-gray-800">{formatPriceRaw(b.extras_amount, lang)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="font-semibold text-gray-700">{bd.total}</span>
              <span className="font-bold text-gray-900">{formatPriceRaw(b.total_amount, lang)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-400">{bd.platformFee}</span>
              <span className="text-gray-400">−{formatPriceRaw(b.platform_fee, lang)}</span>
            </div>
            <div className="flex justify-between py-2 bg-jungle-50 px-3 rounded-xl">
              <span className="font-bold text-jungle-800">{bd.yourPayout}</span>
              <span className="font-display text-lg font-bold text-jungle-800">{formatPriceRaw(b.net_payout, lang)}</span>
            </div>
          </div>
        </div>

        {/* POS items */}
        {posItems && posItems.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-4">{bd.posExtrasSection}</h2>
            <div className="space-y-2 text-sm">
              {posItems.map((item: any) => (
                <div key={item.id} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="font-medium text-gray-800">{item.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">×{item.quantity}</span>
                  </div>
                  <span className="font-medium text-gray-700">{formatPriceRaw(item.total_price, lang)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {b.notes && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> {bd.notes}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">{b.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
