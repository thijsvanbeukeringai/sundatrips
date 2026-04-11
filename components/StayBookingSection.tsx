'use client'

import { useState, useTransition } from 'react'
import { BedDouble, Loader2, CheckCircle, X, Users, CalendarDays } from 'lucide-react'
import { getAvailableRoomsForBooking } from '@/app/actions/availability'
import type { AvailableVariant } from '@/app/actions/availability'
import { createPublicBooking } from '@/app/actions/publicBooking'
import type { Property } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'

const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition bg-white'
const labelClass = 'block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5'

function diffNights(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
}

interface SelectedRoom {
  variantId:    string
  variantName:  string
  pricePerUnit: number
  priceUnit:    string
  roomId:       string
  roomNumber:   string
  roomName:     string | null
}

interface GuestModalProps {
  room:       SelectedRoom
  checkIn:    string
  checkOut:   string
  property:   Property
  onClose:    () => void
  onSuccess:  () => void
}

function GuestModal({ room, checkIn, checkOut, property, onClose, onSuccess }: GuestModalProps) {
  const { t, lang } = useI18n()
  const nights = diffNights(checkIn, checkOut)
  const total  = room.priceUnit === 'night' || room.priceUnit === 'day'
    ? room.pricePerUnit * nights
    : room.pricePerUnit

  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [phone,   setPhone]   = useState('')
  const [guests,  setGuests]  = useState(1)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await createPublicBooking({
      property_id:  property.id,
      owner_id:     property.owner_id,
      guest_name:   name,
      guest_email:  email,
      guest_phone:  phone,
      guests_count: guests,
      check_in:     checkIn,
      check_out:    checkOut,
      base_amount:  total,
      notes:        message,
      variant_id:   room.variantId,
      room_id:      room.roomId,
    })
    setLoading(false)
    if (result.error) { setError(result.error); return }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BedDouble className="w-4 h-4 text-jungle-600" />
              <p className="font-bold text-gray-900">Room {room.roomNumber}{room.roomName ? ` · ${room.roomName}` : ''}</p>
            </div>
            <p className="text-xs text-gray-500">{room.variantName} · {checkIn} → {checkOut} · {nights} night{nights !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors ml-3 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Full name *</label>
              <input type="text" required placeholder="John Smith" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" required placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" placeholder="+62 812 345 6789" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>
                <Users className="inline w-3 h-3 mr-1" />
                Guests
              </label>
              <input type="number" required min={1} max={property.max_capacity ?? 99} value={guests} onChange={e => setGuests(parseInt(e.target.value) || 1)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Message (optional)</label>
              <textarea rows={2} placeholder="Any special requests?" value={message} onChange={e => setMessage(e.target.value)} className={inputClass + ' resize-none'} />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
            )}

            {/* Price summary */}
            <div className="flex items-center justify-between bg-jungle-50 border border-jungle-100 rounded-xl px-4 py-3">
              <div className="text-sm text-jungle-700">
                {formatPriceRaw(room.pricePerUnit, 'en')} × {nights} night{nights !== 1 ? 's' : ''}
              </div>
              <div className="font-bold text-jungle-800 text-lg">{formatPriceRaw(total, 'en')}</div>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <span className="text-base">💵</span>
              <p className="text-xs text-emerald-700 font-medium">Pay on arrival — no online payment needed</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Sending request…' : 'Request booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function StayBookingSection({ property }: { property: Property }) {
  const { lang } = useI18n()
  const today = new Date().toISOString().split('T')[0]

  const [checkIn,           setCheckIn]           = useState('')
  const [checkOut,          setCheckOut]           = useState('')
  const [availableVariants, setAvailableVariants]  = useState<AvailableVariant[] | null>(null)
  const [fetching,          startFetch]            = useTransition()
  const [selectedRoom,      setSelectedRoom]       = useState<SelectedRoom | null>(null)
  const [success,           setSuccess]            = useState(false)

  function handleDateChange(newIn: string, newOut: string) {
    setAvailableVariants(null)
    setSuccess(false)
    if (!newIn || !newOut) return
    startFetch(async () => {
      const result = await getAvailableRoomsForBooking(property.id, newIn, newOut)
      setAvailableVariants(result)
    })
  }

  function setIn(v: string) {
    setCheckIn(v)
    handleDateChange(v, checkOut)
  }

  function setOut(v: string) {
    setCheckOut(v)
    handleDateChange(checkIn, v)
  }

  const nights = checkIn && checkOut ? diffNights(checkIn, checkOut) : 0

  return (
    <>
      <div className="space-y-6">

        {/* Date picker */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-4 h-4 text-jungle-600" />
            <h3 className="font-semibold text-gray-900">Check availability</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Check-in</label>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={e => setIn(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Check-out</label>
              <input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={e => setOut(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          {nights > 0 && (
            <p className="text-xs text-gray-400 mt-2">{nights} night{nights !== 1 ? 's' : ''}</p>
          )}
        </div>

        {/* Loading */}
        {fetching && (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking availability…
          </div>
        )}

        {/* No rooms */}
        {!fetching && availableVariants !== null && availableVariants.length === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
            <p className="text-sm font-semibold text-red-700">No rooms available for these dates</p>
            <p className="text-xs text-red-500 mt-1">Try different dates.</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-jungle-50 border border-jungle-200 rounded-2xl px-5 py-6 flex flex-col items-center text-center gap-3">
            <CheckCircle className="w-8 h-8 text-jungle-600" />
            <p className="font-semibold text-jungle-800">Booking request sent!</p>
            <p className="text-sm text-jungle-600">You'll receive a confirmation by email.</p>
            <button
              onClick={() => { setSuccess(false); setAvailableVariants(null); setCheckIn(''); setCheckOut('') }}
              className="text-xs text-jungle-700 underline underline-offset-2"
            >
              Make another booking
            </button>
          </div>
        )}

        {/* Available rooms */}
        {!fetching && !success && availableVariants && availableVariants.length > 0 && (
          <div className="space-y-5">
            {availableVariants.map(variant => (
              <div key={variant.id}>
                {/* Variant header */}
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{variant.name}</h3>
                  <span className="text-sm text-gray-500">
                    <span className="font-bold text-jungle-800">{formatPriceRaw(variant.price_per_unit, lang)}</span>
                    {' '}/{variant.price_unit}
                  </span>
                </div>

                {/* Room cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {variant.rooms.map(room => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedRoom({
                        variantId:    variant.id,
                        variantName:  variant.name,
                        pricePerUnit: variant.price_per_unit,
                        priceUnit:    variant.price_unit,
                        roomId:       room.id,
                        roomNumber:   room.room_number,
                        roomName:     room.name,
                      })}
                      className="flex flex-col items-center gap-1.5 p-4 bg-white border-2 border-gray-200 hover:border-jungle-500 hover:bg-jungle-50 rounded-2xl transition-all group text-left"
                    >
                      <BedDouble className="w-5 h-5 text-gray-400 group-hover:text-jungle-600 transition-colors" />
                      <p className="font-bold text-gray-900 text-sm">Room {room.room_number}</p>
                      {room.name && <p className="text-[11px] text-gray-400">{room.name}</p>}
                      {room.floor != null && <p className="text-[11px] text-gray-400">Floor {room.floor}</p>}
                      <span className="mt-1 text-[11px] font-semibold text-jungle-700 bg-jungle-50 group-hover:bg-jungle-100 px-2 py-0.5 rounded-full transition-colors">
                        Select →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guest details modal */}
      {selectedRoom && (
        <GuestModal
          room={selectedRoom}
          checkIn={checkIn}
          checkOut={checkOut}
          property={property}
          onClose={() => setSelectedRoom(null)}
          onSuccess={() => { setSelectedRoom(null); setSuccess(true) }}
        />
      )}
    </>
  )
}
