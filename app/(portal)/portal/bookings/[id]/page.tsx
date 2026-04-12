import { getPartnerBookingById } from '@/app/actions/partner'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Users, Phone, Mail, CalendarDays,
  MessageSquare, Euro, CheckCircle2, Clock,
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:    { label: 'Pending',    className: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed:  { label: 'Confirmed', className: 'bg-jungle-50 text-jungle-700 border-jungle-200' },
  checked_in: { label: 'Active',    className: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed:  { label: 'Completed', className: 'bg-gray-50 text-gray-500 border-gray-200' },
  cancelled:  { label: 'Cancelled', className: 'bg-red-50 text-red-600 border-red-200' },
}

function Row({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      {icon && <span className="text-gray-300 mt-0.5 flex-shrink-0">{icon}</span>}
      <div className={icon ? '' : 'pl-0'}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </div>
  )
}

export default async function PortalBookingDetailPage({ params }: { params: { id: string } }) {
  const booking = await getPartnerBookingById(params.id)
  if (!booking) notFound()

  const property = (booking as any).property
  const variant  = (booking as any).variant
  const status   = STATUS_CONFIG[booking.status] ?? { label: booking.status, className: '' }

  const checkInDate  = new Date(booking.check_in).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/portal/bookings" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Bookings
      </Link>

      {/* Service card */}
      <div className="bg-jungle-800 rounded-2xl px-5 py-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-jungle-300 text-xs font-semibold uppercase tracking-widest mb-1">
              {property?.type ?? 'service'}
            </p>
            <p className="font-display text-xl font-bold">{property?.name ?? 'Booking'}</p>
            {variant?.name && <p className="text-jungle-200 text-sm mt-0.5">{variant.name}</p>}
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${status.className} flex-shrink-0`}>
            {status.label}
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

      {/* Guest details */}
      <div className="bg-white border border-gray-100 rounded-2xl px-5 py-1">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 pt-4 mb-1">Guest</p>
        <Row label="Name"   value={booking.guest_name}  icon={<Users className="w-3.5 h-3.5" />} />
        <Row label="Email"  value={booking.guest_email} icon={<Mail className="w-3.5 h-3.5" />} />
        <Row label="Phone"  value={booking.guest_phone} icon={<Phone className="w-3.5 h-3.5" />} />
        <Row
          label="Group size"
          value={`${booking.guests_count} ${booking.guests_count === 1 ? 'person' : 'people'}`}
          icon={<Users className="w-3.5 h-3.5" />}
        />
        {booking.check_out && (
          <Row
            label="Check-out"
            value={new Date(booking.check_out).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            icon={<CalendarDays className="w-3.5 h-3.5" />}
          />
        )}
      </div>

      {/* Price */}
      <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-500">
          <Euro className="w-4 h-4" />
          <span className="text-sm font-medium">Price agreement</span>
        </div>
        <p className="font-display text-xl font-bold text-jungle-800">
          €{booking.base_amount.toLocaleString('en-EU', { minimumFractionDigits: 0 })}
        </p>
      </div>

      {/* Notes */}
      {booking.notes && (
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Notes</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{booking.notes}</p>
        </div>
      )}

      {/* Booking metadata */}
      <p className="text-[11px] text-gray-300 text-center pb-2">
        Booking #{booking.id.slice(0, 8).toUpperCase()} ·{' '}
        {new Date(booking.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  )
}
