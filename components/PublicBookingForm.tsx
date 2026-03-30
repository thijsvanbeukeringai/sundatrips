'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle, Users, CalendarDays, ChevronDown } from 'lucide-react'
import { createPublicBooking } from '@/app/actions/publicBooking'
import type { Property, ListingVariant } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition'
const labelClass = 'block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5'

interface Props {
  property:        Property
  variants:        ListingVariant[]
  triggerVariantId?: string | null
  triggerDate?:      string | null
}

function diffNights(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
}

function calcAmount(property: Property, variant: ListingVariant | null, checkIn: string, checkOut: string, guests: number): number {
  const price = variant ? variant.price_per_unit : property.price_per_unit
  const unit  = variant ? variant.price_unit     : property.price_unit
  if (unit === 'night' || unit === 'day') {
    if (!checkIn || !checkOut) return price
    return price * diffNights(checkIn, checkOut)
  }
  if (unit === 'trip' || unit === 'vehicle' || unit === 'session') return price
  return price * Math.max(1, guests)
}

export default function PublicBookingForm({ property, variants, triggerVariantId, triggerDate }: Props) {
  const { t, lang } = useI18n()
  const l = t.listing
  const isStay     = property.type === 'stay'
  const isTransfer = property.type === 'transfer'
  const activeVariants = variants.filter(v => v.is_active)
  const formRef = useRef<HTMLDivElement>(null)

  const [open,       setOpen]       = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const [variant,   setVariant]   = useState<ListingVariant | null>(null)
  const [checkIn,   setCheckIn]   = useState('')
  const [checkOut,  setCheckOut]  = useState('')
  const [date,      setDate]      = useState('')

  // External triggers from variant/slot buttons
  useEffect(() => {
    if (!triggerVariantId && !triggerDate) return
    if (triggerVariantId) {
      const v = activeVariants.find(v => v.id === triggerVariantId)
      if (v) setVariant(v)
    }
    if (triggerDate) setDate(triggerDate)
    setOpen(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }, [triggerVariantId, triggerDate])
  const [guests,    setGuests]    = useState(1)
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [phone,     setPhone]     = useState('')
  const [message,   setMessage]   = useState('')

  const displayPrice = variant ? variant.price_per_unit : property.price_per_unit
  const displayUnit  = variant ? variant.price_unit     : property.price_unit
  const amount       = calcAmount(property, variant, checkIn, checkOut, guests)

  const unitLabel: Record<string, string> = {
    night:   `/ ${t.common.night}`,
    person:  `/ ${t.common.person}`,
    session: `/ ${t.common.session}`,
    day:     `/ ${t.common.day}`,
    trip:    `/ ${t.common.trip}`,
    vehicle: `/ ${t.common.vehicle}`,
  }

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
      check_in:     isStay ? checkIn : date,
      check_out:    isStay ? checkOut : null,
      base_amount:  amount,
      notes:        [variant ? `Option: ${variant.name}` : '', message].filter(Boolean).join('\n'),
      variant_id:   variant?.id ?? null,
    })

    setLoading(false)
    if (result.error) { setError(result.error); return }
    setSubmitted(true)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div ref={formRef} className="sticky top-28 bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100 p-6 space-y-5">

      {/* Price */}
      <div>
        <span className="font-display text-3xl font-bold text-jungle-800">
          {formatPriceRaw(displayPrice, lang)}
        </span>
        <span className="text-gray-400 text-sm ml-1">{unitLabel[displayUnit] ?? `/ ${displayUnit}`}</span>
        {activeVariants.length > 0 && !variant && (
          <p className="text-xs text-gray-400 mt-0.5">{l.fromPrice}</p>
        )}
      </div>

      {/* Variant picker */}
      {activeVariants.length > 0 && (
        <div>
          <label className={labelClass}>{l.selectVariant}</label>
          <div className="relative">
            <select
              className={inputClass + ' appearance-none pr-8'}
              value={variant?.id ?? ''}
              onChange={e => setVariant(activeVariants.find(v => v.id === e.target.value) ?? null)}
            >
              <option value="">{l.selectVariant}…</option>
              {activeVariants.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} — {formatPriceRaw(v.price_per_unit, lang)} / {v.price_unit}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      <hr className="border-gray-100" />

      {/* Payment badge */}
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <span className="text-lg">💵</span>
        <div>
          <p className="text-sm font-semibold text-emerald-800">{l.payOnArrival}</p>
          <p className="text-xs text-emerald-600">{l.noOnlinePayment}</p>
        </div>
      </div>

      {/* Success state */}
      {submitted ? (
        <div className="py-6 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 bg-jungle-50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-jungle-600" />
          </div>
          <p className="font-semibold text-jungle-800">{l.successTitle}</p>
          <p className="text-sm text-gray-500">{l.successSub}</p>
          <button onClick={() => { setSubmitted(false); setOpen(false) }} className="text-xs text-jungle-700 underline underline-offset-2 mt-1">
            {l.sendAnother}
          </button>
        </div>

      ) : !open ? (
        /* CTA button */
        <button
          onClick={() => setOpen(true)}
          className="block w-full bg-jungle-800 hover:bg-jungle-900 text-white font-semibold py-4 rounded-xl text-center transition-colors"
        >
          {l.bookNow}
        </button>

      ) : (
        /* Booking form */
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Dates */}
          {isStay ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>{l.checkIn}</label>
                <input type="date" required min={today} value={checkIn} onChange={e => setCheckIn(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{l.checkOut}</label>
                <input type="date" required min={checkIn || today} value={checkOut} onChange={e => setCheckOut(e.target.value)} className={inputClass} />
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClass}>{l.date}</label>
              <input type="date" required min={today} value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
            </div>
          )}

          {/* Guests */}
          <div>
            <label className={labelClass}>
              <Users className="inline w-3 h-3 mr-1" />
              {isTransfer ? l.passengersCount : l.guestsCount}
            </label>
            <input
              type="number" required min={1} max={property.max_capacity ?? 99}
              value={guests} onChange={e => setGuests(parseInt(e.target.value) || 1)}
              className={inputClass}
            />
          </div>

          {/* Night count for stays */}
          {isStay && checkIn && checkOut && (
            <p className="text-xs text-gray-400 -mt-2">
              {l.nightsCount(diffNights(checkIn, checkOut))} · {formatPriceRaw(amount, lang)} {t.common.currency}
            </p>
          )}

          {/* Guest details */}
          <div>
            <label className={labelClass}>{l.yourName}</label>
            <input type="text" required placeholder="John Smith" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{l.yourEmail}</label>
            <input type="email" required placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{l.yourPhone}</label>
            <input type="tel" placeholder={l.phonePH} value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{l.message}</label>
            <textarea rows={3} placeholder={l.messagePH} value={message} onChange={e => setMessage(e.target.value)} className={inputClass + ' resize-none'} />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Price summary */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 text-sm">
            <span className="text-gray-500">{t.pos.total}</span>
            <span className="font-bold text-jungle-800">{formatPriceRaw(amount, lang)}</span>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? l.submitting : l.submit}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              {l.cancel}
            </button>
          </div>
        </form>
      )}

      {/* Trust indicators */}
      {!open && !submitted && (
        <>
          <hr className="border-gray-100" />
          <div className="space-y-2 text-xs text-gray-500">
            <p className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-jungle-600 flex-shrink-0" />
              {l.verifiedOwner}
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-jungle-600 flex-shrink-0" />
              {l.realtimeAvail}
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-jungle-600 flex-shrink-0" />
              {l.freePlatform}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
