'use client'

import { useTransition } from 'react'
import { LogOut, UserCheck } from 'lucide-react'
import { stopImpersonation } from '@/app/actions/admin'

export default function ImpersonationBanner({
  adminName,
  targetName,
}: {
  adminName:  string
  targetName: string
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex-shrink-0 bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
      <span className="flex items-center gap-2 font-medium">
        <UserCheck className="w-4 h-4 flex-shrink-0" />
        Viewing as <strong>{targetName}</strong>
      </span>
      <button
        onClick={() => startTransition(() => { void stopImpersonation() })}
        disabled={pending}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 font-semibold px-3 py-1 rounded-lg transition-colors text-xs"
      >
        <LogOut className="w-3.5 h-3.5" />
        {pending ? 'Returning…' : `Back to ${adminName}`}
      </button>
    </div>
  )
}
