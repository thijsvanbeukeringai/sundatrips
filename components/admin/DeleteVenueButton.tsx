'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteVenue } from '@/app/actions/venues'
import { useRouter } from 'next/navigation'

export default function DeleteVenueButton({ id, name }: { id: string; name: string }) {
  const [confirm, setConfirm] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      await deleteVenue(id)
      router.refresh()
    })
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs text-red-600 font-medium">Delete "{name}"?</span>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="text-xs font-semibold text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {pending ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="ml-auto flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Delete
    </button>
  )
}
