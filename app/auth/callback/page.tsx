'use client'

// This page handles Supabase invite links that use the implicit (hash) flow:
// /auth/callback?next=/onboarding#access_token=...&type=invite
//
// Hash fragments are invisible to the server, so we need a client page.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const params      = new URLSearchParams(window.location.search)
    const next        = params.get('next') ?? '/dashboard'
    const impersonate = params.get('impersonate') === '1'

    async function handleCallback() {
      // The hash fragment contains access_token, refresh_token, etc.
      // supabase.auth.getSession() will automatically parse the hash
      // and set the session if tokens are present.
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('[auth/callback] Error getting session:', error)
        router.replace('/login?error=auth_callback_failed')
        return
      }

      if (session) {
        if (!impersonate) {
          const isInvite  = !!session.user.app_metadata?.invited_at
          const onboarded = !!session.user.user_metadata?.onboarded
          if (isInvite && !onboarded) {
            router.replace('/onboarding')
            return
          }
        }
        router.replace(next)
        return
      }

      // If no session yet, listen for auth state change (fallback)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (!newSession) return
            if (!impersonate) {
              const isInvite  = !!newSession.user.app_metadata?.invited_at
              const onboarded = !!newSession.user.user_metadata?.onboarded
              if (isInvite && !onboarded) {
                router.replace('/onboarding')
                return
              }
            }
            router.replace(next)
            subscription.unsubscribe()
          }
        }
      )

      // Timeout fallback — if nothing happens after 10 seconds, redirect to login
      setTimeout(() => {
        subscription.unsubscribe()
        router.replace('/login?error=auth_callback_timeout')
      }, 10000)
    }

    handleCallback()
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
