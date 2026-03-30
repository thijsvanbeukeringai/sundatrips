'use client'

import { useTransition } from 'react'
import { assignPropertyToVenue } from '@/app/actions/venues'
import { useRouter } from 'next/navigation'

export default function AssignPropertyPanel({
  propertyId,
  venueId,
  label,
}: {
  propertyId: string
  venueId: string | null
  label: string
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handle() {
    startTransition(async () => {
      await assignPropertyToVenue(propertyId, venueId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        venueId
          ? 'text-jungle-700 hover:text-jungle-900 hover:bg-jungle-50'
          : 'text-red-500 hover:text-red-700 hover:bg-red-50'
      }`}
    >
      {pending ? '…' : label}
    </button>
  )
}
