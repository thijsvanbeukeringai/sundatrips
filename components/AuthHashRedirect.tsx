'use client'

// When Supabase's redirectTo URL isn't in the allowed-redirects list,
// the magic link lands on the site root with tokens in the hash fragment.
// This component detects that and forwards to /auth/callback which handles the session.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthHashRedirect() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('access_token=') && hash.includes('type=magiclink')) {
      const isImpersonation = hash.includes('impersonate') || document.cookie.includes('admin_restore')
      router.replace('/auth/callback' + (isImpersonation ? '?impersonate=1' : '') + hash)
    }
  }, [])

  return null
}
