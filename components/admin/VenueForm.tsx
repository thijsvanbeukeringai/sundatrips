'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createVenue, updateVenue } from '@/app/actions/venues'
import type { Venue } from '@/lib/types'

interface Profile { id: string; full_name: string; email: string; role: string }

const PROPERTY_TYPES = [
  { value: 'stay',     label: 'Stay (rooms / villas)' },
  { value: 'trip',     label: 'Trip (tours / day trips)' },
  { value: 'activity', label: 'Activity (yoga, surfing, …)' },
  { value: 'transfer', label: 'Transfer (drivers / shuttles)' },
]

const ISLANDS = ['Lombok', 'Bali', 'Gili Islands']

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-jungle-800/25 active:scale-[0.98]"
    >
      {pending ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
        </svg>
      ) : null}
      {pending ? 'Saving…' : label}
    </button>
  )
}

export default function VenueForm({ venue, profiles }: { venue?: Venue; profiles: Profile[] }) {
  const action = venue ? updateVenue : createVenue
  const [state, formAction] = useFormState(action, null)

  return (
    <form action={formAction} className="space-y-5">
      {venue && <input type="hidden" name="id" value={venue.id} />}

      {/* Owner (admin only — shown when no venue yet, admin picks owner) */}
      {!venue && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
            Owner *
          </label>
          <select
            name="owner_id"
            required
            defaultValue=""
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition bg-white"
          >
            <option value="" disabled>Select owner…</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.full_name || p.email} ({p.email}) — {p.role}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
          Company / Venue Name *
        </label>
        <input
          type="text"
          name="name"
          required
          defaultValue={venue?.name ?? ''}
          placeholder="e.g. Full Moon Tetebatu"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
          Description <span className="text-gray-300 normal-case">(optional)</span>
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={venue?.description ?? ''}
          placeholder="Short description of the company…"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition resize-none"
        />
      </div>

      {/* Location + Island */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
            Location *
          </label>
          <input
            type="text"
            name="location"
            required
            defaultValue={venue?.location ?? ''}
            placeholder="e.g. Tetebatu, Lombok"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
            Island *
          </label>
          <select
            name="island"
            required
            defaultValue={venue?.island ?? 'Lombok'}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition bg-white"
          >
            {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>

      {/* Allowed listing types */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
          Allowed Listing Types
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROPERTY_TYPES.map(({ value, label }) => {
            const checked = venue ? (venue.allowed_types as string[]).includes(value) : true
            return (
              <label key={value} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-jungle-200 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  name="allowed_types"
                  value={value}
                  defaultChecked={checked}
                  className="w-4 h-4 accent-jungle-700 rounded"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
          Images <span className="text-gray-300 normal-case">(one URL per line)</span>
        </label>
        <textarea
          name="images"
          rows={3}
          defaultValue={venue?.images?.join('\n') ?? ''}
          placeholder="https://…"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition resize-none font-mono text-xs"
        />
      </div>

      {/* Active toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={venue?.is_active ?? true}
          className="w-4 h-4 accent-jungle-700 rounded"
        />
        <span className="text-sm font-medium text-gray-700">Active (visible to guests)</span>
      </label>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
          {state.error}
        </p>
      )}

      <SubmitButton label={venue ? 'Save Changes' : 'Create Company'} />
    </form>
  )
}
