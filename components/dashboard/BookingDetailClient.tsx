'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { ArrowLeft, User, Calendar, CreditCard, FileText, Trash2 } from 'lucide-react'
import type { Booking, POSCatalogItem, POSItem, Property } from '@/lib/types'
import BookingStatusActions from '@/components/dashboard/BookingStatusActions'
import BookingPOSPanel from '@/components/dashboard/BookingPOSPanel'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'
import { deleteBooking } from '@/app/actions/bookings'

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
  booking:  FullBooking
  posItems: POSItem[]
  catalog:  POSCatalogItem[]
}

export default function BookingDetailClient({ booking: b, posItems, catalog }: Props) {
  const { t, lang } = useI18n()
  const bd = t.bookingDetail
  const router = useRouter()
  const [delPending, startDelTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleDelete() {
    startDelTransition(async () => {
      const res = await deleteBooking(b.id)
      if (res?.error) {
        alert(res.error)
      } else {
        router.push('/dashboard/bookings')
        router.refresh()
      }
    })
  }

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 max-w-7xl">
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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_480px] gap-5 items-start max-w-7xl">

        {/* ── Left column: booking details ── */}
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
                <span className="text-gray-400">{bd.platformFee} <span className="text-[11px]">(room only)</span></span>
                <span className="text-gray-400">−{formatPriceRaw(b.platform_fee, lang)}</span>
              </div>
              <div className="flex justify-between py-2 bg-jungle-50 px-3 rounded-xl">
                <span className="font-bold text-jungle-800">{bd.yourPayout}</span>
                <span className="font-display text-lg font-bold text-jungle-800">{formatPriceRaw(b.net_payout, lang)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {b.notes && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> {bd.notes}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">{b.notes}</p>
            </div>
          )}

          {/* Delete */}
          <div className="pt-2">
            <button
              onClick={() => setConfirmOpen(true)}
              className="flex items-center gap-2 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete booking
            </button>
          </div>
        </div>

        {/* ── Right column: live bill ── */}
        <div className="xl:sticky xl:top-6 pb-24 sm:pb-0">
          <BookingPOSPanel
            bookingId={b.id}
            initialPosItems={posItems}
            catalog={catalog}
            extrasPaid={b.extras_paid}
            baseAmount={b.base_amount}
          />
        </div>

      </div>

      {/* Confirm dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-display font-bold text-gray-900 text-lg mb-1">Delete booking?</h3>
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-semibold text-gray-700">{b.guest_name}</span> · {b.property?.name}
            </p>
            <p className="text-xs text-gray-400 mb-6">
              All POS items and payment history for this booking will also be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={delPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {delPending ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
