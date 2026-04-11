'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createBooking } from '@/app/actions/bookings'
import { getAvailableRoomsForBooking } from '@/app/actions/availability'
import type { AvailableVariant } from '@/app/actions/availability'
import type { Property } from '@/lib/types'
import { ArrowLeft, Save, BedDouble, Loader2, CalendarDays, User, Banknote } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'

type PropertyOption = Pick<Property, 'id' | 'name' | 'type' | 'price_per_unit' | 'price_unit'>

const labelClass = 'block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5'
const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition bg-white'

function SubmitButton() {
  const { pending } = useFormStatus()
  const { t } = useI18n()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-jungle-800/25"
    >
      {pending
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <Save className="w-4 h-4" />}
      {pending ? t.booking.saving : t.booking.create}
    </button>
  )
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-jungle-600">{icon}</span>
      <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">{title}</h2>
    </div>
  )
}

export default function BookingForm({ properties }: { properties: PropertyOption[] }) {
  const { t } = useI18n()
  const bk = t.booking
  const [state, formAction] = useFormState(createBooking, null)

  const [propertyId,       setPropertyId]       = useState(properties[0]?.id ?? '')
  const [checkIn,          setCheckIn]           = useState('')
  const [checkOut,         setCheckOut]          = useState('')
  const [availableVariants, setAvailableVariants] = useState<AvailableVariant[] | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [selectedRoomId,    setSelectedRoomId]    = useState('')
  const [fetching,          startFetch]           = useTransition()

  const selectedProperty = properties.find(p => p.id === propertyId)
  const selectedVariant  = availableVariants?.find(v => v.id === selectedVariantId)
  const availableRooms   = selectedVariant?.rooms ?? []

  // Fetch availability when property + both dates are filled
  useEffect(() => {
    if (!propertyId || !checkIn || !checkOut) {
      setAvailableVariants(null)
      setSelectedVariantId('')
      setSelectedRoomId('')
      return
    }
    setSelectedVariantId('')
    setSelectedRoomId('')
    startFetch(async () => {
      const result = await getAvailableRoomsForBooking(propertyId, checkIn, checkOut)
      setAvailableVariants(result)
      if (result.length === 1) {
        setSelectedVariantId(result[0].id)
        if (result[0].rooms.length === 1) setSelectedRoomId(result[0].rooms[0].id)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, checkIn, checkOut])

  // Reset room when variant changes
  useEffect(() => {
    setSelectedRoomId('')
    if (selectedVariant?.rooms.length === 1) {
      setSelectedRoomId(selectedVariant.rooms[0].id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariantId])

  const basePrice = selectedVariant?.price_per_unit ?? selectedProperty?.price_per_unit ?? ''

  function handlePropertyChange(id: string) {
    setPropertyId(id)
    setAvailableVariants(null)
    setSelectedVariantId('')
    setSelectedRoomId('')
  }

  const datesReady    = !!(checkIn && checkOut)
  const variantReady  = !!selectedVariantId
  const roomReady     = !!selectedRoomId

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/bookings" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-jungle-800">{bk.newBooking}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{bk.newBookingSub}</p>
        </div>
      </div>

      {state?.error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {state.error}
        </div>
      )}

      {properties.length === 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
          {bk.noListings}{' '}
          <Link href="/dashboard/properties/new" className="font-semibold underline">{bk.createListingFirst}</Link>
        </div>
      )}

      <form action={formAction} className="space-y-4">

        {/* Hidden fields */}
        <input type="hidden" name="property_id"  value={propertyId} />
        <input type="hidden" name="variant_id"   value={selectedVariantId} />
        <input type="hidden" name="room_id"       value={selectedRoomId} />

        {/* ── 1. Property ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <SectionHeader icon={<BedDouble className="w-4 h-4" />} title={bk.listing} />
          <select
            value={propertyId}
            onChange={e => handlePropertyChange(e.target.value)}
            className={inputClass}
          >
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* ── 2. Dates ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <SectionHeader icon={<CalendarDays className="w-4 h-4" />} title={bk.dates} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{bk.checkIn} *</label>
              <input
                name="check_in"
                type="date"
                required
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{bk.checkOut}</label>
              <input
                name="check_out"
                type="date"
                min={checkIn || undefined}
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* ── 3. Room type + room number ───────────────────────────────────── */}
        <div className={`bg-white rounded-2xl border p-6 transition-opacity ${datesReady ? 'border-gray-100 opacity-100' : 'border-gray-100 opacity-40 pointer-events-none'}`}>
          <SectionHeader icon={<BedDouble className="w-4 h-4" />} title="Room" />

          {/* Loading */}
          {fetching && (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking availability…
            </div>
          )}

          {/* No rooms / not fetched yet */}
          {!fetching && datesReady && availableVariants !== null && availableVariants.length === 0 && (
            <p className="text-sm text-amber-600 font-medium">No rooms available for these dates.</p>
          )}

          {/* Variant picker */}
          {!fetching && availableVariants && availableVariants.length > 0 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Room type *</label>
                <select
                  value={selectedVariantId}
                  onChange={e => setSelectedVariantId(e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="" disabled>Select a room type…</option>
                  {availableVariants.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} — €{v.price_per_unit}/{v.price_unit}
                      {' '}· {v.rooms.length} room{v.rooms.length !== 1 ? 's' : ''} available
                    </option>
                  ))}
                </select>
              </div>

              {/* Room number picker — shown once a variant is selected */}
              {variantReady && availableRooms.length > 0 && (
                <div>
                  <label className={labelClass}>Room number *</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableRooms.map(room => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`flex flex-col items-center py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                          selectedRoomId === room.id
                            ? 'border-jungle-600 bg-jungle-50 text-jungle-800'
                            : 'border-gray-200 hover:border-jungle-300 text-gray-700'
                        }`}
                      >
                        <BedDouble className="w-4 h-4 mb-1 opacity-60" />
                        <span>{room.room_number}</span>
                        {room.name && <span className="text-[10px] font-normal text-gray-400 truncate w-full text-center">{room.name}</span>}
                        {room.floor != null && <span className="text-[10px] font-normal text-gray-400">Floor {room.floor}</span>}
                      </button>
                    ))}
                  </div>
                  {!roomReady && (
                    <p className="text-xs text-amber-600 mt-2">Select a room number to continue.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Prompt when dates not yet filled */}
          {!datesReady && (
            <p className="text-sm text-gray-400">Fill in the dates above to see available rooms.</p>
          )}
        </div>

        {/* ── 4. Guest info ─────────────────────────────────────────────────── */}
        <div className={`bg-white rounded-2xl border border-gray-100 p-6 transition-opacity ${roomReady ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <SectionHeader icon={<User className="w-4 h-4" />} title={bk.guest} />
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>{bk.fullName} *</label>
              <input name="guest_name" type="text" required placeholder="Jan de Vries" className={inputClass} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>{bk.email} *</label>
              <input name="guest_email" type="email" required placeholder="jan@example.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{bk.phone}</label>
              <input name="guest_phone" type="tel" placeholder="+31 6 12345678" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{bk.nationality}</label>
              <input name="guest_nationality" type="text" placeholder={bk.nationalityPH} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{bk.guests} *</label>
              <input name="guests_count" type="number" required min="1" defaultValue="1" className={inputClass} />
            </div>
          </div>
        </div>

        {/* ── 5. Financials ─────────────────────────────────────────────────── */}
        <div className={`bg-white rounded-2xl border border-gray-100 p-6 transition-opacity ${roomReady ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <SectionHeader icon={<Banknote className="w-4 h-4" />} title={bk.financials} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{bk.baseAmount} *</label>
              <input
                name="base_amount"
                type="number"
                required
                min="0"
                step="0.01"
                key={`${propertyId}-${selectedVariantId}`}
                defaultValue={basePrice}
                className={inputClass}
              />
              <p className="text-[11px] text-gray-400 mt-1">{bk.baseAmountHelper}</p>
            </div>
            <div>
              <label className={labelClass}>{bk.status}</label>
              <select name="status" defaultValue="confirmed" className={inputClass}>
                <option value="pending">{bk.pending}</option>
                <option value="confirmed">{bk.confirmed}</option>
                <option value="checked_in">{bk.checkedIn}</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>{bk.paymentMethod}</label>
              <select name="payment_method" defaultValue="cash" className={inputClass}>
                <option value="cash">{bk.cash}</option>
                <option value="stripe">{bk.online}</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 6. Notes ──────────────────────────────────────────────────────── */}
        <div className={`bg-white rounded-2xl border border-gray-100 p-6 transition-opacity ${roomReady ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <label className={labelClass}>{bk.notes}</label>
          <textarea name="notes" rows={3} placeholder={bk.notesPH} className={inputClass + ' resize-none'} />
        </div>

        <div className="flex gap-3 pb-8">
          <SubmitButton />
          <Link href="/dashboard/bookings" className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            {bk.cancel}
          </Link>
        </div>
      </form>
    </div>
  )
}
