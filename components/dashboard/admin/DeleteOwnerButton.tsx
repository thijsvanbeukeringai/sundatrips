'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteOwner } from '@/app/actions/admin'
import { useRouter } from 'next/navigation'

export default function DeleteOwnerButton({ ownerId, name }: { ownerId: string; name: string }) {
  const [confirm, setConfirm] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteOwner(ownerId)
      if (result?.error) {
        setError(result.error)
        setConfirm(false)
      } else {
        router.refresh()
      }
    })
  }

  if (error) {
    return (
      <span className="text-xs text-red-500 px-3 py-1.5">
        {error}
      </span>
    )
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600 font-medium">Delete "{name}"? This cannot be undone.</span>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
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
      className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Delete account
    </button>
  )
}
