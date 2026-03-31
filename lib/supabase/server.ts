import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

// Used in Server Components, Server Actions, and Route Handlers.
// Must be called inside an async context where cookies() is available.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookies are read-only there.
            // The middleware handles session refresh, so this is safe to ignore.
          }
        },
      },
    }
  )
}

// Deduplicated auth call: React cache() ensures only ONE getUser() network request
// per render tree (layout + page share the result). Safe because middleware is the
// security gate that already validated the session on every request.
export const getCachedUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

// Deduplicated profile fetch: layout + pages share one DB round-trip per request.
export const getCachedProfile = cache(async () => {
  const user = await getCachedUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return data
})
