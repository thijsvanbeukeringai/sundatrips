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
    const params      = new URLSearchParams(window.location.search)
    const next        = params.get('next') ?? '/dashboard'
    const impersonate = params.get('impersonate') === '1'

    function handleSession(session: { user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } } | null) {
      if (!session) return
      if (!impersonate) {
        const isInvite  = !!session.user.app_metadata?.invited_at
        const onboarded = !!session.user.user_metadata?.onboarded
        if (isInvite && !onboarded) {
          router.replace('/onboarding')
          return
        }
      }
      router.replace(next)
    }

    // 1. Listen for auth state changes (covers the hash / token flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') handleSession(session)
    })

    // 2. Fallback: if already signed in (e.g. PKCE code already exchanged),
    //    the event won't fire — check the session directly.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSession(session)
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
