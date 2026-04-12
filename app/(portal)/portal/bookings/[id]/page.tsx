'use client'

import { useState, useEffect } from 'react'
import { getPartnerBookingById, acceptPartnerBooking, declinePartnerBooking } from '@/app/actions/partner'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Users, Phone, Mail, CalendarDays,
  MessageSquare, Euro, Loader2, CheckCircle, Clock, XCircle,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  confirmed:  'bg-jungle-50 text-jungle-700 border-jungle-200',
  checked_in: 'bg-blue-50 text-blue-700 border-blue-200',
  completed:  'bg-gray-50 text-gray-500 border-gray-200',
  cancelled:  'bg-red-50 text-red-600 border-red-200',
}

function Row({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      {icon && <span className="text-gray-300 mt-0.5 flex-shrink-0">{icon}</span>}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm text-gray-800 break-all sm:break-normal">{value}</p>
      </div>
    </div>
  )
}

export default function PortalBookingDetailPage() {
  const { t, lang } = useI18n()
  const params = useParams()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [declined, setDeclined] = useState(false)

  const locale = lang === 'id' ? 'id-ID' : 'en-GB'
  const statusLabel = (status: string) =>
    t.myBookings.statuses[status as keyof typeof t.myBookings.statuses] ?? status.replace('_', ' ')

  useEffect(() => {
    getPartnerBookingById(params.id as string).then(data => {
      setBooking(data)
      setLoading(false)
    })
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="text-center py-20 text-gray-400 text-sm">
        {t.portal.bookings.noBookings}
      </div>
    )
  }

  async function handleAccept() {
    setAccepting(true)
    const result = await acceptPartnerBooking(booking.id)
    setAccepting(false)
    if (!result.error) {
      setBooking({ ...booking, status: 'confirmed' })
      setAccepted(true)
      setTimeout(() => setAccepted(false), 4000)
    }
  }

  async function handleDecline() {
    if (!confirm('Are you sure you want to decline this booking?')) return
    setDeclining(true)
    const result = await declinePartnerBooking(booking.id)
    setDeclining(false)
    if (!result.error) {
      setBooking({ ...booking, status: 'cancelled' })
      setDeclined(true)
      setTimeout(() => setDeclined(false), 4000)
    }
  }

  const property = booking.property
  const variant  = booking.variant

  const checkInDate = new Date(booking.check_in).toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/portal/bookings" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {t.portal.bookings.title}
      </Link>

      {/* Service card */}
      <div className="bg-jungle-800 rounded-2xl px-4 sm:px-5 py-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-jungle-300 text-xs font-semibold uppercase tracking-widest mb-1">
              {property?.type ? (t.types[property.type as keyof typeof t.types] ?? property.type) : t.portal.bookingDetail.service}
            </p>
            <p className="font-display text-lg sm:text-xl font-bold truncate">{property?.name ?? t.portal.bookingDetail.booking}</p>
            {variant?.name && <p className="text-jungle-200 text-sm mt-0.5">{variant.name}</p>}
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[booking.status] ?? ''} flex-shrink-0`}>
            {statusLabel(booking.status)}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-jungle-200">
          <CalendarDays className="w-4 h-4 text-jungle-400" />
          {checkInDate}
        </div>

        {property?.location && (
          <div className="mt-1.5 flex items-center gap-2 text-sm text-jungle-200">
            <MapPin className="w-4 h-4 text-jungle-400" />
            {property.location}{property.island ? `, ${property.island}` : ''}
          </div>
        )}
      </div>

      {/* Accept / Decline buttons for pending bookings */}
      {booking.status === 'pending' && (
        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            disabled={accepting || declining}
            className="flex-1 flex items-center justify-center gap-2 bg-jungle-700 hover:bg-jungle-800 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors"
          >
            {accepting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t.portal.bookingDetail.accepting}</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> {t.portal.bookingDetail.accept}</>
            )}
          </button>
          <button
            onClick={handleDecline}
            disabled={accepting || declining}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 font-semibold transition-colors"
          >
            {declining ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            Decline
          </button>
        </div>
      )}

      {accepted && (
        <div className="bg-jungle-50 border border-jungle-200 text-jungle-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {t.portal.bookingDetail.accepted}
        </div>
      )}

      {declined && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          Booking declined
        </div>
      )}

      {/* Pickup time (for transfers) */}
      {booking.pickup_time && (
        <div className="bg-white border border-gray-100 rounded-2xl px-4 sm:px-5 py-4 flex items-center gap-3">
          <Clock className="w-4 h-4 text-jungle-600" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{t.portal.bookingDetail.pickupTime}</p>
            <p className="text-sm font-semibold text-gray-800">{booking.pickup_time}</p>
          </div>
        </div>
      )}

      {/* Guest details */}
      <div className="bg-white border border-gray-100 rounded-2xl px-4 sm:px-5 py-1">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 pt-4 mb-1">{t.portal.bookingDetail.guest}</p>
        <Row label={t.bookingDetail.name}  value={booking.guest_name}  icon={<Users className="w-3.5 h-3.5" />} />
        <Row label={t.bookingDetail.email} value={booking.guest_email} icon={<Mail className="w-3.5 h-3.5" />} />
        <Row label={t.bookingDetail.phone} value={booking.guest_phone} icon={<Phone className="w-3.5 h-3.5" />} />
        <Row
          label={t.portal.bookingDetail.groupSize}
          value={`${booking.guests_count} ${booking.guests_count === 1 ? t.portal.bookingDetail.person : t.portal.bookingDetail.people}`}
          icon={<Users className="w-3.5 h-3.5" />}
        />
        {booking.check_out && (
          <Row
            label={t.portal.bookingDetail.checkOut}
            value={new Date(booking.check_out).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
            icon={<CalendarDays className="w-3.5 h-3.5" />}
          />
        )}
      </div>

      {/* Price */}
      <div className="bg-white border border-gray-100 rounded-2xl px-4 sm:px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-500">
          <Euro className="w-4 h-4" />
          <span className="text-sm font-medium">{t.portal.bookingDetail.priceAgreement}</span>
        </div>
        <p className="font-display text-xl font-bold text-jungle-800">
          Rp {booking.base_amount.toLocaleString(locale, { minimumFractionDigits: 0 })}
        </p>
      </div>

      {/* Notes */}
      {booking.notes && (
        <div className="bg-white border border-gray-100 rounded-2xl px-4 sm:px-5 py-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">{t.portal.bookingDetail.notes}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{booking.notes}</p>
        </div>
      )}

      {/* Booking metadata */}
      <p className="text-[11px] text-gray-300 text-center pb-2">
        {t.portal.bookingDetail.booking} #{booking.booking_number ?? booking.id.slice(0, 8).toUpperCase()} ·{' '}
        {new Date(booking.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  )
}
