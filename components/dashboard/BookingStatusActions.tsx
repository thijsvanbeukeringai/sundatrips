'use client'

import { useTransition, useEffect, useState } from 'react'
import { updateBookingStatus } from '@/app/actions/bookings'
import type { BookingStatus } from '@/lib/types'
import { CheckCircle, LogIn, XCircle, Flag, LogOut, AlertTriangle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function BookingStatusActions({
  bookingId,
  currentStatus,
  checkOut,
}: {
  bookingId:     string
  currentStatus: BookingStatus
  checkOut?:     string | null
}) {
  const [pending, startTransition] = useTransition()
  const { t } = useI18n()
  const a = t.booking.actions

  // Checkout reminder: show when check-out day + past noon + still checked in
  const [showReminder, setShowReminder] = useState(false)
  useEffect(() => {
    if (currentStatus !== 'checked_in' || !checkOut) return
    const today = new Date().toISOString().split('T')[0]
    const isPastNoon = new Date().getHours() >= 12
    setShowReminder(checkOut === today && isPastNoon)
  }, [currentStatus, checkOut])

  const TRANSITIONS: Record<BookingStatus, { next: BookingStatus; label: string; icon: React.ReactNode; color: string }[]> = {
    pending:    [{ next: 'confirmed',  label: a.confirm,  icon: <CheckCircle className="w-4 h-4" />, color: 'bg-blue-600 hover:bg-blue-700 text-white' },
                 { next: 'cancelled',  label: a.cancel,   icon: <XCircle className="w-4 h-4" />,     color: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200' }],
    confirmed:  [{ next: 'checked_in', label: a.checkIn,  icon: <LogIn className="w-4 h-4" />,       color: 'bg-jungle-700 hover:bg-jungle-800 text-white' },
                 { next: 'cancelled',  label: a.cancel,   icon: <XCircle className="w-4 h-4" />,     color: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200' }],
    checked_in: [{ next: 'completed',  label: a.complete, icon: <Flag className="w-4 h-4" />,        color: 'bg-gray-700 hover:bg-gray-800 text-white' }],
    completed:  [],
    cancelled:  [],
  }

  function doTransition(next: BookingStatus) {
    startTransition(() => { void updateBookingStatus(bookingId, next) })
  }

  const actions = TRANSITIONS[currentStatus] ?? []

  return (
    <div className="space-y-3">
      {/* Checkout reminder banner */}
      {showReminder && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Check-out today</p>
              <p className="text-xs text-amber-600 mt-0.5">It's past noon — has this guest already departed?</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              disabled={pending}
              onClick={() => doTransition('completed')}
              className="flex items-center gap-2 text-sm font-semibold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Yes, check out now
            </button>
            <button
              onClick={() => setShowReminder(false)}
              className="text-sm font-medium text-amber-600 hover:text-amber-800 px-3 py-2 transition-colors"
            >
              Not yet
            </button>
          </div>
        </div>
      )}

      {/* Normal status actions */}
      {actions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-2">
          {actions.map(({ next, label, icon, color }) => (
            <button
              key={next}
              disabled={pending}
              onClick={() => doTransition(next)}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 ${color}`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
