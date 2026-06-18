import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppState } from 'react-native'
import { createClient } from '@supabase/supabase-js'

import { env } from './env'

// Single Supabase client for the whole app.
// - Sessions are persisted in AsyncStorage so users stay logged in.
// - detectSessionInUrl is false: there is no browser URL to parse on native.
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Keep the access token fresh while the app is in the foreground and pause
// auto-refresh in the background (recommended by Supabase for React Native).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
