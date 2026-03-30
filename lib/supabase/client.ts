import { createBrowserClient } from '@supabase/ssr'

// Used in Client Components and event handlers.
// Creates one instance per call — safe because @supabase/ssr deduplicates internally.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
