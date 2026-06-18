import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'
import type { Profile, Role } from '@/lib/types'

// Roles that belong to the partner/management side of the product.
// Anyone else (no profile, or a plain guest) belongs to the customer side.
const PARTNER_ROLES: Role[] = ['owner', 'admin', 'crew', 'partner']

export type Audience = 'customer' | 'partner'

interface AuthState {
  /** Still resolving the initial session / profile. */
  loading: boolean
  session: Session | null
  profile: Profile | null
  /** Which side of the app this user belongs to. */
  audience: Audience
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithOtp: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

function deriveAudience(profile: Profile | null): Audience {
  if (profile && PARTNER_ROLES.includes(profile.role)) return 'partner'
  return 'customer'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const mounted = useRef(true)

  async function loadProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    return (data as Profile | null) ?? null
  }

  useEffect(() => {
    mounted.current = true

    // 1. Hydrate the current session on launch.
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session
      if (!mounted.current) return
      setSession(s)
      setProfile(s?.user ? await loadProfile(s.user.id) : null)
      setLoading(false)
    })

    // 2. React to future auth changes (login, logout, token refresh).
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!mounted.current) return
      setSession(s)
      setProfile(s?.user ? await loadProfile(s.user.id) : null)
    })

    return () => {
      mounted.current = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      profile,
      audience: deriveAudience(profile),
      async signInWithPassword(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error?.message ?? null }
      },
      async signInWithOtp(email) {
        const { error } = await supabase.auth.signInWithOtp({ email })
        return { error: error?.message ?? null }
      },
      async signOut() {
        await supabase.auth.signOut()
      },
      async refreshProfile() {
        if (session?.user) setProfile(await loadProfile(session.user.id))
      },
    }),
    [loading, session, profile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
