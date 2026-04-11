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
  booking:          FullBooking
  posItems:         POSItem[]
  catalog:          POSCatalogItem[]
  billPaymentTotal: number
  hasPayments:      boolean
}

export default function BookingDetailClient({ booking: b, posItems, catalog, billPaymentTotal, hasPayments }: Props) {
  const { t, lang } = useI18n()
  const bd = t.bookingDetail
  const router = useRouter()
  const [delPending, startDelTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')

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

          {/* Financials — outstanding only */}
          {(() => {
            const outstanding = hasPayments ? b.extras_amount : (b.base_amount + b.extras_amount)
            const isPaid = outstanding === 0
            return (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> {bd.financials}
                </h2>
                {isPaid ? (
                  <div className="flex items-center gap-2 text-jungle-700 bg-jungle-50 px-4 py-3 rounded-xl">
                    <span className="text-lg">✓</span>
                    <span className="font-semibold text-sm">Paid in full</span>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    {!hasPayments && (
                      <div className="flex justify-between py-2 border-b border-gray-50">
                        <span className="text-gray-500">Room rate</span>
                        <span className="font-medium text-gray-800">{formatPriceRaw(b.base_amount, lang)}</span>
                      </div>
                    )}
                    {b.extras_amount > 0 && (
                      <div className="flex justify-between py-2 border-b border-gray-50">
                        <span className="text-gray-500">Open bill</span>
                        <span className="font-medium text-gray-800">{formatPriceRaw(b.extras_amount, lang)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 bg-amber-50 px-3 rounded-xl">
                      <span className="font-bold text-amber-800">Outstanding</span>
                      <span className="font-display text-lg font-bold text-amber-800">{formatPriceRaw(outstanding, lang)}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Full financial summary */}
          {(() => {
            const paidExtras  = hasPayments ? billPaymentTotal - b.base_amount : 0
            const grandTotal  = hasPayments ? billPaymentTotal + b.extras_amount : b.base_amount + b.extras_amount
            const outstanding = hasPayments ? b.extras_amount : grandTotal
            return (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Full summary
                </h2>
                <div className="space-y-0 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">Room rate</span>
                    <span className="font-medium text-gray-800">{formatPriceRaw(b.base_amount, lang)}</span>
                  </div>
                  {paidExtras > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-500">Extras paid</span>
                      <span className="font-medium text-gray-800">{formatPriceRaw(paidExtras, lang)}</span>
                    </div>
                  )}
                  {b.extras_amount > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-500">Current open bill</span>
                      <span className="font-medium text-amber-700">{formatPriceRaw(b.extras_amount, lang)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="font-semibold text-gray-700">Grand total</span>
                    <span className="font-bold text-gray-900">{formatPriceRaw(grandTotal, lang)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-400">{bd.platformFee} <span className="text-[11px]">(room only)</span></span>
                    <span className="text-gray-400">−{formatPriceRaw(b.platform_fee, lang)}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-jungle-50 px-3 rounded-xl">
                    <span className="font-bold text-jungle-800">{bd.yourPayout}</span>
                    <span className="font-display text-lg font-bold text-jungle-800">{formatPriceRaw(grandTotal - b.platform_fee, lang)}</span>
                  </div>
                </div>
              </div>
            )
          })()}

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

        {/* ── Right column: live bill (only when checked in) ── */}
        {b.status === 'checked_in' && (
          <div className="xl:sticky xl:top-6 pb-24 sm:pb-0">
            <BookingPOSPanel
              bookingId={b.id}
              initialPosItems={posItems}
              catalog={catalog}
              extrasPaid={b.extras_paid}
              baseAmount={b.base_amount}
            />
          </div>
        )}

      </div>

      {/* ── Delete section — full width, below both columns ── */}
      <div className="max-w-7xl mt-6 pt-6 border-t border-gray-100 pb-28 sm:pb-0">
        {!confirmOpen ? (
          <button
            onClick={() => { setConfirmOpen(true); setConfirmName('') }}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete booking
          </button>
        ) : (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 max-w-md space-y-4">
            <div>
              <p className="text-sm font-semibold text-red-700 mb-0.5">Confirm deletion</p>
              <p className="text-xs text-red-500">
                Type <span className="font-bold">{b.guest_name}</span> to permanently delete this booking and all related data.
              </p>
            </div>
            <input
              type="text"
              value={confirmName}
              onChange={e => setConfirmName(e.target.value)}
              placeholder={b.guest_name}
              className="w-full px-3 py-2.5 rounded-xl border border-red-200 bg-white text-sm text-gray-800 focus:outline-none focus:border-red-400 placeholder-gray-300"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmOpen(false); setConfirmName('') }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={delPending || confirmName !== b.guest_name}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {delPending ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
