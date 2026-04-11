'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { BedDouble, CheckCircle2, AlertTriangle, Wrench, User, ChevronDown } from 'lucide-react'
import { updateRoomStatus } from '@/app/actions/rooms'
import type { Room, ListingVariant, Property, Booking, RoomStatus } from '@/lib/types'

type RoomWithRelations = Room & {
  variant:  ListingVariant | null
  property: Pick<Property, 'id' | 'name'> | null
}

type ActiveBooking = Pick<Booking, 'id' | 'room_id' | 'guest_name' | 'check_in' | 'check_out' | 'status'>

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS: Record<RoomStatus, { label: string; bg: string; border: string; text: string; icon: React.ReactNode; dot: string }> = {
  available:      { label: 'Available',      bg: 'bg-jungle-50',  border: 'border-jungle-200', text: 'text-jungle-800', icon: <CheckCircle2 className="w-4 h-4" />, dot: 'bg-jungle-500' },
  occupied:       { label: 'Occupied',        bg: 'bg-blue-50',    border: 'border-blue-200',   text: 'text-blue-800',   icon: <User className="w-4 h-4" />,          dot: 'bg-blue-500' },
  needs_cleaning: { label: 'Needs cleaning',  bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-800',  icon: <AlertTriangle className="w-4 h-4" />, dot: 'bg-amber-500' },
  maintenance:    { label: 'Maintenance',     bg: 'bg-red-50',     border: 'border-red-200',    text: 'text-red-700',    icon: <Wrench className="w-4 h-4" />,        dot: 'bg-red-400' },
}

const STATUS_ORDER: RoomStatus[] = ['occupied', 'needs_cleaning', 'available', 'maintenance']

const NEXT_STATUS: Partial<Record<RoomStatus, { status: RoomStatus; label: string }>> = {
  needs_cleaning: { status: 'available',      label: 'Mark as ready' },
  available:      { status: 'maintenance',    label: 'Set maintenance' },
  maintenance:    { status: 'available',      label: 'Mark available' },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── Room card ─────────────────────────────────────────────────────────────────

function RoomCard({
  room,
  booking,
}: {
  room:    RoomWithRelations
  booking: ActiveBooking | undefined
}) {
  const [pending, startTransition] = useTransition()
  const [status, setStatus]        = useState<RoomStatus>(room.status)
  const [menuOpen, setMenuOpen]    = useState(false)

  const st      = STATUS[status]
  const nextSt  = NEXT_STATUS[status]

  function changeStatus(next: RoomStatus) {
    setMenuOpen(false)
    startTransition(async () => {
      await updateRoomStatus(room.id, next)
      setStatus(next)
    })
  }

  return (
    <div className={`rounded-2xl border-2 p-4 flex flex-col gap-3 ${st.bg} ${st.border} ${!room.is_active ? 'opacity-50' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <BedDouble className={`w-4 h-4 ${st.text}`} />
          <div>
            <p className={`font-bold text-base ${st.text}`}>Room {room.room_number}</p>
            {room.name && <p className="text-xs text-gray-500">{room.name}</p>}
          </div>
        </div>
        <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${st.text} bg-white/60`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          {st.label}
        </span>
      </div>

      {/* Room type */}
      {room.variant && (
        <p className="text-xs text-gray-500 font-medium">{room.variant.name}</p>
      )}

      {/* Current guest */}
      {booking && (
        <div className="bg-white/70 rounded-xl p-2.5 space-y-0.5">
          <p className="text-xs font-bold text-gray-700">{booking.guest_name}</p>
          <p className="text-[11px] text-gray-400">
            {formatDate(booking.check_in)}
            {booking.check_out ? ` → ${formatDate(booking.check_out)}` : ''}
          </p>
          <Link
            href={`/dashboard/bookings/${booking.id}`}
            className="text-[11px] font-semibold text-jungle-700 hover:underline"
          >
            View booking →
          </Link>
        </div>
      )}

      {/* Status action */}
      <div className="relative mt-auto">
        {nextSt ? (
          <div className="flex gap-1">
            <button
              onClick={() => changeStatus(nextSt.status)}
              disabled={pending}
              className="flex-1 text-xs font-semibold py-1.5 px-3 bg-white/80 hover:bg-white border border-white/50 rounded-lg transition-colors disabled:opacity-50"
            >
              {pending ? 'Updating…' : nextSt.label}
            </button>
            {/* More options */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="text-xs font-semibold py-1.5 px-2 bg-white/80 hover:bg-white border border-white/50 rounded-lg transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-xl shadow-lg p-1 z-10 min-w-[160px]">
                  {STATUS_ORDER.filter(s => s !== status).map(s => (
                    <button
                      key={s}
                      onClick={() => changeStatus(s)}
                      className="w-full text-left text-xs font-medium px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className={`w-2 h-2 rounded-full ${STATUS[s].dot}`} />
                      {STATUS[s].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Occupied — no direct action (controlled by booking status)
          <p className="text-[11px] text-center text-gray-400 italic">Status controlled by booking</p>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RoomsOverview({
  rooms,
  activeBookings,
}: {
  rooms:          RoomWithRelations[]
  activeBookings: ActiveBooking[]
}) {
  const [filter, setFilter] = useState<RoomStatus | 'all'>('all')

  const bookingByRoom = Object.fromEntries(
    activeBookings.map(b => [b.room_id!, b])
  )

  const counts = {
    all:            rooms.length,
    available:      rooms.filter(r => r.status === 'available').length,
    occupied:       rooms.filter(r => r.status === 'occupied').length,
    needs_cleaning: rooms.filter(r => r.status === 'needs_cleaning').length,
    maintenance:    rooms.filter(r => r.status === 'maintenance').length,
  }

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter)

  // Group by property
  const properties = Array.from(new Set(rooms.map(r => r.property?.id).filter(Boolean)))
  const grouped = properties.map(propId => ({
    property: rooms.find(r => r.property?.id === propId)?.property ?? null,
    rooms:    filtered.filter(r => r.property?.id === propId),
  })).filter(g => g.rooms.length > 0)

  const FILTER_TABS: { key: RoomStatus | 'all'; label: string; color: string }[] = [
    { key: 'all',            label: `All (${counts.all})`,                       color: 'bg-gray-800 text-white' },
    { key: 'occupied',       label: `Occupied (${counts.occupied})`,              color: 'bg-blue-600 text-white' },
    { key: 'needs_cleaning', label: `Needs cleaning (${counts.needs_cleaning})`,  color: 'bg-amber-500 text-white' },
    { key: 'available',      label: `Available (${counts.available})`,            color: 'bg-jungle-700 text-white' },
    { key: 'maintenance',    label: `Maintenance (${counts.maintenance})`,        color: 'bg-red-500 text-white' },
  ]

  return (
    <div className="p-4 sm:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-jungle-800">Rooms</h1>
          <p className="text-gray-400 text-sm mt-1">{counts.occupied} occupied · {counts.needs_cleaning} need cleaning · {counts.available} available</p>
        </div>
        <Link
          href="/dashboard/properties"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          Manage rooms →
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === tab.key ? tab.color : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {rooms.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <BedDouble className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">No rooms yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">Go to a property and add rooms under the Rooms tab.</p>
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-2 bg-jungle-800 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-jungle-900 transition-colors"
          >
            Go to properties
          </Link>
        </div>
      )}

      {/* Rooms grouped by property */}
      {grouped.map(({ property, rooms: propRooms }) => (
        <div key={property?.id ?? 'ungrouped'} className="mb-8">
          {grouped.length > 1 && property && (
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-semibold text-gray-700 text-sm">{property.name}</h2>
              <Link href={`/dashboard/properties/${property.id}/rooms`} className="text-xs text-jungle-700 hover:underline">
                Manage →
              </Link>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {propRooms.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                booking={bookingByRoom[room.id]}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
