'use client'

import { useState, useTransition } from 'react'
import { Trash2, KeyRound, Pencil, Check, X, Mail, Phone, Building2 } from 'lucide-react'
import { deleteOwner, sendPasswordReset, updateUserProfile } from '@/app/actions/admin'
import { useRouter } from 'next/navigation'

interface UserRowProps {
  user: {
    id: string
    full_name: string
    email: string
    phone: string | null
    role: 'owner' | 'admin'
  }
  listingCount: number
  isYou: boolean
}

export default function UserRow({ user, listingCount, isYou }: UserRowProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view')
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Edit state
  const [name, setName]   = useState(user.full_name)
  const [role, setRole]   = useState<'owner' | 'admin'>(user.role)

  function showFeedback(type: 'success' | 'error', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 3000)
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updateUserProfile(user.id, { full_name: name, role })
      if (res?.error) { showFeedback('error', res.error) } else {
        setMode('view')
        showFeedback('success', 'Saved')
        router.refresh()
      }
    })
  }

  function handlePasswordReset() {
    startTransition(async () => {
      const res = await sendPasswordReset(user.id)
      if (res?.error) { showFeedback('error', res.error) } else {
        showFeedback('success', `Password reset email sent to ${user.email}`)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteOwner(user.id)
      if (res?.error) { showFeedback('error', res.error); setMode('view') } else {
        router.refresh()
      }
    })
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-colors ${
      isYou ? 'border-jungle-200' : mode === 'delete' ? 'border-red-200' : 'border-gray-100'
    }`}>

      {/* Main row */}
      <div className="px-5 py-4 flex items-center gap-4">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
          isYou ? 'bg-jungle-100 text-jungle-700' : 'bg-sunset-100 text-sunset-600'
        }`}>
          {(user.full_name || user.email).charAt(0).toUpperCase()}
        </div>

        {/* Info or edit fields */}
        {mode === 'edit' ? (
          <div className="flex-1 flex flex-wrap items-center gap-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 min-w-[140px] px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-jungle-500"
              placeholder="Full name"
            />
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'owner' | 'admin')}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-jungle-500"
            >
              <option value="owner">owner</option>
              <option value="admin">admin</option>
            </select>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 text-sm">{user.full_name || '—'}</p>
              {isYou && <span className="text-[10px] font-bold bg-jungle-100 text-jungle-700 px-1.5 py-0.5 rounded-full">You</span>}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'
              }`}>{user.role}</span>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" />{user.email}
            </p>
            {user.phone && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Phone className="w-3 h-3" />{user.phone}
              </p>
            )}
          </div>
        )}

        {/* Listing count */}
        <div className="flex-shrink-0 text-right hidden sm:block">
          <p className="font-display font-bold text-lg text-jungle-800">{listingCount}</p>
          <p className="text-[10px] text-gray-400 flex items-center gap-1 justify-end">
            <Building2 className="w-3 h-3" />listings
          </p>
        </div>
      </div>

      {/* Feedback bar */}
      {feedback && (
        <div className={`px-5 py-2 text-xs font-medium ${
          feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Action footer */}
      {!isYou && (
        <div className="border-t border-gray-50 bg-gray-50/50 px-4 py-2 flex flex-wrap items-center gap-1">
          {mode === 'view' && (
            <>
              <button
                onClick={() => setMode('edit')}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-jungle-700 hover:bg-white px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-200"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={handlePasswordReset}
                disabled={pending}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-700 hover:bg-white px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-200 disabled:opacity-50"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Send password reset
              </button>
              <button
                onClick={() => setMode('delete')}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-600 hover:bg-white px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          )}

          {mode === 'edit' && (
            <>
              <button
                onClick={handleSave}
                disabled={pending || !name.trim()}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-jungle-700 hover:bg-jungle-800 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {pending ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => { setMode('view'); setName(user.full_name); setRole(user.role) }}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </>
          )}

          {mode === 'delete' && (
            <>
              <span className="text-xs text-red-600 font-medium flex-1">
                Permanently delete "{user.full_name || user.email}" and all their data?
              </span>
              <button
                onClick={handleDelete}
                disabled={pending}
                className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {pending ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setMode('view')}
                className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
