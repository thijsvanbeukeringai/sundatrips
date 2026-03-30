'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { useI18n } from '@/lib/i18n'

const STATUS_IDS = ['all', 'pending', 'confirmed', 'checked_in', 'completed', 'cancelled']

export default function BookingStatusFilter({
  counts,
  current,
  q,
}: {
  counts: Record<string, number>
  current: string
  q: string
}) {
  const router   = useRouter()
  const pathname = usePathname()
  const { t }    = useI18n()

  const STATUSES = [
    { id: 'all',        label: t.listings.all },
    { id: 'pending',    label: 'Pending' },
    { id: 'confirmed',  label: 'Confirmed' },
    { id: 'checked_in', label: 'Checked In' },
    { id: 'completed',  label: 'Completed' },
    { id: 'cancelled',  label: 'Cancelled' },
  ]

  const navigate = useCallback((status: string, search: string) => {
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (search) params.set('q', search)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }, [router, pathname])

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search guest name or email…"
          defaultValue={q}
          onChange={(e) => navigate(current, e.target.value)}
          className="w-full sm:w-72 pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition bg-white"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUSES.map(({ id, label }) => {
          const count  = id === 'all' ? counts.all : counts[id]
          const active = current === id || (id === 'all' && (current === 'all' || !current))
          return (
            <button
              key={id}
              onClick={() => navigate(id, q)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-jungle-800 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {label}
              {count != null && count > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold ${active ? 'text-white/70' : 'text-gray-400'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
