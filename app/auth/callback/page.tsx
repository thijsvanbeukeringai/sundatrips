'use client'

// This page handles Supabase invite links that use the implicit (hash) flow:
// /auth/callback?next=/onboarding#access_token=...&type=invite
//
// Hash fragments are invisible to the server, so we need a client page.
// The Supabase JS client automatically reads the hash and creates a session.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Supabase automatically exchanges the hash tokens for a session.
    // We just need to wait for the auth state to settle, then redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check if this is a new invited user who hasn't onboarded yet
        const isInvite = !!session.user.app_metadata?.invited_at
        const onboarded = !!session.user.user_metadata?.onboarded

        if (isInvite && !onboarded) {
          router.replace('/onboarding')
        } else {
          // Read ?next= param if present
          const params = new URLSearchParams(window.location.search)
          const next = params.get('next') ?? '/dashboard'
          router.replace(next)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-jungle-900 flex items-center justify-center">
      <div className="text-center">
        <svg className="w-8 h-8 animate-spin text-white/60 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
        </svg>
        <p className="text-white/60 text-sm">Signing you in…</p>
      </div>
    </div>
  )
}
