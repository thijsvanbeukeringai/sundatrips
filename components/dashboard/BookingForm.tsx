'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createBooking } from '@/app/actions/bookings'
import type { Property } from '@/lib/types'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n'

type PropertyOption = Pick<Property, 'id' | 'name' | 'type' | 'price_per_unit' | 'price_unit'>

const labelClass = 'block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5'
const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition'

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
        ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" /></svg>
        : <Save className="w-4 h-4" />}
      {pending ? t.booking.saving : t.booking.create}
    </button>
  )
}

export default function BookingForm({ properties }: { properties: PropertyOption[] }) {
  const { t } = useI18n()
  const bk = t.booking
  const [state, formAction]   = useFormState(createBooking, null)
  const [selectedId, setSelectedId] = useState(properties[0]?.id ?? '')

  const selected = properties.find(p => p.id === selectedId)

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

      <form action={formAction} className="space-y-6">

        {/* Property */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">{bk.listing}</h2>
          <div>
            <label className={labelClass}>{bk.listingLabel} *</label>
            <select
              name="property_id"
              required
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className={inputClass + ' bg-white'}
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — €{p.price_per_unit}/{p.price_unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Guest info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">{bk.guest}</h2>

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
          </div>
        </div>

        {/* Dates & guests */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">{bk.dates}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{bk.checkIn} *</label>
              <input name="check_in" type="date" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{bk.checkOut}</label>
              <input name="check_out" type="date" className={inputClass} />
              <p className="text-[11px] text-gray-400 mt-1">{bk.checkOutHelper}</p>
            </div>
            <div>
              <label className={labelClass}>{bk.guests} *</label>
              <input name="guests_count" type="number" required min="1" defaultValue="1" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">{bk.financials}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{bk.baseAmount} *</label>
              <input
                name="base_amount"
                type="number"
                required
                min="0"
                step="0.01"
                defaultValue={selected?.price_per_unit ?? ''}
                className={inputClass}
              />
              <p className="text-[11px] text-gray-400 mt-1">{bk.baseAmountHelper}</p>
            </div>
            <div>
              <label className={labelClass}>{bk.status}</label>
              <select name="status" defaultValue="confirmed" className={inputClass + ' bg-white'}>
                <option value="pending">{bk.pending}</option>
                <option value="confirmed">{bk.confirmed}</option>
                <option value="checked_in">{bk.checkedIn}</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>{bk.paymentMethod}</label>
              <select name="payment_method" defaultValue="cash" className={inputClass + ' bg-white'}>
                <option value="cash">{bk.cash}</option>
                <option value="stripe">{bk.online}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
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
