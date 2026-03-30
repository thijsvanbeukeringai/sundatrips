'use client'

import { useState } from 'react'
import { CalendarDays, Users, MapPin, ArrowRight, Car, Phone, User, ChevronLeft, CheckCircle2, Clock, Ban } from 'lucide-react'
import type { Booking, ListingVariant, Property } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'
import Link from 'next/link'
import Image from 'next/image'

type BookingRow = Booking & { property: Property; variant: ListingVariant | null }

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-800',
  confirmed:  'bg-jungle-100 text-jungle-800',
  checked_in: 'bg-blue-100 text-blue-800',
  completed:  'bg-gray-100 text-gray-600',
  cancelled:  'bg-red-100 text-red-700',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending:    <Clock className="w-3.5 h-3.5" />,
  confirmed:  <CheckCircle2 className="w-3.5 h-3.5" />,
  checked_in: <CheckCircle2 className="w-3.5 h-3.5" />,
  completed:  <CheckCircle2 className="w-3.5 h-3.5" />,
  cancelled:  <Ban className="w-3.5 h-3.5" />,
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {STATUS_ICONS[status]}
      {label}
    </span>
  )
}

function BookingDetail({ booking, onBack }: { booking: BookingRow; onBack: () => void }) {
  const { t, lang } = useI18n()
  const mb = t.myBookings
  const p  = booking.property
  const v  = booking.variant
  const isTransfer  = p?.type === 'transfer'
  const isConfirmed = ['confirmed', 'checked_in', 'completed'].includes(booking.status)

  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-24">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-jungle-800 text-sm font-medium mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        {mb.title}
      </button>

      {/* Property header */}
      {p && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
          {p.images?.[0] && (
            <div className="h-40 relative">
              <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
            </div>
          )}
          <div className="p-5">
            <h1 className="font-display text-xl font-bold text-jungle-800">{p.name}</h1>
            <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-sunset-500" />
              {p.location}, {p.island}
            </p>
            {isTransfer && p.transfer_from && p.transfer_to && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-600 font-medium">
                <span>{p.transfer_from}</span>
                <ArrowRight className="w-3.5 h-3.5 text-sunset-500" />
                <span>{p.transfer_to}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Booking details</h2>
          <StatusBadge status={booking.status} label={mb.statuses[booking.status as keyof typeof mb.statuses] ?? booking.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{isTransfer ? mb.date : mb.checkIn}</p>
            <p className="font-semibold text-gray-800 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              {booking.check_in}
            </p>
          </div>
          {booking.check_out && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Check-out</p>
              <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                {booking.check_out}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{mb.guests}</p>
            <p className="font-semibold text-gray-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-gray-400" />
              {booking.guests_count}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{mb.amount}</p>
            <p className="font-semibold text-jungle-800">{formatPriceRaw(booking.base_amount, lang)}</p>
          </div>
        </div>

        {v && (
          <div className="border-t border-gray-50 pt-3">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Option</p>
            <p className="text-sm font-semibold text-gray-800">{v.name}</p>
            {v.description && <p className="text-xs text-gray-500 mt-0.5">{v.description}</p>}
          </div>
        )}

        {booking.notes && (
          <div className="border-t border-gray-50 pt-3">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-gray-600">{booking.notes}</p>
          </div>
        )}
      </div>

      {/* Driver info — transfer only */}
      {isTransfer && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">{mb.driverTitle}</h2>

          {isConfirmed && (v?.driver_name || v?.driver_phone || v?.vehicle_type || p?.driver_name || p?.driver_phone) ? (
            <div className="space-y-3">
              {(v?.vehicle_type) && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-jungle-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Car className="w-4 h-4 text-jungle-700" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">{mb.vehicleType}</p>
                    <p className="text-sm font-semibold text-gray-800">{v.vehicle_type}</p>
                  </div>
                </div>
              )}
              {(v?.driver_name || p?.driver_name) && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-jungle-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-jungle-700" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">{mb.driverName}</p>
                    <p className="text-sm font-semibold text-gray-800">{v?.driver_name ?? p?.driver_name}</p>
                  </div>
                </div>
              )}
              {(v?.driver_phone || p?.driver_phone) && (() => {
                const phone = v?.driver_phone ?? p?.driver_phone ?? ''
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-jungle-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-jungle-700" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">{mb.driverPhone}</p>
                      <a
                        href={`https://wa.me/${phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-jungle-700 hover:text-jungle-900 underline underline-offset-2"
                      >
                        {phone}
                      </a>
                    </div>
                  </div>
                )
              })()}
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800">{mb.driverReveal}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MyBookingsClient({ bookings }: { bookings: BookingRow[] }) {
  const { t, lang } = useI18n()
  const mb = t.myBookings
  const [selected, setSelected] = useState<BookingRow | null>(null)

  if (selected) {
    return <BookingDetail booking={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-32 pb-24">
      <h1 className="font-display text-3xl font-bold text-jungle-800 mb-1">{mb.title}</h1>
      <p className="text-gray-500 text-sm mb-8">{mb.sub}</p>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">{mb.noBookings}</p>
          <p className="text-sm text-gray-400 mt-1">{mb.noBookingsSub}</p>
          <Link href="/#destinations" className="inline-block mt-6 bg-jungle-800 hover:bg-jungle-900 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
            Explore listings
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <button
              key={b.id}
              onClick={() => setSelected(b)}
              className="w-full text-left bg-white rounded-2xl border border-gray-100 hover:border-jungle-200 hover:shadow-md p-5 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{b.property?.name ?? '—'}</p>
                  {b.property?.type === 'transfer' && b.property.transfer_from && b.property.transfer_to && (
                    <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      {b.property.transfer_from}
                      <ArrowRight className="w-3 h-3" />
                      {b.property.transfer_to}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {b.check_in}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {b.guests_count}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <StatusBadge status={b.status} label={mb.statuses[b.status as keyof typeof mb.statuses] ?? b.status} />
                  <span className="text-sm font-bold text-jungle-800">{formatPriceRaw(b.base_amount, lang)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
