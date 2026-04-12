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
      // Parse tokens from the hash fragment manually
      const hash = window.location.hash.substring(1) // remove the #
      const hashParams = new URLSearchParams(hash)
      const accessToken  = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        // Set the session explicitly using the tokens from the hash
        const { data: { session }, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          console.error('[auth/callback] Error setting session:', error)
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
      }

      // Fallback: check if there's already a session (e.g. PKCE flow)
      const { data: { session } } = await supabase.auth.getSession()
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

      // No tokens and no session — redirect to login
      router.replace('/login?error=auth_callback_failed')
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
