// Centralised access to public environment variables.
// Expo inlines anything prefixed with EXPO_PUBLIC_ at build time.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly in development so a missing .env is obvious.
  console.warn(
    '[env] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in your Supabase credentials.'
  )
}

export const env = {
  supabaseUrl: supabaseUrl ?? '',
  supabaseAnonKey: supabaseAnonKey ?? '',
}
