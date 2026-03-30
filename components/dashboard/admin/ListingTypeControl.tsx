'use client'

import { useTransition } from 'react'
import { setOwnerAllowedTypes } from '@/app/actions/admin'

const ALL_TYPES = [
  { value: 'stay',     label: '🏠 Stay' },
  { value: 'trip',     label: '🧭 Trip' },
  { value: 'activity', label: '🏄 Activity' },
  { value: 'transfer', label: '🚗 Transfer' },
]

export default function ListingTypeControl({
  ownerId,
  current,
}: {
  ownerId: string
  current: string[]
}) {
  const [pending, startTransition] = useTransition()

  function toggle(type: string) {
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type]
    // Always keep at least 1 type
    if (next.length === 0) return
    startTransition(() => { void setOwnerAllowedTypes(ownerId, next) })
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {ALL_TYPES.map(t => (
        <button
          key={t.value}
          disabled={pending}
          onClick={() => toggle(t.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
            current.includes(t.value)
              ? 'bg-jungle-800 text-white'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
