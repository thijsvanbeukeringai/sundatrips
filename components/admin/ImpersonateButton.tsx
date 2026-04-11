'use client'

import { useTransition } from 'react'
import { LogIn } from 'lucide-react'
import { startImpersonation } from '@/app/actions/admin'

export default function ImpersonateButton({
  userId,
  label = 'Open backoffice',
  dark = false,
}: {
  userId: string
  label?: string
  dark?: boolean
}) {
  const [pending, startT] = useTransition()

  function handleClick() {
    startT(async () => {
      const res = await startImpersonation(userId)
      if (res?.url) window.location.href = res.url
      else if (res?.error) alert(res.error)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors ${
        dark
          ? 'text-white/80 hover:text-white hover:bg-white/10 border border-white/20'
          : 'text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-transparent hover:border-blue-200'
      }`}
    >
      <LogIn className="w-3.5 h-3.5" />
      {pending ? 'Loading…' : label}
    </button>
  )
}
