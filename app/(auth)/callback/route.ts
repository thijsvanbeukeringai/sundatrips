import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Supabase redirects here after email confirmation / magic link / OAuth.
// We exchange the code (PKCE) or token_hash (invite/magic-link) for a session cookie,
// then send the user to the right place.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const tokenHash  = searchParams.get('token_hash')
  const type       = searchParams.get('type') as 'invite' | 'magiclink' | 'recovery' | null
  const next       = searchParams.get('next') ?? '/dashboard'
  const error      = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }

  const supabase = await createClient()
  let sessionError: unknown = null

  if (code) {
    // PKCE flow
    const { error: err } = await supabase.auth.exchangeCodeForSession(code)
    sessionError = err
  } else if (tokenHash && type) {
    // Invite / magic-link token flow
    const { error: err } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    sessionError = err
  } else {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  if (sessionError) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // New user from invite → send to onboarding to set password + complete profile
  const { data: { user } } = await supabase.auth.getUser()
  const isInvite = type === 'invite' || !!user?.app_metadata?.invited_at
  if (isInvite && !user?.user_metadata?.onboarded) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
