'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { getPartnerProperties, createPartnerBooking } from '@/app/actions/partner'

const input = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition bg-white'
const label = 'block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5'

type Property = Awaited<ReturnType<typeof getPartnerProperties>>[number]
type Variant  = Property['variants'][number]

export default function NewPartnerBookingPage() {
  const router = useRouter()

  const [properties,    setProperties]    = useState<Property[]>([])
  const [propertyId,    setPropertyId]    = useState('')
  const [variantId,     setVariantId]     = useState('')
  const [checkIn,       setCheckIn]       = useState('')
  const [checkOut,      setCheckOut]      = useState('')
  const [guestName,     setGuestName]     = useState('')
  const [guestEmail,    setGuestEmail]    = useState('')
  const [guestPhone,    setGuestPhone]    = useState('')
  const [guestsCount,   setGuestsCount]   = useState(1)
  const [notes,         setNotes]         = useState('')
  const [loading,       setLoading]       = useState(false)
  const [loadingProps,  setLoadingProps]  = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [done,          setDone]          = useState(false)

  useEffect(() => {
    getPartnerProperties().then(p => { setProperties(p); setLoadingProps(false) })
  }, [])

  const selectedProperty = properties.find(p => p.id === propertyId)
  const variants: Variant[] = selectedProperty?.variants ?? []
  const selectedVariant = variants.find(v => v.id === variantId)

  const today = new Date().toISOString().split('T')[0]

  // Price
  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 1
  const priceUnit  = selectedVariant?.price_unit ?? selectedProperty?.price_unit ?? 'night'
  const priceBase  = selectedVariant?.price_per_unit ?? selectedProperty?.price_per_unit ?? 0
  const total      = (priceUnit === 'night' || priceUnit === 'day') ? priceBase * nights : priceBase

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!propertyId) return
    setLoading(true)
    setError(null)

    const result = await createPartnerBooking({
      property_id:  propertyId,
      variant_id:   variantId || null,
      guest_name:   guestName,
      guest_email:  guestEmail,
      guest_phone:  guestPhone || null,
      guests_count: guestsCount,
      check_in:     checkIn,
      check_out:    checkOut || null,
      base_amount:  total,
      notes:        notes || null,
    })

    setLoading(false)
    if (result.error) { setError(result.error); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-16">
        <CheckCircle className="w-12 h-12 text-jungle-500" />
        <h2 className="font-display text-2xl font-bold text-gray-900">Booking created!</h2>
        <p className="text-gray-500 text-sm">The booking has been saved successfully.</p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => { setDone(false); setGuestName(''); setGuestEmail(''); setGuestPhone(''); setNotes(''); setCheckIn(''); setCheckOut('') }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            New booking
          </button>
          <Link
            href="/portal/bookings"
            className="px-4 py-2.5 rounded-xl bg-jungle-800 text-white text-sm font-semibold hover:bg-jungle-900 transition-colors"
          >
            View all bookings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Link href="/portal/bookings" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Bookings
      </Link>

      <h1 className="font-display text-2xl font-bold text-gray-900">New Booking</h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Service */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Service</p>

          {loadingProps ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading your services…
            </div>
          ) : properties.length === 0 ? (
            <p className="text-sm text-gray-500">No services assigned yet. Contact Sunda Trips.</p>
          ) : (
            <>
              <div>
                <label className={label}>Service *</label>
                <select
                  required
                  value={propertyId}
                  onChange={e => { setPropertyId(e.target.value); setVariantId('') }}
                  className={input}
                >
                  <option value="">Select a service…</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {variants.length > 0 && (
                <div>
                  <label className={label}>Option / Package</label>
                  <select
                    value={variantId}
                    onChange={e => setVariantId(e.target.value)}
                    className={input}
                  >
                    <option value="">No specific option</option>
                    {variants.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} — €{v.price_per_unit} / {v.price_unit}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        {/* Dates */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Date</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>Date *</label>
              <input type="date" required min={today} value={checkIn} onChange={e => setCheckIn(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>End date <span className="font-normal normal-case text-gray-400">(optional)</span></label>
              <input type="date" min={checkIn || today} value={checkOut} onChange={e => setCheckOut(e.target.value)} className={input} />
            </div>
          </div>
        </div>

        {/* Guests */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Guest details</p>

          <div>
            <label className={label}>Guest name *</label>
            <input type="text" required placeholder="John Smith" value={guestName} onChange={e => setGuestName(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>Email *</label>
            <input type="email" required placeholder="john@example.com" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>Phone / WhatsApp</label>
            <input type="tel" placeholder="+31 612 345 678" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>Number of people *</label>
            <input type="number" required min={1} max={99} value={guestsCount} onChange={e => setGuestsCount(parseInt(e.target.value) || 1)} className={input} />
          </div>
          <div>
            <label className={label}>Notes</label>
            <textarea rows={2} placeholder="Special requests, pickup location…" value={notes} onChange={e => setNotes(e.target.value)} className={input + ' resize-none'} />
          </div>
        </div>

        {/* Price summary */}
        {priceBase > 0 && propertyId && (
          <div className="flex items-center justify-between bg-jungle-50 border border-jungle-100 rounded-2xl px-5 py-4">
            <div className="text-sm text-jungle-700">
              €{priceBase} / {priceUnit}
              {(priceUnit === 'night' || priceUnit === 'day') && checkIn && checkOut && (
                <span className="ml-1 text-jungle-500">× {nights} {priceUnit}{nights !== 1 ? 's' : ''}</span>
              )}
            </div>
            <p className="font-display text-lg font-bold text-jungle-800">€{total.toLocaleString('en-EU', { minimumFractionDigits: 0 })}</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !propertyId || !checkIn || !guestName || !guestEmail}
          className="w-full flex items-center justify-center gap-2 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Saving…' : 'Create Booking'}
        </button>
      </form>
    </div>
  )
}
